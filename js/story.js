/* My story: chapters scroll past a sticky year odometer; a dot rides the timeline; a clock tunnel spins behind. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var sec = document.getElementById('about'), list = document.getElementById('storyList');
  var yr = document.getElementById('storyYr'), when = document.getElementById('storyWhen');
  var count = document.getElementById('storyCount'), of = document.getElementById('storyOf');
  var line = sec.querySelector('.story__line');
  var S = C.story, n = S.length;

  list.innerHTML = S.map(function (c) {
    var org = c.org === 'Healtine.com · Sole developer' ? '<a href="https://healtine.com" target="_blank" rel="noopener">Healtine.com</a> · Sole developer' : JM.esc(c.org);
    return '<li class="ch' + (c.now ? ' ch--now' : '') + '"><p class="ch__date">' + JM.esc(c.when) + '</p><h3 class="ch__t">' + JM.esc(c.title) + '</h3>' +
      '<p class="ch__org">' + org + '</p><ul class="ch__b">' + c.points.map(function (p) { return '<li>' + JM.esc(p) + '</li>'; }).join('') + '</ul></li>';
  }).join('');
  var chs = list.querySelectorAll('.ch');
  of.textContent = '/ ' + String(n).padStart(2, '0');
  var col = '';
  for (var d = 0; d < 10; d++) col += '<i>' + d + '</i>';
  yr.innerHTML = ('<span class="dg"><span class="dg__c">' + col + '</span></span>').repeat(4);
  var digits = yr.querySelectorAll('.dg__c');

  var cur = -1, firstY = 0, lastY = 1, p = 0;
  function show(i) {
    if (i === cur) return;
    cur = i;
    chs.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    String(S[i].year).split('').forEach(function (ch, k) { digits[k].style.setProperty('--d', ch); });
    yr.setAttribute('aria-label', S[i].year);
    when.textContent = S[i].when;
    count.textContent = String(i + 1).padStart(2, '0');
    sec.classList.toggle('is-now', !!S[i].now);
    sec.dataset.ch = i;
  }
  function measure() {
    var lr = line.getBoundingClientRect();
    firstY = chs[0].firstElementChild.getBoundingClientRect().top - lr.top + 8;
    lastY = chs[n - 1].firstElementChild.getBoundingClientRect().top - lr.top + 8;
    [line.querySelector('.story__rail'), line.querySelector('.story__ttrack'), line.querySelector('.story__dtrack')].forEach(function (el) {
      el.style.setProperty('--r0', firstY + 'px');
      el.style.setProperty('--rh', (lastY - firstY) + 'px');
    });
  }
  var ticking = false;
  function update() {
    ticking = false;
    var lr = line.getBoundingClientRect(), mid = window.innerHeight * 0.5;
    var y = JM.clamp(mid - lr.top, firstY, lastY);
    p = (y - firstY) / Math.max(1, lastY - firstY);
    sec.style.setProperty('--p', p.toFixed(4));
    sec.style.setProperty('--warm', p.toFixed(3));
    sec.classList.toggle('at-start', p < 0.002);
    var a = 0;
    chs.forEach(function (c, k) { if (c.getBoundingClientRect().top < mid + 40) a = k; });
    show(a);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });
  measure(); show(0); update();

  /* clock tunnel behind the year */
  var cv = document.getElementById('storyBg');
  if (!cv || JM.reduced || JM.lite || !window.matchMedia('(min-width:768px)').matches) return;
  var ctx = cv.getContext('2d'), RINGS = 16, GAP = 340, FOCAL = 520, RAD = 620, TICKS = 60, W = 0, H = 0, dpr = 1, visible = false, raf = 0, shownP = 0;
  var dust = [];
  for (var k = 0; k < 70; k++) dust.push({ a: Math.random() * Math.PI * 2, r: 0.2 + Math.random() * 0.9, z: Math.random() });
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
  }
  function drawTunnel() {
    raf = 0;
    if (!visible) return;
    shownP += (p - shownP) * 0.12;
    var rgb = getComputedStyle(document.documentElement).getPropertyValue('--fg-rgb').trim() || '26,24,24';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var len = RINGS * GAP, camZ = shownP * (RINGS - 1) * GAP * 1.6, rot = -shownP * Math.PI * 1.5;
    var cx = W * 0.5, cy = H * 0.55, kk = Math.min(W, H) / 900;
    for (var i = 0; i < RINGS; i++) {
      var z = ((i * GAP - camZ) % len + len) % len + 60;
      var s = FOCAL / z * kk, r = RAD * s;
      var fog = JM.clamp((z - 260) / 1100, 0, 1) * Math.max(0, 1 - z / len);
      if (fog <= 0.01) continue;
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (fog * 0.12) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      for (var t = 0; t < TICKS; t++) {
        var hour = t % 5 === 0, ang = rot + t / TICKS * Math.PI * 2, l = (hour ? 46 : 18) * s;
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (fog * (hour ? 0.3 : 0.14)) + ')';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.lineTo(cx + Math.cos(ang) * (r - l), cy + Math.sin(ang) * (r - l));
        ctx.stroke();
      }
      if (r < Math.min(W, H) * 0.45) {
        var ha = rot * 3 + i;
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (fog * 0.16) + ')';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * r * 0.55, cy + Math.sin(ha) * r * 0.55); ctx.stroke();
      }
    }
    dust.forEach(function (d) {
      var dz = ((d.z * len - camZ * 0.6) % len + len) % len + 60, ds = FOCAL / dz * kk;
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.25 * Math.max(0, 1 - dz / len)) + ')';
      ctx.fillRect(cx + Math.cos(d.a + rot) * RAD * d.r * ds, cy + Math.sin(d.a + rot) * RAD * d.r * ds, 1.5, 1.5);
    });
    if (Math.abs(p - shownP) > 0.0005) raf = requestAnimationFrame(drawTunnel);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(drawTunnel); }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { size(); kick(); } }).observe(sec);
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { size(); kick(); });
  JM.on('mode:change', function () { setTimeout(kick, 30); });
})();
