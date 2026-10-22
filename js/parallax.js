// Parallax for the space + planet background layers (body::before / body::after).
// The space layer travels further than the planet layer; both are clamped to
// the overscan margin in style.css so no edges are ever exposed.
(function () {
  var root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SPACE = { pointer: 50, scroll: 0.2, margin: 0.06 };
  var PLANET = { pointer: 25, scroll: 0.1, margin: 0.03 };

  var nx = 0, ny = 0;          // pointer position, -1..1 from window center
  var virtualScroll = 0;       // stands in for scrollY when the page can't scroll
  var cur = { sx: 0, sy: 0, px: 0, py: 0 };

  function clamp(v, max) { return Math.max(-max, Math.min(max, v)); }

  function canScroll() {
    return document.documentElement.scrollHeight > window.innerHeight + 1;
  }

  // Real scroll position if the page scrolls, otherwise the wheel/swipe total.
  function scrollPos() {
    return canScroll() ? window.scrollY : virtualScroll;
  }

  // Virtual range ends exactly where the space layer hits its overscan margin.
  function addVirtual(dy) {
    if (canScroll()) return;
    var max = window.innerHeight * SPACE.margin / SPACE.scroll;
    virtualScroll = Math.max(0, Math.min(max, virtualScroll + dy));
  }

  function target(layer) {
    var x = -nx * layer.pointer;
    var y = -ny * layer.pointer - scrollPos() * layer.scroll;
    return {
      x: clamp(x, window.innerWidth * layer.margin),
      y: clamp(y, window.innerHeight * layer.margin)
    };
  }

  function frame() {
    var s = target(SPACE), p = target(PLANET);
    cur.sx += (s.x - cur.sx) * 0.08;
    cur.sy += (s.y - cur.sy) * 0.08;
    cur.px += (p.x - cur.px) * 0.08;
    cur.py += (p.y - cur.py) * 0.08;
    root.style.setProperty('--space-x', cur.sx.toFixed(2) + 'px');
    root.style.setProperty('--space-y', cur.sy.toFixed(2) + 'px');
    root.style.setProperty('--planet-x', cur.px.toFixed(2) + 'px');
    root.style.setProperty('--planet-y', cur.py.toFixed(2) + 'px');
    requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', function (e) {
    nx = (e.clientX / window.innerWidth) * 2 - 1;
    ny = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener('wheel', function (e) {
    addVirtual(e.deltaY * (e.deltaMode === 1 ? 16 : 1) * 0.5);
  }, { passive: true });

  var touchY = null;
  window.addEventListener('touchstart', function (e) {
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    var y = e.touches[0].clientY;
    if (touchY !== null) addVirtual(touchY - y);
    touchY = y;
  }, { passive: true });

  requestAnimationFrame(frame);
})();
