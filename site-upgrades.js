/* ===========================================================
   NextDay Digital — shared behaviour added across the site.
   Progressive enhancement only; nothing here is required to read a page.
   =========================================================== */
(function () {
  'use strict';
  if (window.__nddUpgrades) return;
  window.__nddUpgrades = true;

  /* Mark the active page in the concept tabs and drawer. */
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.concept-tabs a,.drawer a').forEach(function (a) {
    var url = new URL(a.getAttribute('href'), location.href);
    if (!url.hash && (url.pathname.split('/').pop() || 'index.html') === here) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* Highlight the section currently in view on single-page demos. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.concept-tabs a[href^="#"]'));
  if (tabs.length) {
    var pending = false;
    var mark = function () {
      var current = null;
      tabs.forEach(function (a) {
        var target = document.getElementById(a.hash.slice(1));
        if (target && target.getBoundingClientRect().top <= 180) current = a.hash;
      });
      tabs.forEach(function (a) {
        if (current && a.hash === current) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; mark(); });
    }, { passive: true });
    mark();
  }

  /* Staff workbook links are a convenience, not authentication. */
  if (new URLSearchParams(location.search).get('staff') === '1') {
    document.querySelectorAll('[data-staff-link]').forEach(function (a) { a.hidden = false; });
  }

  /* Skip links must move focus, not just the viewport. */
  document.querySelectorAll('a.skip').forEach(function (a) {
    a.addEventListener('click', function () {
      var main = document.getElementById('main');
      if (!main) return;
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    });
  });

  /* The mobile drawer should be inert and untabbable while closed. */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    var sync = function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      drawer.inert = !open;
      drawer.setAttribute('aria-hidden', String(!open));
    };
    sync();
    new MutationObserver(sync).observe(burger, { attributes: true, attributeFilter: ['aria-expanded'] });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.contains(document.activeElement)) burger.focus();
    });
    document.addEventListener('pointerdown', function (e) {
      if (burger.getAttribute('aria-expanded') !== 'true') return;
      if (!drawer.contains(e.target) && !burger.contains(e.target)) burger.click();
    });
  }
})();
