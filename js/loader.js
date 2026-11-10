/* Intro loader: discipline pills stack up while assets load, then fly apart to open the page. */
(function () {
  'use strict';
  var JM = window.JM;
  var loader = document.getElementById('loader');
  var pills = loader ? loader.querySelectorAll('.ld__pill') : [];
  var count = document.getElementById('ldCount');
  var finished = false;

  function ready() {
    if (finished) return;
    finished = true;
    document.body.classList.add('ready');
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    JM.startScroll();
    JM.introDone = true;
    JM.emit('intro:ready');
  }

  var hash = location.hash.replace('#', '');
  var skip = ['works', 'about', 'contact', 'home'].indexOf(hash) !== -1 || JM.doorSlugFromHash(hash) >= 0;
  if (!loader || skip) {
    JM.stopScroll();
    requestAnimationFrame(ready);
    return;
  }

  JM.stopScroll();
  var bail = setTimeout(ready, 9000);
  window.addEventListener('error', function () { clearTimeout(bail); ready(); }, { once: true });

  var ceiling = 0.55;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ceiling = Math.max(ceiling, 0.85); });
  function full() { ceiling = 1; }
  if (document.readyState === 'complete') full(); else window.addEventListener('load', full, { once: true });
  setTimeout(full, 5000);

  function finish() {
    loader.classList.add('out');
    setTimeout(function () { document.body.classList.add('ready'); }, 260);
    setTimeout(function () { clearTimeout(bail); ready(); }, 1250);
  }

  if (JM.reduced) {
    count.textContent = '100';
    loader.style.setProperty('--p', 1);
    pills.forEach(function (p) { p.classList.add('on'); });
    setTimeout(finish, 500);
    return;
  }

  var t0 = performance.now(), shown = 0;
  (function frame(now) {
    var want = Math.min(JM.easeInOutCubic(Math.min(1, (now - t0) / 1600)), ceiling);
    shown += (want - shown) * 0.18;
    if (want >= 1 && 1 - shown < 0.004) shown = 1;
    loader.style.setProperty('--p', shown.toFixed(4));
    for (var k = 0; k < pills.length; k++) pills[k].classList.toggle('on', shown >= k / pills.length + 0.02);
    count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    if (shown >= 1) return setTimeout(finish, 520);
    requestAnimationFrame(frame);
  })(t0);
})();
