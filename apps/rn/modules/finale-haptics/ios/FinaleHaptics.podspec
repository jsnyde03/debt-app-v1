Pod::Spec.new do |s|
  s.name           = 'FinaleHaptics'
  s.version        = '1.0.0'
  s.summary        = 'Bespoke Core Haptics crescendo for the debt-free finale.'
  s.description    = 'Local Expo module for VIS-1: plays a bespoke CHHapticPattern (a building rumble that crests into a sharp transient) as the once-ever debt-free celebration lands. iOS Core Haptics, on-device.'
  s.author         = 'Debt Planner'
  s.homepage       = 'https://debtplanner.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.4'

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility flags (the Expo module template's standard set).
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
