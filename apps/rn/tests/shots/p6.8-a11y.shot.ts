import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

import { expect, test, type Page } from '@playwright/test';

import { GUARDIAN_STATE_LABEL } from '@core/copy/vocabulary';
import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * P6.8.1b — THE ACCESSIBILITY TREE, DUMPED. The instrument for lens **A1** (VoiceOver depth).
 *
 * ⛔ **react-native-web has NO VoiceOver** (`DEBT_3.5_DEVICE_QA_CHECKLIST.md:213`), so the *experience* —
 * what the voice actually says, in what rhythm, and whether it is bearable — is device-owed and always
 * will be. **But most of what goes wrong is structural, and structure is fully inspectable here.**
 *
 * What this dump can settle, off-device:
 *  - **Reading ORDER** — the tree is emitted in traversal order, so a row that reads its amount before
 *    its name, or a header that lands after the content it heads, is visible in the text.
 *  - **Is a state ANNOUNCED or only COLOURED?** The Guardian's whole job is a band — clear/tight/at-risk.
 *    If that word appears nowhere in any name/role/description, a blind user is told nothing at all, and
 *    the app's single most important signal is decorative. ⚠️ This is A1's sharpest question.
 *  - **Rows collapsed into one unreadable string** — `groupLabel()` builds these deliberately; whether the
 *    result is a sentence or a run-on of five numbers is judged by reading it.
 *  - **Unlabelled controls** — a button whose accessible name is empty, or is "button", or is an icon glyph.
 *  - **Live regions** — whether anything announces a change at all.
 *
 * What it CANNOT settle, and no lens may claim from it: rotor navigation, gesture handling, the actual
 * spoken rendering of a number ("$1,234" vs "one thousand..."), focus behaviour under a real screen
 * reader, and haptics. **Those are P6.14 rows.**
 *
 * ⚠️ Asserts nothing. Evidence. → `apps/rn/capture-ref/p6.8-a11y/<theme>/<surface>.txt`
 *
 * `npx playwright test --config apps/rn/playwright.shots.config.ts p6.8-a11y`
 */

const OUT = path.resolve(__dirname, '../../capture-ref/p6.8-a11y');
const PHONE = { width: 402, height: 874 };

function seed(over: Record<string, unknown> = {}) {
  const { prefs, ...rest } = over as { prefs?: Record<string, unknown> };
  return scenario({ prefs: { onboardingComplete: true, themeMode: 'light', ...(prefs ?? {}) }, ...rest });
}

const SURFACES: { name: string; goto: string; seedOver?: Record<string, unknown> }[] = [
  { name: 'today', goto: '/' },
  { name: 'money', goto: '/money' },
  { name: 'progress', goto: '/progress' },
  { name: 'more', goto: '/more' },
  { name: 'history', goto: '/history' },
  { name: 'living-expenses', goto: '/living-expenses' },
  { name: 'cushion-forecast', goto: '/cushion-forecast' },
  { name: 'paywall', goto: '/paywall', seedOver: { subscriptionPlan: 'free' } },
  { name: 'onboarding', goto: '/onboarding', seedOver: { prefs: { onboardingComplete: false } } },
];

/**
 * ⚠️ `page.accessibility.snapshot()` is GONE from modern Playwright (removed after deprecation; this repo
 * is on ^1.60). The first version of this file called it and every surface failed with
 * `Cannot read properties of undefined` — a reminder that an API remembered from an older version is a
 * hypothesis like any other. `locator.ariaSnapshot()` is the replacement, and it is a better fit: it
 * emits the tree as ORDERED YAML, so reading order — A1's first question — is legible without flattening
 * anything by hand.
 */

