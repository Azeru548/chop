/* CHOP — Loading gate.
   Strict global preloader: the page stays gated until EVERY film
   (hero + all video dishes) is fully buffered. No partial entry.
   Observes the same <video> elements the engine scrubs, so nothing
   downloads twice. Dish JPG chains are fallback-only and stay out of
   the gate: a dish counts when its video is scrub-ready.
   Order: deferred after chop-engine + hero, so controllers exist. */
(function () {
  "use strict";

  var overlay = document.getElementById("gate");
  var line = document.getElementById("gateLine");
  var percent = document.getElementById("gatePercent");
  var bar = document.getElementById("gateBar");
  var films = document.getElementById("gateFilms");
  var retryBtn = document.getElementById("gateRetry");
  if (!overlay) { return; }

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function release() {
    if (!document.documentElement.classList.contains("gated")) { return; }
    overlay.classList.add("is-open");
    if (line) { line.textContent = "The table is set"; }
    window.setTimeout(function () {
      document.documentElement.classList.remove("gated");
      overlay.classList.add("is-gone");
      if (window.__CHOP_LENIS && window.__CHOP_LENIS.start) {
        try { window.__CHOP_LENIS.start(); } catch (e) { /* scroll stays native */ }
      }
      if (window.ScrollTrigger) { window.ScrollTrigger.refresh(); }
    }, 650);
  }

  // Reduced motion: static frames, no video scrub — gate on window load.
  if (reduceMotion) {
    if (document.readyState === "complete") { release(); }
    else { window.addEventListener("load", release); }
    return;
  }

  function init() {
    // Hold all scrolling while gated. Lenis stops its own deltas; the
    // gated class freezes native scroll. Both lift on release + refresh.
    if (window.__CHOP_LENIS && window.__CHOP_LENIS.stop) {
      try { window.__CHOP_LENIS.stop(); } catch (e) { /* scroll stays native */ }
    }
    collectDishes();
  }

  var items = [];
  var heroVideo = document.querySelector(".landing-video");
  if (heroVideo) {
    items.push({ id: "hero", label: "Firelight reel", el: heroVideo, tries: 0, done: false });
  }

  function collectDishes() {
    var controllers = window.__CHOP_CONTROLLERS || [];
    for (var i = 0; i < controllers.length; i++) {
      var c = controllers[i];
      if (!c || !c.videoSrc || c.preview) { continue; }
      // Defer to the engine's element (created in setupVideo).
      if (c.video) {
        items.push({ id: c.config.id, label: dishLabel(c.config.id), el: c.video, tries: 0, done: false });
      }
    }
  }

  function dishLabel(id) {
    var names = { jollof: "Jollof", kilishi: "Kilishi", egusi: "Egusi & Eba", suya: "Suya", moimoi: "Moi-Moi" };
    return names[id] || id;
  }

  function isFull(v) {
    try {
      if (!v.duration || !isFinite(v.duration)) { return false; }
      var b = v.buffered;
      if (!b || !b.length) { return false; }
      return b.end(b.length - 1) >= v.duration - 0.25;
    } catch (e) { return false; }
  }

  function render() {
    var done = 0, failed = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].done) { done++; }
      else if (items[i].failed) { failed++; }
    }
    var pct = items.length ? Math.round((done / items.length) * 100) : 100;
    if (percent) { percent.textContent = pct + "%"; }
    if (bar) { bar.style.width = pct + "%"; }
    if (films) {
      var html = "";
      for (var j = 0; j < items.length; j++) {
        var st = items[j].done ? "done" : (items[j].failed ? "failed" : "waiting");
        var mark = items[j].done ? "✓" : (items[j].failed ? "✕" : "·");
        html += '<li class="' + st + '"><span>' + mark + "</span> " + items[j].label + "</li>";
      }
      films.innerHTML = html;
    }
    if (failed && retryBtn) {
      retryBtn.hidden = false;
      if (line) { line.textContent = "The fire went out on " + failed + " reel" + (failed > 1 ? "s" : ""); }
    }
    if (items.length && done === items.length) { release(); }
  }

  function kick(v) {
    try { v.load(); } catch (e) { /* element retries on its own events */ }
  }

  function watch(item) {
    var v = item.el;
    var onTick = function () {
      if (item.done || item.failed) { return; }
      if (isFull(v)) { item.done = true; render(); }
    };
    // canplaythrough is the platform's own guarantee of uninterrupted
    // playback — accepted alongside full-buffer as "loaded properly".
    var onThrough = function () {
      if (item.done || item.failed) { return; }
      item.done = true; render();
    };
    var onError = function () {
      if (item.done) { return; }
      item.tries++;
      if (item.tries <= 2) {
        try {
          var src = v.getAttribute("src") || v.src;
          v.src = src.split("?")[0] + "?retry=" + item.tries;
        } catch (e) { /* fall through to plain reload */ }
        kick(v);
      } else {
        item.failed = true; render();
      }
    };
    v.addEventListener("progress", onTick);
    v.addEventListener("canplaythrough", onThrough);
    v.addEventListener("error", onError);
    // Stall watchdog: no progress in 20s → re-kick once per attempt.
    var lastBuffered = -1, stale = 0;
    var dog = window.setInterval(function () {
      if (item.done || item.failed) { window.clearInterval(dog); return; }
      var cur = -1;
      try { cur = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0; } catch (e) { cur = 0; }
      if (cur <= lastBuffered) {
        stale++;
        if (stale === 2 && item.tries < 2) { item.tries++; kick(v); }
      } else { stale = 0; }
      lastBuffered = cur;
      onTick();
    }, 10000);
    kick(v);
    onTick();
  }

  function retryFailed() {
    var any = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].failed && !items[i].done) {
        items[i].failed = false; items[i].tries = 0; any = true;
        kick(items[i].el);
      }
    }
    if (retryBtn) { retryBtn.hidden = true; }
    if (line) { line.textContent = "Rekindling"; }
    if (!any) { render(); }
  }

  if (retryBtn) { retryBtn.addEventListener("click", retryFailed); }

  function init() {
    collectDishes();
    if (!items.length) { release(); return; }
    for (var i = 0; i < items.length; i++) { watch(items[i]); }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
