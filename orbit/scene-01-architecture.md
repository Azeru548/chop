# ORBIT — Scene 01 / REVEAL — Architecture (PROTECTED)

Status: **WORKING — VERIFIED 2026-09-15** (headless Edge, `file://`, forward + reverse + repeat cycles, zero errors).
Rule: **do not modify the files or behaviors listed under "Protected" without explicit user instruction.**

## 1. What it is

A scroll-driven cinematic: the hero stays pinned while native document scroll scrubs a 240-frame
spacecraft reveal (darkness → fully lit ORBIT-01) plus five overlay text beats. Leaving the scroll
range releases to normal page flow in both directions. Repeatable indefinitely.

## 2. File map

```
orbit/
├── index.html                  # semantic shell + CDN scripts (PROTECTED)
├── styles/main.css             # timeline / sticky / overlay styling (PROTECTED)
├── scripts/scene-01.js         # loader + renderer + text + scroll driver (PROTECTED)
├── frames/ezgif-frame-001.jpg … ezgif-frame-240.jpg   # 240 JPEGs, 1920×1080 (DO NOT move/rename)
└── scene-01-architecture.md    # this file
```

## 3. DOM structure (`index.html`)

```
header.site-header (fixed, pointer-events none; eyebrow + visually-hidden h1)
main
├── section#scene-01            # scroll container — provides ALL timeline distance
│   └── .stage#scene-01-stage   # sticky pinned viewport (100svh)
│       ├── canvas#scene-01-canvas
│       ├── p#scene-01-caption (visually hidden, describes the timeline)
│       ├── #cine-text          # text beats injected here by JS
│       ├── .overlay-bottom     # frame readout (001/240) + scroll hint
│       ├── .timeline-progress  # 2px progress hairline
│       ├── #loader             # "LOADING SEQUENCE n / 240" + bar
│       └── noscript > img      # final frame fallback
└── section.afterword           # end marker; proves downward release works
```

Scripts (deferred, order-preserved): GSAP 3.12.5 core + ScrollTrigger 3.12.5 (cdnjs), then `scene-01.js`.

## 4. CSS model (`styles/main.css`)

- `#scene-01 { height: 500vh }` → 400vh of scroll travel for the cinematic.
- `.stage { position: sticky; top: 0; height: 100vh/100svh }` → pins while traversed.
- Canvas is `position: absolute; inset: 0` — **never participates in layout**.
- Text beats live in the lower third; spacecraft stays the focus. No gradients, cards, navs.
- **CRITICAL:** `html, body { overflow-x: clip }`. It MUST stay `clip`, never `hidden`:
  `overflow-x: hidden` computes `overflow-y` to `auto`, which breaks `position: sticky`
  (verified root cause, 2026-09-15 — the stage scrolled away and the page showed black).
- Reduced motion: `body.reduced` collapses the timeline (`height: auto`, static stage).

## 5. JS model (`scripts/scene-01.js`, IIFE)

```
native document scroll
  → ScrollTrigger (start "top top", end "bottom bottom") → progress 0–1
  → setProgress → rAF(renderCinematic) → drawFrame + updateTextTimeline
```

- **Loader:** frame 001 first, then strict 002→240 sequential `Image` queue (`decoding: async`).
  Errors increment the counter so the loader can never stall.
- **Renderer:** cover-fit math (`scale = max(cw/iw, ch/ih)`, centered, black fill), DPR capped at 2.
  `renderIfChanged` draws only on frame change; **last-good-frame**: unloaded targets keep the
  previous bitmap instead of showing broken output. `frameIndex = Math.round(progress × 239) + 1`.
- **Text timeline:** single `TEXT_TIMELINE` array (5 beats, start/end in 0–1). Opacity ramps over
  `TEXT_FADE` (0.03) with smoothstep + 14px rise; edge beats stay visible at exactly 0 and 1.
  Same progress source as canvas → always synchronized.
- **Driver:** `createScrollDriver()` → ScrollTrigger `onUpdate`/`onRefresh`; `refresh()` on window
  `load`; initial `setProgress(readSceneProgress())` covers mid-scene reloads. If the CDN is
  unreachable, a passive rAF-throttled scroll fallback uses the identical layout function.
- **Reduced motion:** no ScrollTrigger, static final frame + final beat, normal scroll.
- There is **no wheel/touch/key capture, no body locking, no preventDefault** anywhere.

## 6. Protected list (do not touch without instruction)

1. Tall-container + sticky-stage layout and the `overflow-x: clip` rule.
2. Frame files: names, location, count (240), sequential preload order.
3. Cover math, DPR cap, last-good-frame fallback.
4. `TEXT_TIMELINE` values (art direction; edit only when asked).
5. Native-scroll progress model. **Banned (proven broken):** wheel/touch interception,
   `html/body` overflow locking, `preventDefault` for cinematic scroll, custom scroll state
   machines, forced `scrollTo` anchoring, `overflow-x: hidden` on root/body.

## 7. Verified behavior (2026-09-15, file:// in Edge)

001 → 240 scrub with beats at 25/50/75%, release down to end marker, re-enter at 240,
scrub back to 001, repeat cycles, mid-point reversals — no console errors, no freezes.
Fresh-load fast scroll may outrun the sequential preload (counter outruns picture until
catch-up); this is accepted current behavior, shown by the loader.
