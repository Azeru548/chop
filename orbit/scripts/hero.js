/* CHOP — Landing hero video driver.
   The landing is a sticky fullscreen stage: the hero film plays behind
   the CHOP title, then dims (and drifts slightly) as the user scrolls
   into the catalog. Same discipline as the dish engine: the browser
   owns scrolling — passive rAF-throttled listener only, no input
   capture, no body locking, no preventDefault. Reduced motion gets a
   static landing (video hidden by CSS). */
(function () {
  "use strict";

  var landing = document.querySelector(".landing");
  var video = document.querySelector(".landing-video");
  if (!landing || !video) {
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    return; // CSS renders the static landing; no video, no driver.
  }

  var ticking = false;

  function update() {
    ticking = false;
    var h = window.innerHeight || 1;
    var rect = landing.getBoundingClientRect();
    // 0 = at rest (title fully lit), 1 = landing fully released.
    var travel = Math.max(1, landing.offsetHeight - h);
    var p = Math.min(1, Math.max(0, -rect.top / travel));

    // Video dims out across the whole exit, with a subtle upward drift.
    video.style.opacity = (1 - p).toFixed(3);
    video.style.transform = "translateY(" + (p * -10).toFixed(2) + "%)";

    // Title yields quickly (first 35% of the exit) so the dish takes over.
    var textP = Math.min(1, p / 0.35);
    landing.style.setProperty("--hero-text", (1 - textP).toFixed(3));
  }

  function onScroll() {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(update);
  }

  // Autoplay is muted+playsinline; belt-and-braces play() in case the
  // browser defers it. Failure is fine — the video's first frame is
  // black, which is a valid resting state for the landing.
  function tryPlay() {
    var attempt = video.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {});
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", tryPlay);
  tryPlay();
  update();
})();
