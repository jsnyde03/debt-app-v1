import XCTest

/// 4.1.6a.7 — THE PROBE, not a suite.
///
/// It exists to answer two capability questions that together gate ~16 `[D]` rows on the device
/// checklist and the re-scope of 4.1.9. Neither is a product assertion; both are "can this lane reach
/// this at all". Per the standing rule in `06-tutorial-interactions.yaml`: if a capability cannot be
/// made to work, ledger the check as device-owed — do NOT weaken it into something that passes.
///
///   ① SPRINGBOARD REACH. Every §5 (widget) and §6 (Live Activity / Dynamic Island) row is filed
///      device-only for one stated reason: "springboard surfaces outside the app under test". That is
///      true of Maestro. If XCUITest can see SpringBoard's element tree here, those rows are
///      reclassifiable and the widget/Live-Activity checks come onto the free simulator lane.
///
///   ② ACCESSIBILITY AUDIT. `performAccessibilityAudit()` is Apple's own audit (Xcode 15+) and covers
///      contrast · hit-target size · text clipped at AX sizes · missing or wrong traits — four of the
///      six bullets in the premium-accessibility sub-audit, which is currently 100% manual and which
///      🎯 Jason has said is the hardest for him to test ("VoiceOver pretty much locks down my phone").
///
/// ⚠️ Both probes report rather than fail on absence, EXCEPT where absence is the answer we need. A
/// probe that reds for an unrelated reason costs a 20-minute cycle and tells us nothing.
final class CoverageProbeUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = true
    }

    /// ① Can this lane see outside the app under test?
    func testSpringboardIsReachable() throws {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        springboard.activate()

        let reachable = springboard.wait(for: .runningForeground, timeout: 10)
        XCTAssertTrue(reachable, "SpringBoard did not come to the foreground — springboard reach is NOT available on this runner, and §5/§6 stay device-owed.")

        // The descendant count is the real signal: activating is not the same as being able to READ the
        // tree. If this is zero, XCUITest can front SpringBoard but not inspect it, which would not help.
        let elements = springboard.descendants(matching: .any).count
        print("PROBE springboard.reachable=\(reachable) springboard.elements=\(elements)")
        XCTAssertGreaterThan(elements, 0, "SpringBoard exposed no elements — reach without inspection does not unlock §5/§6.")
    }

    /// ② Does Apple's own accessibility audit run against this app on this runner?
    func testAccessibilityAuditRuns() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "the app under test never reached the foreground")

        // ⛔ WAIT FOR CONTENT, NOT JUST FOREGROUND — otherwise `findings=0` is unreadable.
        // Run 31832030295 returned 0 findings on all four types, which is plausible (this app has
        // `a11y-axe`, `lint:a11y-props`, `lint:a11y-collapse` and the 3.5.3.9 audit over it) and
        // indistinguishable from *auditing an empty screen*: `.runningForeground` means the process is
        // frontmost, NOT that React has rendered. Requiring a known element first makes a zero mean
        // "audited and clean" instead of "audited nothing".
        // ⚠️ Reported, not asserted: if the element never appears the audit numbers below are not
        // trustworthy, and saying so is more useful than failing a probe whose job is to report.
        let anchor = app.descendants(matching: .any).matching(identifier: "tab-today").firstMatch
        let rendered = anchor.waitForExistence(timeout: 20)
        print("PROBE a11yAnchor id=tab-today rendered=\(rendered) elements=\(app.descendants(matching: .any).count)")

        // ⛔ 4.1.7③ — WHEN THE ANCHOR IS ABSENT, SAY WHAT IS THERE INSTEAD. Run 32037021903 was the first
        // execution of the wait above and it reported `rendered=false elements=58`, which establishes that
        // the four `findings=0` results are not a clean bill — and then leaves you guessing WHY.
        //
        // ⚠️ The standing hypothesis is that flow `09` is terminal and clears state, so `app.launch()`
        // here comes up in onboarding with no tab bar. That is a hypothesis; this prints the evidence that
        // decides it, rather than a fix built on it. Law IV: a mechanism that arrives with a finding still
        // needs measuring, and this lane has been wrong about four of them.
        //
        // ⚡ The iPad tier does NOT run `09` — it ends on `05-tutorial-walkthrough` — so running this same
        // probe on both tiers is a free A/B on that hypothesis: onboarding identifiers on iPhone and a tab
        // bar on iPad confirms it; the same emptiness on both refutes it.
        if !rendered {
            let ids = app.descendants(matching: .any)
                .allElementsBoundByIndex
                .prefix(40)
                .map { el -> String in
                    let id = el.identifier
                    let label = el.label
                    if !id.isEmpty { return "#\(id)" }
                    if !label.isEmpty { return "\"\(label.prefix(28))\"" }
                    return "<\(el.elementType.rawValue)>"
                }
                .filter { $0 != "<0>" }
            print("PROBE a11yAnchorMiss screen=\(ids.joined(separator: " | "))")
        }

        guard #available(iOS 17.0, *) else {
            print("PROBE a11yAudit=unavailable reason=ios<17")
            throw XCTSkip("performAccessibilityAudit needs iOS 17+")
        }

        // ⚠️ Deliberately NON-FAILING on findings. This establishes that the audit EXECUTES and what it
        // reports on the first screen; turning its findings into a gate is a separate, later decision
        // once the volume is known. A probe that reds on 40 pre-existing contrast findings tells us
        // nothing about whether the mechanism works.
        //
        // ⛔ PER TYPE, BECAUSE THE WHOLE-APP AUDIT TIMED OUT AND ONE GUESS WOULD ONLY TEACH ONE THING.
        // Run 31830120940 ran the default `.all` audit for 47.7s and XCTest stopped it:
        //   Error Domain=com.apple.xcode.xctest.accessibilityAudit Code=-56 "Audit failed to complete in time"
        // ⚡ That is a SCOPING result, not a capability one — the mechanism is present and was invoked.
        // Narrowing to one guessed combination would cost a cycle and answer only whether THAT
        // combination fits. Auditing each type separately, timed, maps the whole space in one run: which
        // types complete, how slow each is, and how many findings each carries.
        //
        // These four are exactly the premium-a11y sub-audit's automatable bullets — contrast, hit-target
        // size, text clipped at AX sizes, and traits. Other types exist (`.dynamicType`,
        // `.elementDetection`, `.sufficientElementDescription`, `.action`, `.parentChild`); they are left
        // out deliberately, because every additional case is Swift that CANNOT be compile-checked off a
        // Mac and a wrong name costs a whole cycle. Add them once these four are known good.
        //
        // ⚠️ EVERY TYPE IS CAUGHT SEPARATELY AND NOTHING RETHROWS. One slow type must not abort the map —
        // that is the exact failure being diagnosed, and a probe that stops at the first red teaches one
        // thing per 20-minute cycle (4.1.1's rule).
        let auditTypes: [(String, XCUIAccessibilityAuditType)] = [
            ("contrast", .contrast),
            ("hitRegion", .hitRegion),
            ("textClipped", .textClipped),
            ("trait", .trait),
        ]

        for (name, auditType) in auditTypes {
            var findings = 0
            let started = Date()
            do {
                // ⭐ 4.1.11 — PRINT EACH FINDING, do not only count it. Run `32042253465` produced the
                // audit's first trustworthy reading (`rendered=true` on both tiers) and it was NOT a
                // clean bill: `hitRegion` = 2 findings, on both tiers — two real hit targets below the
                // minimum. And they were **unlocatable**, because this closure incremented a counter and
                // threw the issue away. A defect you cannot name is a defect nobody can fix.
                //
                // ⚠️ `element` is optional and `compactMap`-free on purpose: an issue with no element
                // still has to print, or the count and the list would disagree and the list would look
                // complete. That is the same shape as the silent-skip defect `lint:lane` was widened for.
                // ⛔ `compactDescription` AND NOTHING ELSE, deliberately. `XCUIAccessibilityAuditIssue`
                // also exposes `element` and `detailedDescription`, and I cannot compile-check Swift off a
                // Mac — the file's own header says every extra case "is Swift that CANNOT be
                // compile-checked off a Mac and a wrong name costs a whole cycle". `compactDescription`
                // is the property this probe is already certain of, it names the offending element in its
                // own text, and it is enough to turn "2 findings somewhere" into two addresses. Widen it
                // once a green run has proved this line compiles.
                try app.performAccessibilityAudit(for: auditType) { issue in
                    findings += 1
                    print("PROBE a11yFinding type=\(name) n=\(findings) issue=\(issue.compactDescription)")
                    return true // handled — do not fail the test
                }
                let secs = String(format: "%.1f", Date().timeIntervalSince(started))
                print("PROBE a11y type=\(name) status=completed seconds=\(secs) findings=\(findings)")
            } catch {
                let secs = String(format: "%.1f", Date().timeIntervalSince(started))
                print("PROBE a11y type=\(name) status=FAILED seconds=\(secs) findings=\(findings) error=\(error.localizedDescription)")
            }
        }
        print("PROBE a11yAudit=mapped types=\(auditTypes.count)")
    }

    /// ③ 4.1.7② — can this lane deliver a ⌘-key, and does the app act on it?
    ///
    /// The three `[A]` rows are §10.5 (**⌘N** → the add-debt sheet), §10.6 (**⌘1/⌘2/⌘3** → Today /
    /// Progress / Money) and §10.7 (**hold ⌘** → the iPad shortcut HUD). With Appium declined at 4.1.9,
    /// `[A]` now names a tool this project will not build, so these rows become `[X]` only if XCUITest's
    /// `typeKey(_:modifierFlags:)` actually works here — and fall to `[D]`, raising the device pass by 3,
    /// if it does not. **Either answer closes the question; neither may be assumed.**
    ///
    /// ⛔ RUNS ON THE IPAD TIER. §10 is the iPad section ("needs an iPad AND a 3.6-inclusive build"), and
    /// proving `typeKey` on an iPhone sim would prove a CAPABILITY while claiming iPad ROWS — the exact
    /// "reach is not coverage" overstatement .7.5 caught when sixteen rows nearly moved on springboard
    /// reach alone. §10.7's HUD is iPad OS chrome and does not exist on iPhone at all.
    ///
    /// ⚠️ TWO SEPARATE QUESTIONS, REPORTED SEPARATELY, because they have different owners. *Delivery* is
    /// XCUITest's (did the keystroke reach the app at all); *handling* is `KeyCommandsModule`'s, whose own
    /// header names holding first responder inside RN's view tree as the part that "cannot be verified in
    /// the simulator's non-keyboard flows". A red here could be either, and conflating them would file a
    /// product defect as a tooling limit or the reverse.
    ///
    /// ⚠️ NON-FAILING throughout — the verdict table is the deliverable (4.1.1's rule).
    func testCommandKeyReachesTheApp() throws {
        let app = XCUIApplication()
        app.launch()
        guard app.wait(for: .runningForeground, timeout: 30) else {
            print("PROBE cmdKey status=SKIPPED reason=app-never-foregrounded")
            return
        }

        // A known element first, for the same reason the audit waits: typing into a screen that has not
        // rendered would report "not handled" for a reason that has nothing to do with key delivery.
        let anchor = app.descendants(matching: .any).matching(identifier: "tab-today").firstMatch
        let ready = anchor.waitForExistence(timeout: 20)
        print("PROBE cmdKeyAnchor rendered=\(ready) elements=\(app.descendants(matching: .any).count)")

        // ⌘N → the add-debt sheet.
        //
        // ⛔ BY ITS VISIBLE TITLE, NOT AN INVENTED id. The first draft of this line matched
        // `identifier: "debt-sheet"`, which **does not exist anywhere in the app** — the Maestro flows
        // detect this sheet with `assertVisible: "Add a debt"` and there is no testID on it. A selector
        // that matches nothing reports "the key was not handled" and would have filed a tooling verdict
        // against a product that works. Caught by grepping before dispatching rather than after.
        // ⚠️ The title is a ternary on `prefill` (T3's row: "Add from scan" / "Add a debt"); ⌘N carries no
        // prefill, so "Add a debt" is the branch this path produces.
        let before = app.descendants(matching: .any).count
        app.typeKey("n", modifierFlags: .command)
        let sheet = app.staticTexts["Add a debt"].firstMatch
        let opened = sheet.waitForExistence(timeout: 5)
        let after = app.descendants(matching: .any).count
        // `delivered` is deliberately weaker than `opened`: ANY change in the tree means the keystroke
        // was received by something, even if the app routed it elsewhere. That is the difference between
        // "XCUITest cannot send ⌘-keys" and "the app did not act on one".
        print("PROBE cmdKey key=cmd-N opened=\(opened) treeChanged=\(before != after) before=\(before) after=\(after)")

        if opened {
            // Leave the app where the next assertion expects it. A modal left open would make ⌘1/2/3 look
            // unhandled for a reason that is this probe's own fault.
            app.typeKey(XCUIKeyboardKey.escape.rawValue, modifierFlags: [])
            _ = sheet.waitForExistence(timeout: 2)
        }

        // ⌘1 / ⌘2 / ⌘3 → Today / Progress / Money. Each is checked by the destination tab's own id
        // becoming selected, not by a screenshot: `tab-*` ids are already the suite's vocabulary.
        for (key, tab) in [("1", "tab-today"), ("2", "tab-progress"), ("3", "tab-money")] {
            app.typeKey(key, modifierFlags: .command)
            let target = app.descendants(matching: .any).matching(identifier: tab).firstMatch
            let exists = target.waitForExistence(timeout: 5)
            print("PROBE cmdKey key=cmd-\(key) target=\(tab) exists=\(exists) selected=\(exists ? String(target.isSelected) : "n/a")")
        }

        // ⛔ §10.7's HUD is NOT probed, and that is a stated limit rather than an omission. Holding ⌘ to
        // raise the iPad shortcut HUD is SpringBoard chrome; `typeKey` sends a keystroke, not a HELD
        // modifier, and there is no XCUITest API for "press and hold a modifier without a key". It needs
        // its own probe or it stays device-owed — the same discipline that kept StandBy permanently `[D]`.
        print("PROBE cmdKey hud=notProbed reason=no-api-for-held-modifier")
    }
}
