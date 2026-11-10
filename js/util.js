/* Shared helpers: scroll lock, smooth scroll, mode switch, spring hovers, time formatting. */
(function () {
  'use strict';
  var JM = (window.JM = window.JM || {});
  var html = document.documentElement;

  JM.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  JM.fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  JM.lite = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.connection && navigator.connection.saveData);
  if (JM.lite) html.classList.add('lite');

  JM.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  JM.easeInOutCubic = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  JM.easeOutCubic = function (x) { return 1 - Math.pow(1 - x, 3); };
  JM.on = function (name, fn) { document.addEventListener(name, fn); };
  JM.emit = function (name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); };
  JM.introDone = false;
  JM.onIntro = function (fn) { if (JM.introDone) fn(); else JM.on('intro:ready', fn); };

  /* scroll lock with a counter so nested layers release in order */
  var locks = 0;
  JM.stopScroll = function () { if (locks++ === 0) { html.style.overflow = 'hidden'; } };
  JM.startScroll = function () { if (locks > 0 && --locks === 0) { html.style.overflow = ''; } };

  JM.scrollToY = function (y, done) {
    var behavior = JM.reduced ? 'auto' : 'smooth';
    window.scrollTo({ top: y, behavior: behavior });
    if (done) {
      var t0 = performance.now();
      (function wait() {
        if (Math.abs(window.scrollY - y) < 24 || performance.now() - t0 > 1500) return done();
        requestAnimationFrame(wait);
      })();
    }
  };
  JM.scrollToId = function (id, done) {
    var el = document.getElementById(id);
    if (!el) return;
    setTimeout(function () {
      var y = id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY;
      JM.scrollToY(y, done);
    }, 50);
  };

  /* light / dark mode, crossfaded with View Transitions when available */
  JM.isDark = function () { return html.dataset.mode === 'dark'; };
  function applyMode(dark) {
    if (dark) html.dataset.mode = 'dark'; else delete html.dataset.mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#1A1818' : '#EEEAE6';
    try { localStorage.setItem('jm-mode', dark ? 'dark' : 'light'); } catch (e) { /* storage blocked: mode still applies */ }
    JM.emit('mode:change', { dark: dark });
  }
  JM.setMode = function (dark) {
    if (document.startViewTransition && !JM.reduced) document.startViewTransition(function () { applyMode(dark); });
    else applyMode(dark);
  };
  JM.toggleMode = function () { JM.setMode(!JM.isDark()); };

  /* India local time, shown in the header, menu and footer */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  JM.now = function () {
    var d = new Date();
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 5.5 * 3600000);
  };
  JM.fmtTime = function (d) {
    var h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m + (d.getHours() < 12 ? 'am' : 'pm');
  };
  JM.fmtDate = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + d.getFullYear(); };

  /* declarative spring hovers: data-h="s 1 1.04|y 0 -2|o .8 1" */
  function spring(el) {
    var spec = el.getAttribute('data-h').split('|').map(function (p) { var a = p.trim().split(/\s+/); return { k: a[0], a: +a[1], b: +a[2] }; });
    var hs = (el.getAttribute('data-hs') || '320 18').split(' ').map(Number);
    var trig = el.getAttribute('data-ht') ? el.closest(el.getAttribute('data-ht')) : el;
    var x = 0, v = 0, target = 0, raf = 0;
    function paint() {
      var t = { s: 1, x: 0, y: 0, r: 0, o: null };
      spec.forEach(function (p) { t[p.k] = p.a + (p.b - p.a) * x; });
      el.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px) rotate(' + t.r + 'deg) scale(' + t.s + ')';
      if (t.o !== null) el.style.opacity = t.o;
    }
    function step() {
      var dt = 1 / 60;
      v += (hs[0] * (target - x) - hs[1] * v) * dt;
      x += v * dt;
      paint();
      if (Math.abs(target - x) < 0.001 && Math.abs(v) < 0.001) { x = target; paint(); raf = 0; return; }
      raf = requestAnimationFrame(step);
    }
    function go(t) { target = t; if (!raf) raf = requestAnimationFrame(step); }
    trig.addEventListener('mouseenter', function () { go(1); });
    trig.addEventListener('mouseleave', function () { go(0); });
    trig.addEventListener('focusin', function () { go(1); });
    trig.addEventListener('focusout', function () { go(0); });
    paint();
  }
  JM.initSprings = function (root) {
    if (!JM.fine || JM.reduced) return;
    (root || document).querySelectorAll('[data-h]').forEach(spring);
  };

  /* keep focus inside an open layer */
  JM.trapFocus = function (layer, e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(layer.querySelectorAll('button,a[href],input,textarea,select,iframe,[tabindex]:not([tabindex="-1"])'), function (n) {
      return !n.disabled && n.offsetParent !== null;
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  JM.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  JM.doorSlugFromHash = function (hash) {
    var doors = (window.JM_CONTENT && window.JM_CONTENT.doors) || [];
    for (var i = 0; i < doors.length; i++) if (doors[i].slug === hash) return i;
    return -1;
  };

  JM.ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.8 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5Z"/></svg>',
    leetcode: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 0a1.4 1.4 0 0 0-1 .4L7 6.3l-.1.1-2.2 2.4a5.4 5.4 0 0 0-1.4 3 5 5 0 0 0 .1 1.9 5.2 5.2 0 0 0 1.4 2.4l3.9 4a5.6 5.6 0 0 0 7.5.4l2.4-2.3a1.4 1.4 0 1 0-1.9-2l-2.5 2.3a2.8 2.8 0 0 1-3.6-.2l-3.9-4a2.4 2.4 0 0 1-.6-1.1 2.5 2.5 0 0 1 0-1 2.6 2.6 0 0 1 .7-1.3l3-3.2 4.5-4.8a1.4 1.4 0 0 0-1-2.3ZM10.9 13a1.4 1.4 0 0 0 0 2.7h9.4a1.4 1.4 0 0 0 0-2.7h-9.4Z"/></svg>',
    gfg: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.4 10.8h-8.6v2.4h5.5a4.4 4.4 0 0 1-1.7 2.3 4.6 4.6 0 0 1-6.4-1.1h-.4a4.6 4.6 0 0 1-6.4 1.1 4.4 4.4 0 0 1-1.7-2.3h5.5v-2.4H2.6l-.1 1.2a6.9 6.9 0 0 0 11.1 5.4L12 16a6.9 6.9 0 0 0 9.5 1.2 6.9 6.9 0 0 0 0-6.4ZM6.8 8.3a4.5 4.5 0 0 1 3.4 1.5l1.7-1.7a6.9 6.9 0 0 0-10.3.6l1.9 1.4a4.5 4.5 0 0 1 3.3-1.8Zm10.4 0a4.5 4.5 0 0 1 3.3 1.8l1.9-1.4a6.9 6.9 0 0 0-10.3-.6l1.7 1.7a4.5 4.5 0 0 1 3.4-1.5Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
  };
})();
