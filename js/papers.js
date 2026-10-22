// Research papers: fan the stacked devices out while the pointer is over them
// (or one has keyboard focus / was tapped), and load each PDF into its screen
// the first time they fan out. Set a card's PDF with its data-pdf attribute.
(function () {
  var stage = document.querySelector('.papers');
  if (!stage) return;
  var cards = Array.prototype.slice.call(stage.querySelectorAll('.paper'));

  function loadPdfs() {
    cards.forEach(function (card) {
      var src = card.getAttribute('data-pdf');
      var body = card.querySelector('.paper-body');
      if (!src || body.querySelector('iframe')) return;
      var frame = document.createElement('iframe');
      frame.src = src + '#toolbar=0&navpanes=0&view=FitH';
      frame.title = card.getAttribute('aria-label');
      body.textContent = '';
      body.appendChild(frame);
    });
  }

  function fan(on) {
    stage.classList.toggle('fanned', on);
    if (on) loadPdfs();
  }

  function holdsFocus() {
    return stage.contains(document.activeElement);
  }

  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function () { fan(true); });
  });

  // Mouse only: touch pointers "leave" the moment a finger lifts.
  stage.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse' && !holdsFocus()) fan(false);
  });

  stage.addEventListener('focusin', function () { fan(true); });

  // Clicking away (or tapping away on touch) closes the fan.
  document.addEventListener('pointerdown', function (e) {
    if (!stage.contains(e.target)) fan(false);
  });
})();
