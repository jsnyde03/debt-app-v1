const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/*
 * SIRI-1 (2026-07-29) - App Intents that back Siri App Shortcuts MUST be compiled into the MAIN APP
 * TARGET. Apple: an intent behind an AppShortcutsProvider cannot live in a framework/CocoaPod (dev
 * forums 757950 / 759160 / 771507), so intents in an Expo LOCAL MODULE (which builds as a pod) never
 * land in the app's Metadata.appintents -> zero shortcuts register, Siri says "hasn't added support."
 *
 * This plugin (CNG-safe, no manual ios/ edits) copies the provider + its intents into the app target and
 * adds them to the target's Sources build phase, so Xcode's App Intents metadata extraction picks them up.
 * Source Swift lives in plugins/app-intents-swift/ - deliberately OUTSIDE any modules pod.
 *
 * Device-QA (Phase 6): registration is only truly verifiable on a real build - confirm the 4 shortcuts
 * appear in the Shortcuts app + Siri voice works. If they still do not register, the target may also need
 * an explicit "Extract App Intents Metadata" build phase (modern Xcode adds it automatically when a
 * target has App Intents, so we rely on that first).
 */
const SWIFT_FILES = ['SiriQueryIntents.swift', 'LogPaymentIntent.swift'];
const GROUP = 'AppIntents';

const withAppIntents = (config) => {
  // 1) Copy the Swift into ios/<projectName>/AppIntents/ at prebuild time.
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const projectName = cfg.modRequest.projectName;
      const srcDir = path.join(__dirname, 'app-intents-swift');
      const destDir = path.join(cfg.modRequest.platformProjectRoot, projectName, GROUP);
      fs.mkdirSync(destDir, { recursive: true });
      for (const file of SWIFT_FILES) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }
      return cfg;
    },
  ]);

  // 2) Add the copied files to the MAIN app target's Sources build phase (App Intents compile from
  //    static Swift in the app target; that is what the metadata extractor scans).
  config = withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const groupKey = project.pbxCreateGroup(GROUP, path.join(projectName, GROUP));
    const mainGroup = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(groupKey, mainGroup);
    const targetUuid = project.getFirstTarget().uuid;
    for (const file of SWIFT_FILES) {
      project.addSourceFile(file, { target: targetUuid }, groupKey);
    }
    return cfg;
  });

  return config;
};

module.exports = withAppIntents;
