/**
 * The native surface for the AppIntent → store queue (3.5.3.5). Implemented on iOS by reading/clearing
 * the App-Group UserDefaults the Swift AppIntent writes to, and as a no-op on web/Android. Types live in
 * this NON platform-split file so both variants + the drain share one definition.
 */
export interface PendingActionBridge {
  /** The raw queued payload (a JSON string / decoded array / null). Web/Android → null. */
  read(): unknown;
  /** Clear the queue after a successful drain. Web/Android → no-op. */
  clear(): void;
}
