import ExpoModulesCore
import UIKit

/**
 * 3.6.6 — iPad hardware-keyboard ⌘-shortcuts. A small invisible `ExpoView` that becomes first responder
 * while mounted and declares a fixed set of `UIKeyCommand`s; when the user presses one on a connected
 * keyboard, it emits `onCommand` with the command id to JS (which routes it — ⌘N → new debt, ⌘1–3 →
 * switch tab). Pure additive iPad polish: on iPhone / touch-only there's no hardware keyboard, so this is
 * inert, and the whole module is iOS-only (no-op shim on web/Android).
 *
 * ⚠️ Device-QA (3.6.7): UIKeyCommand routing works via the responder chain, and holding first-responder
 * reliably inside RN's view tree (text inputs + touch handling also compete for it) is the one part that
 * cannot be verified in the simulator's non-keyboard flows or on web — it needs a real iPad with a
 * hardware keyboard. The JS side degrades safely if no command ever arrives (the shortcuts just don't fire).
 */
public class KeyCommandsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KeyCommands")

    View(KeyCommandsView.self) {
      Events("onCommand")
    }
  }
}

class KeyCommandsView: ExpoView {
  private let onCommand = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // NOTE: interaction stays ENABLED on purpose — a view generally must be able to become first
    // responder for its keyCommands to be consulted, and becomeFirstResponder tends to fail when
    // interaction is off. The JS side renders it at a 0×0 frame, so it never draws or blocks a touch.
  }

  // A view must be able to become first responder for its keyCommands to be consulted first.
  override var canBecomeFirstResponder: Bool { true }

  // Grab first responder once we're in a window (and again if the tree re-lays-out around us).
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      DispatchQueue.main.async { [weak self] in
        self?.becomeFirstResponder()
      }
    }
  }

  override var keyCommands: [UIKeyCommand]? {
    let cmds = [
      UIKeyCommand(title: "New debt", action: #selector(cmdNewDebt), input: "n", modifierFlags: .command),
      UIKeyCommand(title: "Today", action: #selector(cmdTabToday), input: "1", modifierFlags: .command),
      UIKeyCommand(title: "Progress", action: #selector(cmdTabProgress), input: "2", modifierFlags: .command),
      UIKeyCommand(title: "Money", action: #selector(cmdTabMoney), input: "3", modifierFlags: .command),
    ]
    // Don't steal these from the system while typing — but keep them discoverable in the ⌘-hold HUD.
    if #available(iOS 15.0, *) {
      cmds.forEach { $0.wantsPriorityOverSystemBehavior = false }
    }
    return cmds
  }

  @objc private func cmdNewDebt() { onCommand(["id": "new-debt"]) }
  @objc private func cmdTabToday() { onCommand(["id": "tab-today"]) }
  @objc private func cmdTabProgress() { onCommand(["id": "tab-progress"]) }
  @objc private func cmdTabMoney() { onCommand(["id": "tab-money"]) }
}
