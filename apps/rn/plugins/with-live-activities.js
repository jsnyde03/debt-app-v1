const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Enables Live Activities for the app (3.5.3) by setting `NSSupportsLiveActivities` in the MAIN app's
 * Info.plist — ActivityKit refuses to start an activity without it. The Live Activity's UI lives in the
 * widget extension (`targets/widget`), but this flag belongs to the app that hosts/starts it.
 *
 * Kept as a tiny config plugin (not a raw `ios.infoPlist` entry) so the intent is documented and it sits
 * alongside the other native plugins. Idempotent.
 */
module.exports = function withLiveActivities(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true;
    return cfg;
  });
};
