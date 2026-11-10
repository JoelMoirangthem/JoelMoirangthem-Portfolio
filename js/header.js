/* Header: live India clock, sticky state, hero profile links. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var hdr = document.getElementById('hdr');

  function tick() {
    var d = JM.now(), t = JM.fmtTime(d);
    document.querySelectorAll('[data-time],[data-navtime],[data-ftime]').forEach(function (n) { n.textContent = t; });
    document.querySelectorAll('[data-date]').forEach(function (n) { n.textContent = JM.fmtDate(d); });
    document.querySelectorAll('[data-fyear]').forEach(function (n) { n.textContent = d.getFullYear(); });
  }
  tick();
  setInterval(tick, 1000);

  function onScroll() {
    hdr.classList.toggle('stuck', window.scrollY > 24);
    document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var links = [
    ['github', 'GitHub', C.links.github],
    ['linkedin', 'LinkedIn', C.links.linkedin],
    ['leetcode', 'LeetCode', C.links.leetcode],
    ['gfg', 'GeeksforGeeks', C.links.gfg]
  ];
  document.getElementById('heroLinks').innerHTML = links.map(function (l) {
    return '<a href="' + l[2] + '" target="_blank" rel="noopener">' + JM.ICONS[l[0]] + l[1] + '</a>';
  }).join('');

  document.querySelectorAll('.nav button>span').forEach(function (s) { s.setAttribute('data-h', 'y 0 -2|o .8 1'); });
  document.getElementById('menuBtn').setAttribute('data-h', 's 1 1.05');
  document.querySelectorAll('.pill').forEach(function (p) { p.setAttribute('data-h', 's 1 1.04'); });
  JM.initSprings();
})();
