const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Debt Planner uses expo-notifications for LOCAL notifications only (no remote push). Autolinking
 * injects the `aps-environment` (Push) entitlement anyway — strip it so the App ID needs no Push
 * capability and the provisioning profile never has to gain one. Keeps the entitlement set clean:
 * with no special capabilities, a capability-driven profile regen isn't triggered for v1.7.
 */
module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
