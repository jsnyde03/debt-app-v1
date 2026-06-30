# docs

Active planning and reference for Paycheck Debt Planner. Shipped, version-locked,
and superseded docs live in [`archive/`](archive/README.md) — keep this folder to
what's current or forward-looking.

**Current status:** v1.4 shipped (approved + live). v1.5 is next.

## Source of truth

| Doc | Purpose |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Product roadmap, tier structure, version sequencing — the living source of truth |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Technical companion: how each version is built; version-status summary table |
| [RELEASE_CONFIDENCE.md](RELEASE_CONFIDENCE.md) | Living confidence gate every feature must clear before shipping |

## Forward-looking plans

| Doc | Purpose |
|---|---|
| [V15_TRACK_YOUR_JOURNEY.md](V15_TRACK_YOUR_JOURNEY.md) | **v1.5 (next)** — full build + release checklist for the next release |
| [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) | v1.7+ detail |
| [ANDROID_READINESS.md](ANDROID_READINESS.md) | Android (v1.7) blockers, CI, plugins, testing — prep starts v1.5 |
| [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) | Versioned UX polish backlog (shipped + pending) |
| [MOBILE_POLISH_ROADMAP.md](MOBILE_POLISH_ROADMAP.md) | Mobile craft/motion/haptics track — what & why |
| [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) | Mobile polish — how (files, steps, verification) |
| [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md) | Internal `app/page.tsx` refactor, phases 1–5 |

## Release operations

| Doc | Purpose |
|---|---|
| [release-qa-checklist.md](release-qa-checklist.md) | Reusable pre-release QA checklist |
| [release-notes/app-store-listing.md](release-notes/app-store-listing.md) | Current App Store listing copy (ASO) |
| [release-notes/screenshot-brief.md](release-notes/screenshot-brief.md) | Screenshot brief for the store listing |

## Archive

Shipped per-version docs and superseded audits: [`archive/`](archive/README.md).

## Post-release docs pass

When a version is approved and goes live, run the standard docs pass: flip its
status to shipped across ROADMAP / IMPLEMENTATION_PLAN / RELEASE_CONFIDENCE, check
off its release-notes checklist, then move its version-specific implementation doc
and release notes into [`archive/`](archive/README.md) and fix the cross-links.
