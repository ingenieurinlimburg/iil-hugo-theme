/* Click an image in the page content to show it large in an overlay.
   Click again, or press Esc, to close. */
(function () {
  var SELECTOR = '#R-body-inner img, main img, article img';
  var EXCLUDE = '#R-logo img, .no-zoom, a img.no-zoom, .R-sidebar img, #R-sidebar img';
  var overlay = null;

  function close() {
    if (!overlay) return;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', overlay._fit);
    overlay.remove();
    overlay = null;
    document.documentElement.classList.remove('image-zoom-open');
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }

  function open(img) {
    close();
    overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', img.alt || 'Enlarged image');
    var big = document.createElement('img');
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || '';
    function fit() {
      var nw = big.naturalWidth || 1, nh = big.naturalHeight || 1;
      var k = Math.min(window.innerWidth * 0.96 / nw, window.innerHeight * 0.96 / nh);
      big.style.width = Math.round(nw * k) + 'px';
      big.style.height = Math.round(nh * k) + 'px';
    }
    big.addEventListener('load', fit);
    window.addEventListener('resize', fit);
    overlay._fit = fit;
    overlay.appendChild(big);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.documentElement.classList.add('image-zoom-open');
    document.body.appendChild(overlay);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof HTMLImageElement)) return;
    if (t.closest('.image-zoom-overlay')) return;
    if (!t.matches(SELECTOR) || t.matches(EXCLUDE) || t.closest(EXCLUDE)) return;
    e.preventDefault();
    e.stopPropagation();       /* also suppresses a theme lightbox, if any */
    e.stopImmediatePropagation();
    open(t);
  }, true);

})();
