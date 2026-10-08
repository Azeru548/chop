/* CHOP — Cinematic Nigerian Food Catalog.
   Shared scroll engine. Reads dish configs from CHOP_DISHES (dishes.js),
   auto-discovers sections via data-dish attribute, creates one
   ScrollTrigger per dish. Canvas-draw logic is shared, not duplicated.
   Architecture: native sticky timeline + ScrollTrigger progress + canvas
   renderer. No wheel/touch capture, no body locking, no preventDefault.
   See docs/scene-01-architecture.md (ORBIT) for proven patterns. */
(function () {
  "use strict";

  var TEXT_FADE = 0.03;

  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  /* ---- shared canvas-draw (cover-style, black fill) ---- */

  function isUsable(img) {
    if (img && img.tagName === "VIDEO") {
      return Boolean(img.readyState >= 2 && img.videoWidth > 0);
    }
    return Boolean(img && img.complete && img.naturalWidth > 0);
  }

  function drawCover(canvas, ctx, img) {
    var cw = canvas.width;
    var ch = canvas.height;
    // Images expose naturalWidth/Height, video exposes videoWidth/Height.
    var iw = img.naturalWidth || img.videoWidth;
    var ih = img.naturalHeight || img.videoHeight;
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
    return true;
  }

  function resizeCanvas(canvas) {
    // DPR capped at 1.25 (was 2): halves backing-store pixels on retina,
    // the single biggest canvas-draw saving. Slight softness beats jank.
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  }

  function progressToFrame(progress, frameCount) {
    var clamped = Math.min(1, Math.max(0, progress));
    return Math.round(clamped * (frameCount - 1)) + 1;
  }

  function framePath(dir, prefix, index) {
    var n = String(index).padStart(3, "0");
    return dir + prefix + n + ".jpg";
  }

  /* ---- smoothstep for text fades ---- */

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* ---- WLT-parity smoothing: scrub lag + debounced refresh ---- */

  // Scrub lag factor: progress eases toward target each rendered frame.
  // 0.14 ~= ScrollTrigger scrub:1 feel without touching scroll input.
  var SCRUB_LERP = 0.14;
  var SCRUB_EPSILON = 0.0004;

  function debounce(fn, wait) {
    var t = 0;
    return function () {
      var self = this, args = arguments;
      window.clearTimeout(t);
      t = window.setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  var debouncedRefresh = debounce(function () {
    if (window.ScrollTrigger) { window.ScrollTrigger.refresh(); }
  }, 300);

  // Lenis: lerped native scroll (same lib WLT uses). No wheel/touch
  // capture, no body locking, no preventDefault — browser still owns
  // scrolling, Lenis just smooths the deltas. Skipped under
  // prefers-reduced-motion.
  var lenisStarted = false;
  function initSmoothScroll() {
    if (lenisStarted) { return; }
    if (!window.Lenis) { return; }
    try {
      var lenis = new window.Lenis({ lerp: 0.09 });
      lenisStarted = true;
      var raf = function (time) { lenis.raf(time); window.requestAnimationFrame(raf); };
      window.requestAnimationFrame(raf);
      if (window.ScrollTrigger) {
        lenis.on("scroll", function () { window.ScrollTrigger.update(); });
      }
      window.__CHOP_LENIS = lenis;
    } catch (e) { /* smooth scroll is enhancement-only */ }
  }

  /* ---- dish controller (one per scroll section) ---- */

  function DishController(config) {
    this.config = config;
    this.section = document.getElementById(config.id);
    if (!this.section) {
      return;
    }

    this.canvas = this.section.querySelector(".dish-canvas");
    this.stage = this.section.querySelector(".dish-stage");
    this.loader = this.section.querySelector(".dish-loader");
    this.loaderCount = this.section.querySelector(".dish-loader-count");
    this.loaderBar = this.section.querySelector(".dish-loader-bar");
    this.cineText = this.section.querySelector(".dish-cine-text");

    if (!this.canvas) {
      return;
    }

    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      return;
    }

    this.frameCount = config.frameCount;
    this.frameDir = config.frameDir;
    this.framePrefix = config.framePrefix || "ezgif-frame-";
    this.textBeats = config.textBeats || [];
    this.layout = config.layout || "full";
    // Preview mode: no frames yet — layout + text motion still render
    // so the composition can be reviewed before generation tokens
    // are spent. Canvas stays blank; loader is hidden immediately.
    this.preview = !this.frameCount;

    this.images = new Array(this.frameCount + 1);
    this.loadedCount = 0;
    this.renderedFrame = 0;
    this.targetFrame = 1;
    // Video-scrub path (proof: jollof). GPU-decoded mp4 replaces the
    // 181-JPG chain when config.video is set; JPGs stay as fallback.
    this.videoSrc = config.video || null;
    this.video = null;
    this.videoReady = false;
    this.jpgFallbackStarted = false;
    // Cursor = last frame queued. init() loads frame 1 directly, so the
    // sequential chain resumes at 2 (prevents frame 1 double-loading,
    // which inflated the loader counter by one).
    this.loadCursor = 1;
    this.progress = 0;
    this.target = 0; // scrub-lag destination; progress eases toward it
    this.renderQueued = false;
    this.scrollFallbackTicking = false;
    this.scrollTrigger = null;
    this.beats = [];
    this.activeBeat = -1;
    this.ready = false;
  }

  DishController.prototype.framePath = function (index) {
    return framePath(this.frameDir, this.framePrefix, index);
  };

  DishController.prototype.updateLoader = function () {
    if (this.loaderCount) {
      this.loaderCount.textContent = String(this.loadedCount);
    }
    if (this.loaderBar) {
      this.loaderBar.style.width =
        ((this.loadedCount / this.frameCount) * 100).toFixed(1) + "%";
    }
    if (this.loadedCount >= this.frameCount && this.loader) {
      this.loader.classList.add("is-done");
      this.loader.setAttribute("aria-hidden", "true");
    }
  };

  DishController.prototype.drawFrame = function (index) {
    var img = this.images[index];
    if (!isUsable(img)) {
      return false;
    }
    var ok = drawCover(this.canvas, this.ctx, img);
    if (ok) {
      this.renderedFrame = index;
    }
    return ok;
  };

  DishController.prototype.renderIfChanged = function (index) {
    if (index === this.renderedFrame) {
      return;
    }
    this.drawFrame(index);
  };

  /* ---- video-scrub path (GPU decode, JPG fallback) ---- */

  DishController.prototype.drawVideoFrame = function () {
    if (!this.videoReady || !this.video) {
      return false;
    }
    if (this.video.readyState < 2 || !this.video.videoWidth) {
      return false;
    }
    var ok = drawCover(this.canvas, this.ctx, this.video);
    if (ok) {
      this.renderedFrame = this.targetFrame;
    }
    return ok;
  };

  DishController.prototype.scrubVideo = function () {
    if (!this.videoReady || !this.video || !this.video.duration) {
      return;
    }
    var t = Math.min(1, Math.max(0, this.progress)) * this.video.duration;
    var diff = t - this.video.currentTime;
    // Don't queue seeks faster than the decoder clears them; force only
    // on big jumps (fast flicks) so small scrolls stay silky.
    if (!this.video.seeking && Math.abs(diff) > 0.033) {
      try { this.video.currentTime = t; } catch (e) { /* seek later */ }
    } else if (this.video.seeking && Math.abs(diff) > 0.3) {
      try { this.video.currentTime = t; } catch (e) { /* seek later */ }
    }
    this.drawVideoFrame();
  };

  DishController.prototype.markVideoReady = function () {
    if (this.videoReady) { return; }
    this.videoReady = true;
    if (this.videoFallbackTimer) {
      window.clearTimeout(this.videoFallbackTimer);
      this.videoFallbackTimer = 0;
    }
    this.loadedCount = this.frameCount;
    this.updateLoader();
    resizeCanvas(this.canvas);
    // Snap to current scroll position on the video timeline at once.
    if (this.video && this.video.duration) {
      try {
        this.video.currentTime =
          Math.min(1, Math.max(0, this.progress)) * this.video.duration;
      } catch (e) { /* first seek can race metadata; scrub loop retries */ }
    }
    this.scheduleRender();
  };

  DishController.prototype.startJpgChain = function () {
    if (this.jpgFallbackStarted) { return; }
    this.jpgFallbackStarted = true;
    var self = this;
    this.updateLoader();
    this.loadOne(1, function () {
      self.preloadSequentially();
    });
  };

  DishController.prototype.setupVideo = function () {
    var self = this;
    var v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = this.videoSrc;
    this.video = v;
    var onReady = function () { self.markVideoReady(); };
    var onSeeked = function () {
      self.drawVideoFrame();
      // A late-arriving seek after the scrub chain settled still paints.
      if (self.progress === self.target) { self.drawVideoFrame(); }
    };
    var onError = function () { self.startJpgChain(); };
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", onError);
    // file:// or slow disk: fall back to JPGs rather than stalling.
    var selfTimer = self;
    self.videoFallbackTimer = window.setTimeout(function () {
      if (!selfTimer.videoReady) { selfTimer.startJpgChain(); }
    }, 10000);
    try { v.load(); } catch (e) { self.startJpgChain(); }
  };

  DishController.prototype.buildTextTimeline = function () {
    if (!this.cineText) {
      return;
    }
    this.cineText.textContent = "";
    var self = this;
    this.beats = this.textBeats.map(function (beat, idx) {
      var el = document.createElement("div");
      el.className = "beat";
      // Rich beats: slate + eyebrow + headline + body + caption.
      // Legacy beats: label + sub. Both render here.
      if (beat.headline) {
        var slate = document.createElement("p");
        slate.className = "beat-slate";
        slate.textContent =
          "CH." + (self.config.no || "--") + " · " +
          (ROMAN[idx] || (idx + 1)) + " / " +
          (ROMAN[self.textBeats.length - 1] || self.textBeats.length);
        var eyebrow = document.createElement("p");
        eyebrow.className = "beat-eyebrow";
        eyebrow.textContent = beat.eyebrow || "";
        var headline = document.createElement("h3");
        headline.className = "beat-headline";
        headline.textContent = beat.headline;
        var body = document.createElement("p");
        body.className = "beat-body";
        body.textContent = beat.body || "";
        var caption = document.createElement("p");
        caption.className = "beat-caption";
        caption.textContent = beat.caption || "";
        el.appendChild(slate);
        el.appendChild(eyebrow);
        el.appendChild(headline);
        el.appendChild(body);
        el.appendChild(caption);
      } else {
        var label = document.createElement("p");
        label.className = "beat-label";
        label.textContent = beat.label;
        var sub = document.createElement("p");
        sub.className = "beat-sub";
        sub.textContent = beat.sub || "";
        el.appendChild(label);
        el.appendChild(sub);
      }
      self.cineText.appendChild(el);
      return { data: beat, el: el };
    });
  };

  DishController.prototype.updateTextTimeline = function () {
    if (!this.beats.length) {
      return;
    }
    var p = this.progress;
    var activeIndex = -1;
    for (var i = 0; i < this.beats.length; i++) {
      var beat = this.beats[i];
      var opacity = 0;
      if (p >= beat.data.start && p <= beat.data.end) {
        var fadeIn =
          beat.data.start <= 0 ? 1 : (p - beat.data.start) / TEXT_FADE;
        var fadeOut =
          beat.data.end >= 1 ? 1 : (beat.data.end - p) / TEXT_FADE;
        opacity = Math.min(1, fadeIn, fadeOut, 1);
        opacity = Math.max(0, Math.min(1, opacity));
        opacity = smoothstep(opacity);
        if (opacity > 0.5 && activeIndex < 0) {
          activeIndex = i;
        }
      }
      beat.el.style.opacity = opacity.toFixed(3);
      beat.el.style.transform =
        "translateY(" + ((1 - opacity) * 14).toFixed(1) + "px)";
      beat.el.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
    }
    // Split layout: the active beat owns the composition — which side
    // the food sits on, and whether this beat breaks full-width.
    // Classes change only on beat switch; CSS transitions do the move.
    if (this.layout === "split" && this.stage && activeIndex >= 0 &&
        activeIndex !== this.activeBeat) {
      this.activeBeat = activeIndex;
      var active = this.beats[activeIndex].data;
      if (active.side === "left") {
        this.stage.classList.add("flip");
      } else {
        this.stage.classList.remove("flip");
      }
      if (active.fullwidth) {
        this.stage.classList.add("fullwidth");
      } else {
        this.stage.classList.remove("fullwidth");
      }
      // Composition changed the media cell size — resize the canvas
      // backing store so frames stay sharp, then repaint.
      if (resizeCanvas(this.canvas)) {
        this.scheduleRender();
      }
    }
  };

  DishController.prototype.renderCinematic = function () {
    this.renderQueued = false;
    // Scrub lag: ease displayed progress toward the scroll target so
    // wheel ticks don't slam the decoder frame-to-frame (WLT feel).
    var diff = this.target - this.progress;
    if (Math.abs(diff) > SCRUB_EPSILON) {
      this.progress += diff * SCRUB_LERP;
    } else {
      this.progress = this.target;
    }
    this.targetFrame = progressToFrame(this.progress, this.frameCount);
    if (this.videoSrc && (this.videoReady || this.video)) {
      // Video dishes: GPU decode + time scrub. Before the video is
      // ready, paint any JPGs the fallback chain has produced.
      if (this.videoReady) {
        this.scrubVideo();
      } else {
        this.renderIfChanged(this.targetFrame);
      }
    } else {
      this.renderIfChanged(this.targetFrame);
    }
    this.updateTextTimeline();
    // Keep easing until settled — one rAF chain per controller, no
    // extra ScrollTriggers, no scroll capture.
    if (this.progress !== this.target) {
      this.scheduleRender();
    }
  };

  DishController.prototype.scheduleRender = function () {
    if (this.renderQueued) {
      return;
    }
    this.renderQueued = true;
    var self = this;
    window.requestAnimationFrame(function () {
      self.renderCinematic();
    });
  };

  DishController.prototype.setProgress = function (next, snap) {
    var clamped = Math.min(1, Math.max(0, next));
    if (snap) {
      // Initial paint / mid-scene reload / refresh: jump, don't glide.
      this.target = clamped;
      this.progress = clamped;
      this.scheduleRender();
      return;
    }
    if (Math.abs(clamped - this.target) < 0.000001) {
      return;
    }
    this.target = clamped;
    this.scheduleRender();
  };

  DishController.prototype.readSceneProgress = function () {
    var total = this.section.offsetHeight - window.innerHeight;
    if (total <= 0) {
      return 1;
    }
    var top = this.section.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, -top / total));
  };

  DishController.prototype.onDocumentScrollFallback = function () {
    if (this.scrollFallbackTicking) {
      return;
    }
    this.scrollFallbackTicking = true;
    var self = this;
    window.requestAnimationFrame(function () {
      self.scrollFallbackTicking = false;
      self.setProgress(self.readSceneProgress(), false);
    });
  };

  DishController.prototype.createScrollDriver = function () {
    var self = this;
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      this.scrollTrigger = window.ScrollTrigger.create({
        trigger: this.section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: function (st) {
          self.setProgress(st.progress, false);
        },
        onRefresh: function (st) {
          self.setProgress(st.progress, true);
        },
      });
      this.setProgress(this.readSceneProgress(), true);
    } else {
      window.addEventListener(
        "scroll",
        function () {
          self.onDocumentScrollFallback();
        },
        { passive: true }
      );
      this.setProgress(this.readSceneProgress());
    }
  };

  DishController.prototype.loadOne = function (index, onward) {
    var self = this;
    var img = new Image();
    img.decoding = "async";
    this.images[index] = img;
    img.onload = function () {
      self.loadedCount += 1;
      self.updateLoader();
      if (index === 1) {
        self.drawFrame(1);
      }
      if (index === self.targetFrame) {
        self.renderIfChanged(index);
      }
      if (onward) {
        onward();
      }
    };
    img.onerror = function () {
      self.loadedCount += 1;
      self.updateLoader();
      if (onward) {
        onward();
      }
    };
    img.src = this.framePath(index);
  };

  DishController.prototype.preloadSequentially = function () {
    var self = this;
    this.loadCursor += 1;
    if (this.loadCursor > this.frameCount) {
      // All frames loaded — debounced refresh so progress doesn't
      // jump mid-scroll under the user's finger.
      debouncedRefresh();
      self.scheduleRender();
      return;
    }
    this.loadOne(this.loadCursor, function () {
      self.preloadSequentially();
    });
  };

  DishController.prototype.init = function () {
    if (!this.section || !this.canvas || !this.ctx) {
      return;
    }
    if (this.layout === "split" && this.stage) {
      this.stage.classList.add("split");
    }
    if (this.preview && this.stage) {
      this.stage.classList.add("preview");
    }
    resizeCanvas(this.canvas);
    this.buildTextTimeline();
    this.createScrollDriver();
    var self = this;
    var onResize = debounce(function () {
      if (resizeCanvas(self.canvas)) {
        self.scheduleRender();
      }
    }, 150);
    window.addEventListener("resize", onResize);
    if (this.preview) {
      // No frames to load — hide loader at once, still drive text.
      if (this.loader) {
        this.loader.classList.add("is-done");
        this.loader.setAttribute("aria-hidden", "true");
      }
      this.scheduleRender();
      this.ready = true;
      return;
    }
    this.updateLoader();
    if (this.videoSrc && !this.preview) {
      // Prefer GPU video; JPG chain only starts on video error/timeout.
      this.setupVideo();
    } else {
      this.loadOne(1, function () {
        self.preloadSequentially();
      });
    }
    this.scheduleRender();
    this.ready = true;
  };

  DishController.prototype.initReducedMotion = function () {
    if (!this.section || !this.canvas || !this.ctx) {
      return;
    }
    document.body.classList.add("reduced");
    if (this.layout === "split" && this.stage) {
      this.stage.classList.add("split");
    }
    resizeCanvas(this.canvas);
    this.buildTextTimeline();
    var self = this;
    window.addEventListener("resize", function () {
      resizeCanvas(self.canvas);
    });
    if (this.beats.length) {
      for (var i = 0; i < this.beats.length; i++) {
        var isLast = i === this.beats.length - 1;
        this.beats[i].el.style.opacity = isLast ? "1" : "0";
        this.beats[i].el.style.transform = "none";
        this.beats[i].el.style.visibility = isLast ? "visible" : "hidden";
      }
    }
    if (this.loader) {
      this.loader.classList.add("is-done");
      this.loader.setAttribute("aria-hidden", "true");
    }
    if (this.preview) {
      return;
    }
    // Single static final frame: no scroll animation, no preload chain.
    this.loadOne(this.frameCount, null);
  };

  /* ---- dish nav (active state on scroll) ---- */

  function initDishNav(controllers) {
    var navLinks = document.querySelectorAll(".dish-nav-link");
    if (!navLinks.length) {
      return;
    }

    function updateActive() {
      var viewH = window.innerHeight;
      var activeId = null;
      var bestScore = -Infinity;

      for (var i = 0; i < controllers.length; i++) {
        var c = controllers[i];
        if (!c.ready || !c.section) {
          continue;
        }
        var rect = c.section.getBoundingClientRect();
        // Score: how much of the section is visible in the viewport.
        // Sections that have scrolled past get penalized.
        var visibleTop = Math.max(rect.top, 0);
        var visibleBottom = Math.min(rect.bottom, viewH);
        var visible = Math.max(0, visibleBottom - visibleTop);
        // Prefer sections whose top is near the viewport top
        var topPenalty = rect.top < 0 ? Math.abs(rect.top) * 0.5 : 0;
        var score = visible - topPenalty;
        if (score > bestScore) {
          bestScore = score;
          activeId = c.config.id;
        }
      }

      for (var j = 0; j < navLinks.length; j++) {
        var link = navLinks[j];
        if (link.getAttribute("href") === "#" + activeId) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      }
    }

    // Smooth anchor travel: Lenis when present, native smooth scroll
    // otherwise, plain jump under reduced motion. Scroll position itself
    // is still the browser's — no capture, no locking.
    var reduceNavMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (var k = 0; k < navLinks.length; k++) {
      (function (link) {
        link.addEventListener("click", function (e) {
          var hash = link.getAttribute("href");
          var target = hash && document.querySelector(hash);
          if (!target || reduceNavMotion) { return; }
          e.preventDefault();
          if (window.__CHOP_LENIS && window.__CHOP_LENIS.scrollTo) {
            window.__CHOP_LENIS.scrollTo(target);
          } else if (target.scrollIntoView) {
            target.scrollIntoView({ behavior: "smooth" });
          }
        });
      })(navLinks[k]);
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  }

  /* ---- init ---- */

  function init() {
    if (!window.CHOP_DISHES || !window.CHOP_DISHES.length) {
      return;
    }

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var controllers = [];

    for (var i = 0; i < window.CHOP_DISHES.length; i++) {
      var config = window.CHOP_DISHES[i];
      var controller = new DishController(config);
      controllers.push(controller);
      if (reduceMotion) {
        controller.initReducedMotion();
      } else {
        controller.init();
      }
    }

    initDishNav(controllers);

    if (!reduceMotion) {
      // Start lerped scroll after controllers exist so ScrollTrigger
      // measures the smoothed document. Deferred Lenis script may land
      // after us — retry once on window load.
      initSmoothScroll();
      window.addEventListener("load", function () {
        initSmoothScroll();
        debouncedRefresh();
      });
    } else if (window.ScrollTrigger) {
      window.addEventListener("load", function () {
        window.ScrollTrigger.refresh();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
