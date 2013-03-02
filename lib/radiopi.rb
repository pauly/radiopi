require 'yaml'
require 'fileutils'

class RadioPi

  @config_file = nil
  @log_file = nil
  @config = nil

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
  def put_config config = { 'player' => 'mpg321 -q', 'queue_folder' => '/tmp/radiopi_queue', 'base_folder' => '/mnt/Music', 'queue_size' => 5 }
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
    @config
  end

  # Add a song to the queue
  def add_to_queue song = ''
    if song
      self.log 'todo: add ' + song + ' to the queue'
    end
  end

  # Add a song to the queue
  def jump_queue song = ''
    if song
      self.log 'todo: add ' + song + ' to the front of the queue'
    end
  end

  # Play
  def go
    self.log 'go!'
    while true
      if ! self.play
        sleep 30
      end
    end
  end
 
  # Play the next song in the queue
  def play 
    self.log 'playing...'
    status = 0
    if self.queue.length == 0
      self.log 'queue is empty!'
      status = -1
    else
      song = self.queue_shift
      if song and File.exist?( song )
        self.log 'player is ' + self.get_config['player'] + ' and song is ' + song
        system self.get_config['player'] + ' ' + song
        status = 0
      else
        self.log 'cannot find ' + song
        status = -1
      end
    end
  end

  def queue_shift
    queue = self.queue
    song = queue.shift
    FileUtils.rm song
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
    message = Time.now.strftime '%Y-%m-%d' + message + "\n"
    p message # just temporarily...
    File.open( self.get_log_file, 'a' ) do | handle |
      handle.write message
    end
  end

end

