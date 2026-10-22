// Single-page navigation: each <main id="..."> is a view, shown by URL hash.
// The document never reloads, so anything persistent (e.g. audio) keeps playing.
(function () {
  var views = Array.prototype.slice.call(document.querySelectorAll('main[id]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-header a[href^="#"]'));
  var fallback = views[0];

  function show() {
    var id = location.hash.slice(1);
    var active = views.filter(function (v) { return v.id === id; })[0] || fallback;
    views.forEach(function (v) { v.hidden = v !== active; });
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + active.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = active.dataset.title + ' | gbarbieriart';
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', show);
  show();
})();
