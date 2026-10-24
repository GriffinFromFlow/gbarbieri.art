// Research papers: fan the stacked devices out while the pointer is over them
// (or one has keyboard focus / was tapped). A card's data-pdf is the file a click
// opens; its data-pages lists the page images shown on the screen and
// data-page-size their pixel size.
(function () {
  var stage = document.querySelector('.papers');
  if (!stage) return;
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.paper'));

  // Each screen shows the PDF's pages as pre-rendered images (data-pages), cropped to the
  // text margins so nothing but the paper is visible. They scroll on touch and mouse alike;
  // clicking/tapping (not scrolling) opens the original PDF in a new tab. The images are
  // lazy, so only the first page of each loads when the tab opens (the research view is
  // hidden until then) and the rest load as the screen scrolls.
  function loadPdfs() {
    cards.forEach(function (card) {
      var pages = (card.getAttribute('data-pages') || '').split(' ').filter(Boolean);
      var size = (card.getAttribute('data-page-size') || '').split('x');
      var body = card.querySelector('.paper-body');
      if (!pages.length || body.querySelector('.paper-pages')) return;
      var scroller = document.createElement('div');
      scroller.className = 'paper-pages';
      pages.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        if (size.length === 2) { img.width = +size[0]; img.height = +size[1]; }
        img.draggable = false;
        scroller.appendChild(img);
      });
      body.textContent = '';
      body.appendChild(scroller);
    });
  }

  loadPdfs();

  // On narrow screens the devices are a plain column: nothing fans or zooms.
  var stacked = window.matchMedia('(max-width: 700px)');

  function fan(on) {
    if (stacked.matches) on = false;
    stage.classList.toggle('fanned', on);
    if (!on) { bounds = null; zoomCard(null); }
  }

  // Touch: one card at a time can be zoomed (see the click handler).
  function zoomCard(card) {
    cards.forEach(function (c) { c.classList.toggle('zoomed', c === card); });
  }

  // Only keyboard focus keeps the fan open. A mouse click also focuses a card, but that
  // focus lingers after the pointer leaves (or after coming back from the PDF tab).
  function holdsFocus() {
    return !!stage.querySelector(':focus-visible');
  }

  // On touch the first tap only fans the stack out; once fanned (or when stacked
  // in a column on narrow screens) a tap opens the PDF. Mouse hover already fans.
  var downFanned = false;
  var downType = 'mouse';

  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') fan(true);
    });
    card.addEventListener('pointerdown', function (e) {
      downType = e.pointerType;
      downFanned = stage.classList.contains('fanned') || stacked.matches;
    });
    card.addEventListener('click', function (e) {
      // A click on the scrollbar track/thumb is for scrolling, not opening.
      var pages = card.querySelector('.paper-pages');
      if (pages && e.target === pages) {
        var box = pages.getBoundingClientRect();
        if (e.clientX > box.left + pages.clientWidth) return;
      }
      // Touch on a tablet: the first tap only fans the stack out, the next tap zooms the
      // card, and a tap on the zoomed card opens it. (Phones are a plain column: tap opens.)
      if (downType !== 'mouse' && !stacked.matches) {
        if (!downFanned) return;
        if (!card.classList.contains('zoomed')) { zoomCard(card); return; }
      }
      openPdf(card);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target === card) openPdf(card);
    });
  });

  function openPdf(card) {
    var src = card.getAttribute('data-pdf');
    if (!src) return;
    window.open(src, '_blank', 'noopener');
    // Leave the card as it was found when the user comes back: no lingering focus,
    // and on touch (where hover sticks after a tap) put the stack away.
    if (document.activeElement && stage.contains(document.activeElement)) document.activeElement.blur();
    if (downType !== 'mouse') fan(false);
  }

  // Mouse only: touch pointers "leave" the moment a finger lifts.
  stage.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse' && !holdsFocus()) fan(false);
  });

  // While fanned the stage is a full-width band, so leaving sideways never fires
  // pointerleave. Close the fan once the mouse is a little past the outermost cards.
  // The extent is measured once the cards settle (not on every move, which would force
  // layout mid-animation), widened by the hover zoom so a zoomed edge card still counts.
  var SIDE_MARGIN = 32;
  var bounds = null;

  function measure() {
    if (!stage.classList.contains('fanned')) return;
    var zoom = parseFloat(getComputedStyle(stage).getPropertyValue('--zoom')) || 1;
    var left = Infinity, right = -Infinity;
    cards.forEach(function (card) {
      var box = card.getBoundingClientRect();
      var center = box.left + box.width / 2;
      var half = card.offsetWidth * zoom / 2;
      left = Math.min(left, center - half);
      right = Math.max(right, center + half);
    });
    bounds = { left: left, right: right };
  }

  stage.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform') measure();
  });
  window.addEventListener('resize', measure);

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !bounds || holdsFocus()) return;
    if (e.clientX < bounds.left - SIDE_MARGIN || e.clientX > bounds.right + SIDE_MARGIN) fan(false);
  });

  stage.addEventListener('focusin', function () { fan(true); });

  // Crossing the breakpoint (rotating a tablet, resizing) resets any open fan.
  stacked.addEventListener('change', function () { fan(false); });

  // Clicking away (or tapping away on touch) closes the fan; tapping the empty band
  // around the cards just puts the zoomed card back.
  document.addEventListener('pointerdown', function (e) {
    if (!stage.contains(e.target)) fan(false);
    else if (!e.target.closest('.paper')) zoomCard(null);
  });
})();
