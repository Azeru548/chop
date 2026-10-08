/* ORBIT — Scene 02 / Orbit.
   Self-contained scene module mirroring the protected Scene 01 pattern:
   native sticky timeline + ScrollTrigger progress + canvas renderer.
   Scene 01 files are frozen; this module duplicates the small driver
   deliberately so Scene 01 can never regress. */
(function () {
  "use strict";

  var FRAME_COUNT = 181;
  var FIRST_FRAME = 1;
  var LAST_FRAME = 181;
  var FRAME_DIR = "scene-02 frames/";

  var section = document.getElementById("scene-02");
  var canvas = document.getElementById("scene-02-canvas");
  var loader = document.getElementById("loader-02");
  var loaderCount = document.getElementById("loader-count-02");
  var loaderBar = document.getElementById("loader-bar-02");
  var frameCurrent = document.getElementById("frame-current-02");
  var cineText = document.getElementById("cine-text-02");
  var timelineBar = document.getElementById("timeline-bar-02");

  // Single art-direction source for Scene 02 titles.
  // start/end are timeline progress (0 -> 1). Edit values here only.
  var TEXT_TIMELINE = [
    { start: 0.0, end: 0.2, label: "02", supporting: "THE ORBIT" },
    { start: 0.2, end: 0.45, label: "HULL", supporting: "ONE SEAMLESS SHELL" },
    { start: 0.45, end: 0.7, label: "DRIVE", supporting: "TWIN VECTOR ENGINES" },
    { start: 0.7, end: 1.0, label: "ORBIT-01", supporting: "CLEARED FOR DEPARTURE" }
  ];
  var TEXT_FADE = 0.03;
  var beats = [];

  if (!section || !canvas) {
    return;
  }

  var ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function framePath(index) {
    var n = String(index).padStart(3, "0");
    return FRAME_DIR + "ezgif-frame-" + n + ".jpg";
  }

  function isUsable(img) {
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }

  // Sequential cache: Image objects are created one at a time so the
  // network and decoder are never hit with parallel requests.
  var images = new Array(FRAME_COUNT + 1);
  var loadedCount = 0;
  var renderedFrame = 0;
  var targetFrame = FIRST_FRAME;
  var loadCursor = FIRST_FRAME;

  // Scroll progress source: GSAP ScrollTrigger maps native document
  // scroll over the tall timeline container into normalized `progress`
  // (0 → 1). The browser owns scrolling; we only render progress.
  var progress = 0;
  var renderQueued = false;
  var scrollFallbackTicking = false;
  var scrollTrigger = null;

  function updateLoader() {
    if (loaderCount) {
      loaderCount.textContent = String(loadedCount);
    }
    if (loaderBar) {
      loaderBar.style.width = ((loadedCount / FRAME_COUNT) * 100).toFixed(1) + "%";
    }
    if (loadedCount >= FRAME_COUNT && loader) {
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
    }
  }

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      if (renderedFrame > 0) {
        drawFrame(renderedFrame);
      }
    }
  }

  // Cover-style draw: preserve source ratio, fill viewport,
  // surrounding area stays black.
  function drawFrame(index) {
    var img = images[index];
    if (!isUsable(img)) {
      return false;
    }
    var cw = canvas.width;
    var ch = canvas.height;
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    if (cw <= 0 || ch <= 0 || iw <= 0 || ih <= 0) {
      return false;
    }
    var scale = Math.max(cw / iw, ch / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var dx = (cw - dw) / 2;
    var dy = (ch - dh) / 2;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
    renderedFrame = index;
    if (frameCurrent) {
      frameCurrent.textContent = String(index).padStart(3, "0");
    }
    return true;
  }

  function renderIfChanged(index) {
    if (index === renderedFrame) {
      return;
    }
    // Graceful fallback: if the target has not finished loading,
    // keep the last good frame instead of showing a broken image.
    drawFrame(index);
  }

  function progressToFrame(value) {
    var clamped = Math.min(1, Math.max(0, value));
    return Math.round(clamped * (FRAME_COUNT - 1)) + FIRST_FRAME;
  }

  function buildTextTimeline() {
    if (!cineText) {
      return;
    }
    cineText.textContent = "";
    beats = TEXT_TIMELINE.map(function (beat) {
      var el = document.createElement("div");
      el.className = "beat";
      var label = document.createElement("p");
      label.className = "beat-label";
      label.textContent = beat.label;
      var sub = document.createElement("p");
      sub.className = "beat-sub";
      sub.textContent = beat.supporting || "";
      el.appendChild(label);
      el.appendChild(sub);
      cineText.appendChild(el);
      return { data: beat, el: el };
    });
  }

  // Smooth enter/leave: opacity ramps over TEXT_FADE at each
  // boundary with a subtle rise, so scrubbing either direction
  // cross-fades instead of cutting.
  function updateTextTimeline(value) {
    if (!beats.length) {
      return;
    }
    for (var i = 0; i < beats.length; i++) {
      var beat = beats[i];
      var p = value;
      var opacity = 0;
      if (p >= beat.data.start && p <= beat.data.end) {
        // Boundary beats stay fully visible at the timeline edges:
        // no fade-in before 0, no fade-out after 1.
        var fadeIn = beat.data.start <= 0 ? 1 : (p - beat.data.start) / TEXT_FADE;
        var fadeOut = beat.data.end >= 1 ? 1 : (beat.data.end - p) / TEXT_FADE;
        opacity = Math.min(1, fadeIn, fadeOut, 1);
        opacity = Math.max(0, Math.min(1, opacity));
        // Smoothstep for a softer cinematic ease.
        opacity = opacity * opacity * (3 - 2 * opacity);
      }
      beat.el.style.opacity = opacity.toFixed(3);
      beat.el.style.transform = "translateY(" + ((1 - opacity) * 14).toFixed(1) + "px)";
      beat.el.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
    }
    if (timelineBar) {
      timelineBar.style.width = (value * 100).toFixed(2) + "%";
    }
  }

  function renderCinematic() {
    renderQueued = false;
    targetFrame = progressToFrame(progress);
    renderIfChanged(targetFrame);
    updateTextTimeline(progress);
  }

  function scheduleRender() {
    // On-demand rAF only: no infinite loop, no per-frame polling.
    if (renderQueued) {
      return;
    }
    renderQueued = true;
    window.requestAnimationFrame(renderCinematic);
  }

  function setProgress(next) {
    var clamped = Math.min(1, Math.max(0, next));
    if (Math.abs(clamped - progress) < 0.000001) {
      return;
    }
    progress = clamped;
    scheduleRender();
  }

  // Pure function of layout: identical progress for a given scroll
  // position on every cycle, regardless of init timing, refresh
  // position, resizes, or how many times the scene was traversed.
  function readSceneProgress() {
    var total = section.offsetHeight - window.innerHeight;
    if (total <= 0) {
      return 1;
    }
    var top = section.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, -top / total));
  }

  function onDocumentScrollFallback() {
    // rAF-throttled passive listener; redraws only via setProgress.
    if (scrollFallbackTicking) {
      return;
    }
    scrollFallbackTicking = true;
    window.requestAnimationFrame(function () {
      scrollFallbackTicking = false;
      setProgress(readSceneProgress());
    });
  }

  // Single scroll driver. ScrollTrigger is preferred (hardened start/end
  // math, resize/refresh recalculation, mobile-tested); the vanilla
  // fallback uses the same layout function so behavior is identical.
  // Pinning itself stays native CSS sticky — ScrollTrigger only reports
  // progress, it never restructures the page.
  function createScrollDriver() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      scrollTrigger = window.ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: function (self) {
          setProgress(self.progress);
        },
        onRefresh: function (self) {
          setProgress(self.progress);
        }
      });
      // Covers mid-scene refresh: paint the actual position at once.
      setProgress(readSceneProgress());
      window.addEventListener("load", function () {
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
        scheduleRender();
      });
    } else {
      window.addEventListener("scroll", onDocumentScrollFallback, { passive: true });
      setProgress(readSceneProgress());
    }
  }

  function loadOne(index, onward) {
    var img = new Image();
    img.decoding = "async";
    images[index] = img;
    img.onload = function () {
      loadedCount += 1;
      updateLoader();
      // First paint as early as possible.
      if (index === FIRST_FRAME) {
        drawFrame(FIRST_FRAME);
      }
      // If the user already scrolled onto this frame, paint it now.
      if (index === targetFrame) {
        renderIfChanged(index);
      }
      if (onward) {
        onward();
      }
    };
    img.onerror = function () {
      // Count errors so the loader cannot stall; rendering simply
      // keeps the last good frame for any missing index.
      loadedCount += 1;
      updateLoader();
      if (onward) {
        onward();
      }
    };
    img.src = framePath(index);
  }

  function preloadSequentially() {
    loadCursor += 1;
    if (loadCursor > LAST_FRAME) {
      return;
    }
    loadOne(loadCursor, preloadSequentially);
  }

  function initInteractive() {
    resizeCanvas();
    buildTextTimeline();
    createScrollDriver();
    window.addEventListener("resize", function () {
      resizeCanvas();
      scheduleRender();
    });
    updateLoader();
    // Frame 001 immediately, the rest progressively one by one.
    loadOne(FIRST_FRAME, preloadSequentially);
    scheduleRender();
  }

  function initReducedMotion() {
    document.body.classList.add("reduced");
    resizeCanvas();
    buildTextTimeline();
    window.addEventListener("resize", resizeCanvas);
    if (timelineBar) {
      timelineBar.style.width = "100%";
    }
    // Static final state: last text beat fully visible, no interpolation.
    if (beats.length) {
      for (var i = 0; i < beats.length; i++) {
        var isLast = i === beats.length - 1;
        beats[i].el.style.opacity = isLast ? "1" : "0";
        beats[i].el.style.transform = "none";
        beats[i].el.style.visibility = isLast ? "visible" : "hidden";
      }
    }
    if (loader) {
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
    }
    // Single static final frame: no scroll animation, no preload chain.
    loadOne(LAST_FRAME, null);
  }

  if (reduceMotion) {
    initReducedMotion();
  } else {
    initInteractive();
  }
})();
