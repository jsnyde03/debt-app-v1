const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

/**
 * `react-native-ios-utilities` (5.2.0, latest) hard-references `RCTRootContentView` in
 * `RCTView+Helpers.swift` — a legacy Paper-renderer class. On RN 0.85 with the New Architecture
 * the app links a PREBUILT React core that no longer exports that class, so the final Ld step fails:
 *   Undefined symbols for architecture arm64:
 *     "_OBJC_CLASS_$_RCTRootContentView", referenced from:
 *          in libreact-native-ios-utilities.a[48](RCTView+Helpers.o)
 * It is the ONLY reference to the class in the whole library, and only feeds a nil-able fallback
 * inside `closestParentReactTouchHandler` (context-menu calls `closestParentReactTouchHandler?.cancel()`).
 * The primary path already walks the superview chain for RCTTouchHandler, so stubbing the fallback to
 * `nil` removes the dead symbol without changing real behavior.
 *
 * This dangerous-mod rewrites the `closestParentReactContentView` property at prebuild time (before
 * pod install compiles the Swift). Runs each prebuild, so it survives `npm install` restoring pristine
 * source (CI does install → prebuild → pod install). Idempotent. Delete this plugin if the library ever
 * drops the RCTRootContentView reference (or gains RN-version gating around it).
 */
const SWIFT =
  'node_modules/react-native-ios-utilities/ios/Sources/Extensions+Helpers/RCTView+Helpers.swift';

// Matches the whole computed property, from its signature through its closing `};`.
const PROP_RE =
  /var closestParentReactContentView: RCTRootContentView\? \{[\s\S]*?return rootView\.recursivelyFindSubview\(whereType: targetType\);\s*\};/;

const REPLACEMENT = `// [ios-utilities-rootcontentview-fix] RCTRootContentView is a legacy Paper class not present in
  // RN 0.85's prebuilt New-Arch React core, so referencing it fails to link. Stubbed to nil; the
  // touch-handler helper falls back through the superview chain instead.
  var closestParentReactContentView: RCTView? {
    return nil;
  };`;

module.exports = function withIosUtilitiesRootContentViewFix(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const swiftPath = path.join(cfg.modRequest.projectRoot, SWIFT);
      if (!fs.existsSync(swiftPath)) {
        console.warn(`[ios-utilities-rootcontentview-fix] source not found at ${SWIFT} — skipping`);
        return cfg;
      }
      const src = fs.readFileSync(swiftPath, 'utf8');
      if (src.includes('[ios-utilities-rootcontentview-fix]')) return cfg; // already patched
      if (!PROP_RE.test(src)) {
        console.warn(
          '[ios-utilities-rootcontentview-fix] closestParentReactContentView block not found — library may have fixed it; leaving source untouched',
        );
        return cfg;
      }
      fs.writeFileSync(swiftPath, src.replace(PROP_RE, REPLACEMENT));
      console.log(
        '[ios-utilities-rootcontentview-fix] stubbed closestParentReactContentView to drop the RCTRootContentView reference',
      );
      return cfg;
    },
  ]);
};
