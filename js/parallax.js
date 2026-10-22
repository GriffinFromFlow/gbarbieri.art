// Parallax for the space + planet background layers (body::before / body::after).
// The space layer travels further than the planet layer. Each layer's overscan
// margin (set in style.css) is split between cursor movement (40%) and scroll
// movement (the rest), so neither can expose an edge or crowd out the other.
(function () {
  var root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // pointer: max px of cursor shift; scroll: px of shift per px scrolled;
  // margin: overscan as a fraction of the viewport (matches inset in style.css).
  var SPACE = { pointer: 50, scroll: 0.5, margin: 0.06 };
  var PLANET = { pointer: 25, scroll: 0.25, margin: 0.03 };
  var POINTER_SHARE = 0.4;

  var nx = 0, ny = 0;                 // pointer position, -1..1 from window center
  var virtual = { x: 0, y: 0 };       // stands in for scroll when the page can't scroll
  var cur = { sx: 0, sy: 0, px: 0, py: 0 };

  function clamp(v, max) { return Math.max(-max, Math.min(max, v)); }

  function pointerMax(layer, dim) {
    return Math.min(layer.pointer, dim * layer.margin * POINTER_SHARE);
  }

  function scrollMax(layer, dim) {
    return dim * layer.margin - pointerMax(layer, dim);
  }

  function canScrollY() {
    return document.documentElement.scrollHeight > window.innerHeight + 1;
  }

  function canScrollX() {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  }

  // Virtual range ends exactly where the space layer uses up its scroll share.
  function addVirtual(dx, dy) {
    if (!canScrollX()) {
      var mx = scrollMax(SPACE, window.innerWidth) / SPACE.scroll;
      virtual.x = clamp(virtual.x + dx, mx);
    }
    if (!canScrollY()) {
      var my = scrollMax(SPACE, window.innerHeight) / SPACE.scroll;
      virtual.y = clamp(virtual.y + dy, my);
    }
  }

  function target(layer) {
    var w = window.innerWidth, h = window.innerHeight;
    var sx = canScrollX() ? window.scrollX : virtual.x;
    var sy = canScrollY() ? window.scrollY : virtual.y;
    return {
      x: -nx * pointerMax(layer, w) + clamp(-sx * layer.scroll, scrollMax(layer, w)),
      y: -ny * pointerMax(layer, h) + clamp(-sy * layer.scroll, scrollMax(layer, h))
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
    var unit = e.deltaMode === 1 ? 16 : 1;
    addVirtual(e.deltaX * unit, e.deltaY * unit);
  }, { passive: true });

  var touch = null;
  window.addEventListener('touchstart', function (e) {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    if (touch) addVirtual(touch.x - t.clientX, touch.y - t.clientY);
    touch = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  requestAnimationFrame(frame);
})();
