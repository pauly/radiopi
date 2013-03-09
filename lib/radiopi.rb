require 'yaml'
require 'fileutils'
require 'json'
require 'taglib'

class RadioPi

  @config_file = nil
  @log_file = nil
  @config = nil
  @indexer = nil
  @index
  @player = nil

  def initialize
    @index = { :songs => [ ], :artists => { }, :tags => { } }
  end

  # Display usage info
  def usage
    'usage goes here'
  end

  # Display help
  def help
    help = self.usage + "\n"
  end

  # Config file getter
  def get_config_file
    @config_file || File.expand_path('~') + '/radiopi_config.yml'
  end

  # Log file getter
  def get_log_file
    @log_file || File.expand_path('~') + '/radiopi.log'
  end

  # Write the config file
  def put_config config = { 'player' => 'mpg321 -x -a hw:1,0 ', 'queue_folder' => '/tmp/radiopi_queue', 'base_folder' => '/mnt/Music/Various', 'queue_size' => 5 }
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
    @indexer = Thread.new do
      self.log 'indexing in a new thread...'
      self.index
      self.log 'done indexing...'
    end
    self.log 'now starting to play...'
    while true
      if self.play != 0
        sleep 30
      end
    end
  end
 
  # Play the next song in the queue
  def play 
    status = 0
    if self.queue.length < self.get_config['queue_size']
      self.log 'queue is empty! picking randomly from ' + @index[:songs].length.to_s + ' songs in index...'
      for i in 0..self.get_config['queue_size'] do
        add_to_queue @index[:songs][ rand( @index[:songs].length ) ]
      end
    end
    if self.queue.length != 0
      song = self.queue_shift
      if song and File.exist?( song )
        self.log 'player is ' + self.get_config['player'] + ' and song is ' + song
        system self.get_config['player'] + ' "' + song + '"'
        self.scrobble song
        status = 0
      else
        self.log 'cannot find ' + song
        status = -1
      end
    end
  end

  def scrobble song = ''
    p 'todo, write scrobbler. scrobbled ' + song
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
    self.log 'called index with ' + folder.to_s
    folder ||= self.get_config['base_folder']
    self.log 'looking for files in ' + folder
    files = Dir.entries folder
    files.each do | file_name |
      if file_name !~ /^\./
        path = folder + '/' + file_name
        if File.directory? path
          self.index path
        else
          @index[:songs].push path
	  TagLib::FileRef.open path do | f |
            @index[:artists][f.tag.artist] ||= []
            @index[:artists][f.tag.artist].push path
	    f.tag.genre.split(';').map(&:strip).each do | tag |
              @index[:tags][tag] ||= []
              @index[:tags][tag].push path
            end
          end
        end
      end
    end
  end

end

