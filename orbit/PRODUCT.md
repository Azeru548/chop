# PRODUCT.md — CHOP

A cinematic scroll commemoration to Nigerian food. One page, five dishes,
each a pinned full-viewport film scrubbed by native scroll with synchronized
text beats.

## Product truth

- **What:** "CHOP" — a scroll-driven film catalog of five Nigerian dishes:
  Jollof, Kilishi, Egusi & Eba, Suya, Moi-Moi.
- **Audience:** curious food lovers discovering the cuisine (not insiders;
  nothing may assume prior knowledge — every dish earns its appetite).
- **Mode:** Experience. The visitor is inside the work; the footage leads,
  the interface recedes. No conversion action; success is reaching the
  footer hungry and knowing all five dishes by name.
- **Mechanism:** pinned sticky stage + native-scroll progress (0–1) driving
  a GPU video scrub + text timeline from the same progress source.
- **Content obligations:** all five dishes present (no placeholders), each
  with craft/process beats, not just beauty shots. Discovery copy, never
  in-jokes.
- **Technical constraints:** file:// must work; JPG fallback chain stays;
  no scroll capture/body locking/preventDefault; `overflow-x: clip` on root;
  reduced-motion renders static; total video payload ~25MB across 6 files.

## Scope of the current redesign

Restructure freely: sections, flow, layout, typography, and copy are all
raw material. Footage and the scroll engine's verified behaviors are kept.
