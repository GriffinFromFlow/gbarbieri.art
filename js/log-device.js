// Log device: play/pause the audio snippet from the play button or the title,
// and raise the device on tap for touch screens (hover and
// keyboard focus are handled in CSS). The <audio> element sits outside the
// router's views, so playback continues when navigating between them.
(function () {
  var device = document.getElementById('log-device');
  var audio = document.getElementById('log-audio');
  var playBtn = device.querySelector('.log-play');
  var titleBtn = device.querySelector('.log-title');

  function toggle() {
    if (audio.paused) audio.play(); else audio.pause();
  }

  function sync() {
    var playing = !audio.paused;
    device.classList.toggle('playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause log entry' : 'Play log entry');
  }

  playBtn.addEventListener('click', toggle);
  titleBtn.addEventListener('click', toggle);
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('ended', sync);

  // Touch: tap the device to raise it, tap elsewhere to lower it.
  device.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'touch') device.classList.add('open');
  });
  document.addEventListener('pointerdown', function (e) {
    if (!device.contains(e.target)) device.classList.remove('open');
  });
})();
