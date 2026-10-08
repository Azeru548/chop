# DESIGN.md — CHOP (OWAMBE world)

Recorded from the built world. Direction contract lives in
`.impeccable/surfaces/index-html.md`.

## Tokens

- Grounds: `--bg #100a06`, `--bg2 #170d07`, cream `#f3e6cf` (one inverted card).
- Ink: text `#f6ecda`, body `#e6d5b8`, muted `#b39a78`, hairline `#3a2a1a`.
- Named dish brights: jollof pepper `#ff3d00`, kilishi rust `#d3672f`,
  egusi marigold `#ffc21c`, suya flame `#ff8a00`, moimoi terracotta `#e2703a`,
  inverted-card accent `#a8320c`. Accents own slates, numerals, kickers,
  loader bars, rules — never body text.
- Type: Alfa Slab One (monumental display, uppercase, balanced);
  Oswald (slates, labels, nav, kickers); Archivo (short body);
  ui-monospace for genuine data only (loader counts, ingredient specs,
  colophon). Display leading 0.95–1.08 is intentional (slab monumentality).

## Composition law

- Full-bleed film always. No split grids, no side-swapping, no panels.
- Text: one bottom-left editorial block per beat (slate → chapter →
  headline → body/spec), crossfading in place over a bottom scrim.
- Ghost outline chapter numeral top-right of every stage (`data-no`).
- Grain + scrim on every film frame, no clean video anywhere.
- Flow: landing → 5 × (film chapter → praise interlude) → commemorative
  close. Praise numerals bleed past card edges; suya's card inverts to
  cream for rhythm. Hairlines separate regions, never boxes.

## Motion

- One authored moment: landing title wipe. Everything else is the scroll
  itself: Lenis glide + scrub-lag video + in-place beat crossfades.
- Reduced motion: static final frames/beats, no Lenis, no wipe.

## Proof

- `node --check` clean on all scripts; CSS braces balanced; detector run
  2026-10-08 — remaining warnings (display leading, caps slates) are
  committed world choices, not oversights.
