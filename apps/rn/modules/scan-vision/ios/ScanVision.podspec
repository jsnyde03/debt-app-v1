Pod::Spec.new do |s|
  s.name           = 'ScanVision'
  s.version        = '1.0.0'
  s.summary        = 'On-device document scan + text recognition (Apple VisionKit + Vision).'
  s.description    = 'Local Expo module for §2.8 scan-to-prefill: presents VNDocumentCameraViewController and OCRs the scanned pages with VNRecognizeTextRequest, fully on device.'
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
