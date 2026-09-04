// GENERATED from apps/rn/src/components/entities/debtPrefill.test.ts by p3-gen.py.
// The production function, SLICED not retyped, so it cannot drift from what ships.
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
const seedsFromEditing = (raw: string): string[] => {
      const src = stripCommentsOnly(raw);
      const direct = src.match(/useState\([^;]*?\bediting\b/g) ?? [];
      /**
       * ⛔ **`const | let | var`, AND TWO HOPS** — [class-1 re-audit 3 · `N-8`]. The first hoist rule matched
       * `const` only, so `let x = editing ? … ; useState(x)` walked past; and it followed ONE hop, so
       * `const a = editing?.apr; const b = a; useState(b)` did too. Both are ordinary refactors of the
       * defect, not exotic spellings.
       */
      const DECL = /(?:const|let|var)\s+(\w+)\s*=\s*([^;]*);/g;
      const bindings = [...src.matchAll(DECL)].map((m) => ({ name: m[1], init: m[2] }));
      /**
       * ⛔ **THE `seed` EXEMPTION IS SEEDED INTO THE CLOSURE, NOT FILTERED AFTER IT.**
       * [class-1 re-audit 4 `U9`, major]
       *
       * ⚡ `N-8` replaced a one-hop rule with a transitive closure and left the exemption a single name
       * filter applied to the RESULT. So `seed` entered `derived` (its initialiser mentions `editing`),
       * `apr` entered because its initialiser mentions `seed`, and only `seed` itself was filtered out —
       * **the exemption was one hop deep while the detector had become unbounded.**
       *
       * ⛔ `DebtSheet.tsx`'s sanctioned shape is `const seed = editing ?? prefill ?? null;`. Hoisting the
       * initialiser off it — an ordinary refactor of CORRECT code that still honours the prefill — was
       * reported as a defect by a release gate with `eq(fromEditing.length, 0)` and no allow-list.
       *
       * ⚠️ **Not a hole.** `seed` is still pinned by the assertion below, so the one identifier allowed to
       * derive from `editing` is itself guarded; what changes is that deriving FROM it no longer counts.
       */
      const EXCLUDED = new Set(['seed']);
      const derived = new Set<string>();
      for (let hop = 0; hop < 3; hop++) {
        for (const b of bindings) {
          if (derived.has(b.name) || EXCLUDED.has(b.name)) continue;
          const fromEditingDirectly = /\bediting\b/.test(b.init);
          const fromDerived = [...derived].some((d) => new RegExp(`\\b${d}\\b`).test(b.init));
          if (fromEditingDirectly || fromDerived) derived.add(b.name);
        }
      }
      const hoisted = [...derived];
      /**
       * ⛔ **DESTRUCTURING IS A HOIST TOO** — `N-8`. `const { apr } = editing ?? {}` binds a name derived
       * from `editing` without ever writing `editing` next to `useState`, and the first hoist rule only
       * matched a single identifier. Third spelling of one defect, after the ternary (`C2-9`) and the
       * plain hoist (`R11`).
       */
      const destructured = [...src.matchAll(/const\s*\{([^}]*)\}\s*=\s*[^;]*\bediting\b[^;]*;/g)].flatMap((m) =>
        m[1]
          .split(',')
          .map((part) => part.split(':').pop()?.trim() ?? '')
          .filter(Boolean),
      );
      return [
        ...direct,
        ...[...hoisted, ...destructured]
          // ⛔ `U9` — `seed` is handled in the closure above; a name filter here was one hop deep.
          .filter((name) => !EXCLUDED.has(name))
          .filter((name) => new RegExp(`useState\\(\\s*${name}\\b`).test(src)),
      ];
    };
export { seedsFromEditing };
