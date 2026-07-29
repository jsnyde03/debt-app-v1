Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Payday Countdown Live Activity bridge (ActivityKit start/update/end).'
  s.description    = 'Local Expo module for 3.5.3: starts, updates, and ends the Payday Countdown Live Activity from JS. The SwiftUI + ActivityConfiguration live in the widget extension (targets/widget); this module is the app-side lifecycle. All ActivityKit use is #available-guarded so the app runs unchanged below iOS 16.2.'
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
