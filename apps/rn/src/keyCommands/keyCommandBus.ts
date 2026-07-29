/**
 * 3.6.6 — a tiny in-process bus for the one ⌘-shortcut that needs to reach a specific screen: ⌘N ("new
 * debt") has to open the Money → Debts add-sheet, whose state lives inside `DebtsSection`. The key-command
 * listener (root) navigates to Money and calls `requestAddDebt()`; `DebtsSection` subscribes and opens its
 * sheet. Pure JS (no native), so it's identical on every platform — the tab switches route directly via
 * the router and don't need the bus.
 *
 * Latching: if ⌘N fires while Debts isn't mounted yet (cold navigate from another tab), the request is
 * held and delivered to the next subscriber, so the sheet still opens once Money renders.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let pending = false;

export function requestAddDebt(): void {
  if (listeners.size === 0) {
    pending = true;
    return;
  }
  listeners.forEach((l) => l());
}

export function onAddDebtRequested(listener: Listener): () => void {
  listeners.add(listener);
  if (pending) {
    pending = false;
    listener();
  }
  return () => {
    listeners.delete(listener);
  };
}
