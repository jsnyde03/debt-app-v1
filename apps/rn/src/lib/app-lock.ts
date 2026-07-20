import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Biometric App Lock primitives (B.9). Face ID / Touch ID / device passcode via
 * expo-local-authentication. **Fail-open by design:** if the device has no biometric hardware or
 * nothing enrolled, `authenticate` returns true so a user can never lock themselves out of their own
 * financial data. Needs `NSFaceIDUsageDescription` (set in app config).
 *
 * ⚠️ Native-only — verified on a real device (Phase E); the `.web` stub fails open.
 */

export async function canUseAppLock(): Promise<boolean> {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && enrolled;
}

export async function authenticate(): Promise<boolean> {
  if (!(await canUseAppLock())) return true; // fail-open — never trap the user out
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Debt Planner',
    fallbackLabel: 'Use passcode',
  });
  return result.success;
}
