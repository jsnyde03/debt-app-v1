const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

/**
 * `react-native-ios-context-menu` (both the 3.1.x and 3.2.x lines) hardcodes an ancient Folly version
 * in its podspec — `folly_version = '2022.05.16.00'` + `s.dependency 'RCT-Folly', folly_version` in the
 * Fabric branch. RN 0.85 ships a NEWER RCT-Folly, so `pod install` fails with:
 *   [!] Unable to find a specification for `RCT-Folly (= 2022.05.16.00)`
 * The pin is redundant: the same podspec also calls `install_modules_dependencies(s)`, which pulls
 * RN's CORRECT Folly for us. This dangerous-mod comments out the hardcoded `s.dependency 'RCT-Folly'`
 * line at prebuild time (before pod install reads the podspec), letting the right Folly through.
 *
 * Runs each prebuild, so it survives `npm install` restoring the pristine podspec (CI does install →
 * prebuild → pod install). Idempotent. Delete this plugin if the library ever stops hardcoding Folly.
 */
const PODSPEC = 'node_modules/react-native-ios-context-menu/react-native-ios-context-menu.podspec';
const PIN_RE = /^(\s*)(s\.dependency\s+['"]RCT-Folly['"],\s*folly_version)/m;

module.exports = function withContextMenuFollyFix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podspecPath = path.join(cfg.modRequest.projectRoot, PODSPEC);
      if (!fs.existsSync(podspecPath)) {
        console.warn(`[context-menu-folly-fix] podspec not found at ${PODSPEC} — skipping`);
        return cfg;
      }
      const src = fs.readFileSync(podspecPath, 'utf8');
      if (src.includes('# [context-menu-folly-fix]')) return cfg; // already patched
      if (!PIN_RE.test(src)) {
        console.warn('[context-menu-folly-fix] hardcoded RCT-Folly pin not found — library may have fixed it; leaving podspec untouched');
        return cfg;
      }
      const patched = src.replace(
        PIN_RE,
        "$1# [context-menu-folly-fix] hardcoded pin removed; install_modules_dependencies supplies RN's Folly\n$1# $2",
      );
      fs.writeFileSync(podspecPath, patched);
      console.log('[context-menu-folly-fix] neutralized the hardcoded RCT-Folly pin in the context-menu podspec');
      return cfg;
    },
  ]);
};
