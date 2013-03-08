Gem::Specification.new do |s|
  s.name        = 'radiopi'
  s.version     = '0.0.0'
  s.date        = Time.now.strftime '%Y-%m-%d'
  s.summary     = 'Raspberry pi based mp3 queue'
  s.description = s.summary + ' for pi based in car radio station.'
  s.authors     = [ 'Paul Clarke' ]
  s.email       = 'pauly@clarkeology.com'
  s.files       = [ 'lib/radiopi.rb' ]
  s.homepage    = 'http://www.clarkeology.com/wiki/radiopi+ruby'
  s.executables << 'radiopi'
  s.executables << 'rpfind'
  s.add_runtime_dependency "yaml"
  s.add_runtime_dependency "fileutils"
  s.add_runtime_dependency "json"
end

