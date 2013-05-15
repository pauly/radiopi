require 'yaml'
require 'fileutils'
require 'json'
require 'taglib'
require 'lastfm'

class RadioPi

  @config_file = nil
  @log_file = nil
  @index_file = nil
  @config = nil
  @indexer = nil
  @index
  @player = nil
  @lastfm = nil

  def initialize
    @index = { }
    if File.exists? self.get_index_file
      begin
        @index = JSON.parse( File.read( self.get_index_file ))
      rescue
	self.log 'failed parsing ' + self.get_index_file
      end
    end
    @index = { 'songs' => { }, 'artists' => { }, 'tags' => { } }.merge @index
  end

  # Display usage info
  def usage
    'usage goes here'
  end

  # Display help
  def help
    help = self.usage + "\n"
  end

  # Display help
  def home_dir
    begin
      File.expand_path('~')
    rescue
      '/tmp/radiopi'
    end
  end

  # Config file getter
  def get_config_file
    @config_file || self.home_dir + '/radiopi_config.yml'
  end

  # Index file getter
  def get_index_file
    @index_file || self.home_dir + '/radiopi_index.json'
  end

  # Log file getter
  def get_log_file
    @log_file || self.home_dir + '/radiopi.log'
  end

  # Write the config file
  # does -R work in background mode?
  # def put_config config = { 'player' => 'mpg321 -R -q -a hw:1,0 ', 'queue_folder' => '/tmp/radiopi_queue', 'base_folder' => '/mnt/Music/', 'queue_size' => 5 }
  def put_config config = { 'player' => 'mpg321 -q -a hw:1,0 ', 'queue_folder' => '/tmp/radiopi_queue', 'base_folder' => '/mnt/Music/', 'queue_size' => 5 }
    puts 'put_config got ' + config.to_s
    puts 'so writing ' + YAML.dump( config )
    File.open( self.get_config_file, 'w' ) do | handle |
      handle.write YAML.dump( config )
    end
  end

  # Get the config file, create it if it does not exist
  def get_config
    if ! @config
      if ! File.exists? self.get_config_file
        self.put_config
      end
      @config = YAML.load_file self.get_config_file
    end
    if ! File.exists? @config['queue_folder']
      FileUtils.mkdir_p @config['queue_folder']
    end
    @config
  end

  def queue_file_name song = ''
    self.get_config['queue_folder'] + '/' + song.gsub( /\W+/, '-' ) + '.json';
  end

  # Add a song to the queue
  def add_to_queue song = ''
    if song
      data = { 'song' => song }
      file = self.queue_file_name( song )
      if File.exists? file
        self.log file + ' already in queue'
      else
        File.open( self.queue_file_name( song ), 'w' ) do | f |
          f.write data.to_json
        end
      end
    end
  end

  # Add a song to the queue
  def jump_queue song = ''
    if song
      self.add_to_queue song
      self.log 'todo: move ' + song + ' to the front of the queue - touch the file?'
    end
  end

  # Play
  def go
    # @indexer = Thread.new do
    #   self.index
    # end
    while true
      if self.play != 0
        sleep 30
      end
    end
    @indexer.join
  end
 
  # Play the next song in the queue
  def play 
    status = 0
    if self.queue.length < self.get_config['queue_size']
      self.log 'queue is empty!';
      if @index['songs'].keys.length
        self.log 'picking randomly from ' + @index['songs'].keys.length.to_s + ' songs in index...'
        for i in 0..self.get_config['queue_size'] do
          r = rand( @index['songs'].keys.length )
          song = @index['songs'].keys[ r ]
          add_to_queue song
	end
      end
    end
    if self.queue.length != 0
      song = self.queue_shift
      if song and File.exist?( song )
        self.log 'player is ' + self.get_config['player'] + ' and song is ' + song
        self.scrobble song
        system self.get_config['player'] + ' "' + song + '" 2> /dev/null'
        status = 0
      else
        self.log 'cannot find ' + song
        status = -1
      end
    end
  end

  def scrobble song = ''
    artist = nil, track = nil
    TagLib::FileRef.open song do | f |
      # p f.tag.inspect
      artist = f.tag.artist
      track = f.tag.title
    end
    if artist and track
      if !@lastfm and self.get_config['lastfm_api_key']
        @lastfm = Lastfm.new self.get_config['lastfm_api_key'], self.get_config['lastfm_api_secret']
	token = self.get_config['lastfm_api_token'] or @lastfm.auth.get_token
	# p 'token is ' + token.to_s + ', so http://www.last.fm/api/auth/?api_key=' + self.get_config['lastfm_api_key'] + '&token=' + token
	# p '(or should that be http://www.last.fm/api/auth/?api_key=' + self.get_config['lastfm_api_key'] + '&token=' + self.get_config['lastfm_api_token'] + ')'
        @lastfm.session = @lastfm.auth.get_session( :token => token )['key']
      end
      if @lastfm
        # p 'got lastfm, so scrobble ' + track.to_s
        # @lastfm.track.update_now_playing :artist => artist, :track => track
        @lastfm.track.scrobble :artist => artist, :track => track
      else
        p 'todo, write scrobbler and scrobble ' + artist + ' and ' + song
      end
    end
  end

  def queue_shift
    queue = self.queue
    file = queue.shift
    song = JSON.parse( File.read( file ))['song']
    FileUtils.rm file
    self.log 'shifted ' + song + ' from the queue'
    song
  end

  def queue
    folder = self.get_config['queue_folder']
    if ! File.exist? folder
      FileUtils.mkdir_p folder
    end
    queue = []
    Dir.entries( folder ).each do | f |
      if f !~ /^\./
      	queue << folder + '/' + f
      end
    end
    queue
  end

  def show_queue
    p self.queue.to_s
  end

  def log message = ''
    message = Time.now.strftime '%Y-%m-%d %H:%M:%S ' + message.to_s + "\n"
    p message # just temporarily...
    File.open( self.get_log_file, 'a' ) do | handle |
      handle.write message
    end
  end

  def index folder = nil
    # write_index = false
    write_index = true # what the hell write on every folder
    # self.log 'indexing ' + folder.to_s
    if ! folder
      folder = self.get_config['base_folder']
      write_index = true
    end
    files = Dir.entries folder
    files.each do | file_name |
      if file_name !~ /^\./
        path = folder + '/' + file_name
        if File.directory? path
          self.index path
	elsif path =~ /Unclassified/
	elsif path =~ /\.(mp3|flac|ogg)$/
          @index['songs'][path] = 1
	  TagLib::FileRef.open path do | f |
            # @index['artists'][f.tag.artist] ||= { }
            # @index['artists'][f.tag.artist][ path ] = 1
	    f.tag.genre.split(';').map(&:strip).each do | tag |
              @index['tags'][tag] ||= { }
              @index['tags'][tag][ path ] = 1
            end
          end
	else
	  self.log file_name + ' does not match'
        end
      end
    end
    if write_index
      index_file = self.get_index_file
      temp_file = index_file + '.' + Time.now.to_f.to_s
      File.open( temp_file, 'w' ) do | handle |
        # handle.write @index.to_json
        handle.write JSON.pretty_generate( @index )
      end
      FileUtils.mv temp_file, index_file
      self.log 'replaced ' + index_file + ' with ' + temp_file
    end
  end

end