/**
 * The Guardian band words. ⛔ If none of these reaches the a11y tree on Today, the app's central signal
 * is conveyed by colour alone — which is both an accessibility failure and a product one.
 *
 * ⛔ **S1.13.7.10 [pass-6 `A1-8`] — DERIVED FROM THE PRODUCER, AND MATCHED AS A WHOLE PHRASE.**
 *
 * This was a hand-typed list — `['clear', 'tight', 'at risk', 'at-risk', 'covered', 'short']` — tested
 * with an unanchored `String.includes` on a lower-cased line. So `'clear'` matched **cleared**,
 * **unclear** and **Clear search**; `'short'` matched **shortfall** and **short of**. The printed figure
 * *"Guardian-band words present: 14"* told a reviewer nothing about the band, and the one warning branch
 * — `banded === 0` on Today or Progress — **could not fire**, because those surfaces carry such strings
 * independently of the Guardian.
 *
 * ⚡ `GUARDIAN_STATE_LABEL` is the producer: `PaydayGuardianCard`'s own docblock says *"EVERY WORD A USER
 * READS OR HEARS IS KEYED OFF THIS FIELD"*. Deriving from it means a renamed band updates this check on
 * the same commit, and the match is now the quoted accessible NAME rather than any substring of a line.
 */
const BAND_WORDS: string[] = Object.values(GUARDIAN_STATE_LABEL).map((w: string) => w.toLowerCase());

test.use({ viewport: PHONE });

for (const s of SURFACES) {
  test(`a11y tree — ${s.name}`, async ({ page }: { page: Page }) => {
    await seedStore(page, seed(s.seedOver));
    await page.goto(s.goto);
    await page.waitForTimeout(900);

    /**
     * ⛔ **S1.13.7.10 [pass-6 `A1-8`] — THIS FILE PRINTED AND ASSERTED NOTHING, WHICH IS WHY THE BAND
     * COUNT COULD ROT UNNOTICED.** It writes artifacts for a human to read; the one property that must
     * hold for those artifacts to MEAN anything is that the band words are the app's real ones. Derived
     * from `GUARDIAN_STATE_LABEL`, so a hand-typed list — the defect — reds here.
     */
    expect(BAND_WORDS, 'the band words are DERIVED from GUARDIAN_STATE_LABEL, never typed out').toEqual(
      Object.values(GUARDIAN_STATE_LABEL).map((w: string) => w.toLowerCase()),
    );
    expect(BAND_WORDS.length, 'and the producer is non-empty, so the count below is not vacuous').toBeGreaterThan(0);

    const yaml = await page.locator('body').ariaSnapshot();
    const lines = yaml.split('\n');

    // The two counts worth having in front of you before reading a few hundred lines of tree.
    // A node emitted with a role and no quoted name is a control a screen reader announces as its role
    // alone — "button", with nothing to say which button.
    const unnamed = lines.filter((l) => /^\s*-\s*(button|link|checkbox|switch|textbox|slider)\s*$/.test(l)).length;
    /**
     * ⛔ [`A1-8`] Matched inside the QUOTED NAME and on a word boundary. A tree line is
     * `- text: "Clear"`, so the band's own label is a quoted token — while `cleared`, `unclear` and
     * `Clear search` are not. Both halves matter: dropping the quotes re-admits every substring, and
     * dropping the boundary re-admits `shortfall` for `short`.
     */
    const banded = lines.filter((l) => {
      const quoted = /"([^"]*)"/.exec(l)?.[1]?.toLowerCase();
      if (!quoted) return false;
      return BAND_WORDS.some((w) => new RegExp(`(^|[^a-z])${w.replace(/[-]/g, '[- ]')}([^a-z]|$)`).test(quoted));
    }).length;

    const header = [
      `# a11y tree — ${s.name}  (${s.goto})`,
      `#`,
      `# ⛔ WEB TREE, NOT VOICEOVER. Order/name/role/state are real; spoken rendering, rotor and focus`,
      `#    behaviour are device-owed (P6.14). See the file header.`,
      `#`,
      `# nodes: ${lines.length}   ·   without an accessible name: ${unnamed}   ·   Guardian-band words present: ${banded}`,
      ...(banded === 0 && (s.name === 'today' || s.name === 'progress')
        ? [`# ⚠️ ZERO band words on a surface whose whole job is the band — the state may be COLOUR-ONLY.`]
        : []),
      ``,
    ];

    mkdirSync(path.join(OUT), { recursive: true });
    writeFileSync(path.join(OUT, `${s.name}.txt`), `${[...header, ...lines].join('\n')}\n`, 'utf8');
    console.log(`  ✓ a11y ${s.name}: ${lines.length} nodes · ${unnamed} unnamed · ${banded} band words`);
  });
}
