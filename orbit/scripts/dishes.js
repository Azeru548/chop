/* CHOP — Dish configurations.
   Each dish defines: id, frameDir, framePrefix, frameCount, textBeats.
   Edit this file to add dishes. The engine reads CHOP_DISHES on init. */
window.CHOP_DISHES = [
  {
    id: "jollof",
    no: "01",
    frameDir: "frames/jollof-frames/",
    framePrefix: "ezgif-frame-",
    frameCount: 181,
    video: "frames/jollof-video/jollof.mp4",
    /* Full-bleed film; beats crossfade in place over the scrim.
       Boundaries at 25/50/75% (frames ~46/91/136). */
    textBeats: [
      {
        start: 0.0, end: 0.25,
        eyebrow: "Party style",
        headline: "Jollof",
        body: "Rice smoked over firewood, steeped in a slow-reduced pepper base until every grain burns bright red. This is the dish parties are measured by.",
        caption: ""
      },
      {
        start: 0.25, end: 0.5,
        eyebrow: "The craft",
        headline: "Firewood & patience",
        body: "Tomatoes, scotch bonnet and onions reduced for hours before the rice ever touches the pot. No shortcuts — the smoke is the signature.",
        caption: ""
      },
      {
        start: 0.5, end: 0.75,
        eyebrow: "Dissected",
        headline: "Everything, laid bare",
        body: "",
        caption: "Long-grain rice · Plum tomatoes · Scotch bonnet · Red onions · Smoked paprika · Firewood smoke"
      },
      {
        start: 0.75, end: 1.0,
        eyebrow: "The plate",
        headline: "Served hot",
        body: "Glossy, separate grains with the party bottom-crisp. Jollof isn't lunch — it's an event.",
        caption: ""
      }
    ]
  },
  {
    id: "kilishi",
    no: "02",
    frameDir: "frames/kilishi-frames/",
    framePrefix: "ezgif-frame-",
    frameCount: 181,
    video: "frames/kilishi-video/kilishi.mp4",
    textBeats: [
      {
        start: 0.0, end: 0.2,
        eyebrow: "Fire-finished",
        headline: "Kilishi",
        body: "Strips of beef, sun-dried until they darken, then finished over open flame. Northern Nigeria's answer to hunger that travels.",
        caption: ""
      },
      {
        start: 0.2, end: 0.4,
        eyebrow: "The spice",
        headline: "Peanut and chili",
        body: "Each strip is bathed in a rub of ground peanut, dried chili, and ginger — sweet heat pressed into every fiber before the second drying.",
        caption: ""
      },
      {
        start: 0.4, end: 0.6,
        eyebrow: "Smoke",
        headline: "Primal transformation",
        body: "Back over the fire the sugars caramelize and the edges char. What was raw becomes lacquered, brittle, and deeply savory.",
        caption: ""
      },
      {
        start: 0.6, end: 0.8,
        eyebrow: "The tear",
        headline: "Fiber by fiber",
        body: "Kilishi is not bitten — it is torn along the grain, strip by strip, the way it has been eaten for centuries.",
        caption: ""
      },
      {
        start: 0.8, end: 1.0,
        eyebrow: "Premium redefined",
        headline: "Served dry",
        body: "Chewy, fiery, and concentrated. Proof that preservation, done with patience, is a cuisine of its own.",
        caption: ""
      }
    ]
  },
  {
    id: "egusi",
    no: "03",
    frameDir: "frames/egusi-frames/",
    framePrefix: "ezgif-frame-",
    frameCount: 180,
    video: "frames/egusi-video/egusi.mp4",
    /* 4 chapters, cuts at 25/50/75% (frames ~46/91/136). */
    textBeats: [
      {
        start: 0.0, end: 0.25,
        eyebrow: "Golden & nutty",
        headline: "Egusi & eba",
        body: "Ground melon seeds simmered in palm oil until golden — lumpy, rich, and studded with meat and greens. Eba sits beside it, smooth and ivory, waiting to be pinched.",
        caption: ""
      },
      {
        start: 0.25, end: 0.5,
        eyebrow: "The craft",
        headline: "Dropped by hand",
        body: "Egusi paste rolled into rough lumps and dropped into bubbling stock. Each one lands, holds its shape, and turns from pale cream to cooked gold.",
        caption: ""
      },
      {
        start: 0.5, end: 0.75,
        eyebrow: "Dissected",
        headline: "Everything, laid bare",
        body: "",
        caption: "Melon seeds · Palm oil · Scotch bonnet · Ugu greens · Stockfish · Crayfish"
      },
      {
        start: 0.75, end: 1.0,
        eyebrow: "The scoop",
        headline: "Pinch, mold, lift",
        body: "Fingers pinch the eba, mold a scoop, and lift it heavy with stew. Egusi isn't eaten — it's gathered.",
        caption: ""
      }
    ]
  },
  {
    id: "suya",
    no: "04",
    frameDir: "frames/suya-frames/",
    framePrefix: "ezgif-frame-",
    frameCount: 180,
    video: "frames/suya-video/suya.mp4",
    textBeats: [
      {
        start: 0.0, end: 0.25,
        eyebrow: "Fire grilled",
        headline: "Suya",
        body: "Beef over open charcoal, rubbed in yaji spice, served on newspaper with onion and tomato. Nigeria's greatest street food — smoke is the seasoning.",
        caption: ""
      },
      {
        start: 0.25, end: 0.5,
        eyebrow: "The spice",
        headline: "Yaji, like snow",
        body: "Ground peanut, chili, and ginger rain down onto glistening meat and build a crust like bark. This rub is suya's fingerprint.",
        caption: ""
      },
      {
        start: 0.5, end: 0.75,
        eyebrow: "Smoke & flame",
        headline: "The flip",
        body: "",
        caption: "Charcoal · Yaji · Smoke · Newspaper · Onion · Tomato"
      },
      {
        start: 0.75, end: 1.0,
        eyebrow: "Served",
        headline: "On newspaper",
        body: "Sliced hot off the skewer, dusted once more, eaten with your hands standing up. No plate improves it.",
        caption: ""
      }
    ]
  },
  {
    id: "moimoi",
    no: "05",
    frameDir: "frames/moi-moi-frames/",
    framePrefix: "ezgif-frame-",
    frameCount: 181,
    video: "frames/moimoi-video/moimoi.mp4",
    textBeats: [
      {
        start: 0.0, end: 0.25,
        eyebrow: "Steamed gold",
        headline: "Moi-moi",
        body: "Black-eyed bean batter whipped with palm oil and peppers, wrapped in banana leaf and steamed until it sets like custard. Silence, then perfume.",
        caption: ""
      },
      {
        start: 0.25, end: 0.5,
        eyebrow: "The wrap",
        headline: "Leaf & steam",
        body: "Batter poured thick into green leaf parcels, stacked in the steamer. What happens inside is invisible — that's the anticipation.",
        caption: ""
      },
      {
        start: 0.5, end: 0.75,
        eyebrow: "The reveal",
        headline: "Everything, laid bare",
        body: "",
        caption: "Beans · Palm oil · Peppers · Boiled egg · Banana leaf"
      },
      {
        start: 0.75, end: 1.0,
        eyebrow: "Plated",
        headline: "Quiet luxury",
        body: "Unwrapped to show a flawless surface and the egg nested at its heart. The gentlest dish on this table — and the most precise.",
        caption: ""
      }
    ]
  }
];
