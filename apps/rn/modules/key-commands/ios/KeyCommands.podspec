Pod::Spec.new do |s|
  s.name           = 'KeyCommands'
  s.version        = '1.0.0'
  s.summary        = 'iPad hardware-keyboard ⌘-shortcuts (3.6.6).'
  s.description    = 'Local Expo module for 3.6.6: an invisible view that sits in the responder chain, declares a small set of UIKeyCommands (⌘N new debt · ⌘1–3 tab switch), and emits the pressed command to JS. iPad-only polish; inert on iPhone/touch. First-responder reliability is device-QA (3.6.7).'
  s.author         = 'Debt Planner'
  s.homepage       = 'https://debtplanner.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.4'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
