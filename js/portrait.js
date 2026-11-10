/* Portrait: black-and-white by default; the cursor paints colour back in with a soft brush that fades. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var fig = document.getElementById('fig'), img = document.getElementById('figBase'), cv = document.getElementById('figCanvas');
  if (!fig || !img) return;
  img.src = C.portrait.src;
  var cover = !C.portrait.cutout;
  fig.classList.toggle('fig--framed', cover);
  /* mono:true restores the black-and-white portrait with the colour-brush reveal */
  var mono = !!C.portrait.mono;
  fig.classList.toggle('fig--mono', mono);

  var desktop = window.matchMedia('(min-width:1024px) and (hover:hover)').matches;
  if (!mono || !desktop || JM.reduced || !cv) { if (cv) cv.remove(); return; }

  var ctx = cv.getContext('2d');
  var bw = document.createElement('canvas'), col = document.createElement('canvas'), mask = document.createElement('canvas'), tmp = document.createElement('canvas');
  var bctx = bw.getContext('2d'), cctx = col.getContext('2d'), mctx = mask.getContext('2d'), tctx = tmp.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2), R = 143, w = 0, h = 0;
  var queue = [], last = null, idle = 999, showing = false, raf = 0, ok = false;

  function fitDraw(c, filter) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var s = cover ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    var dx = (w - dw) / 2, dy = cover ? (h - dh) * 0.3 : h - dh;
    c.clearRect(0, 0, w, h);
    c.filter = filter || 'none';
    c.drawImage(img, dx, dy, dw, dh);
    c.filter = 'none';
  }
  function size() {
    var r = fig.getBoundingClientRect();
    w = Math.round(r.width * dpr); h = Math.round(r.height * dpr);
    [cv, bw, col, mask, tmp].forEach(function (c) { c.width = w; c.height = h; });
    if (!img.naturalWidth) return;
    fitDraw(bctx, 'grayscale(1) contrast(1.04)');
    fitDraw(cctx);
    ok = true;
  }
  function stamp(x, y) {
    var r = R * dpr, g = mctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.82)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mctx.fillStyle = g;
    mctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function frame() {
    raf = 0;
    if (!ok) return;
    var drawing = queue.length > 0;
    idle = drawing ? 0 : idle + 1;
    mctx.globalCompositeOperation = 'destination-out';
    mctx.fillStyle = 'rgba(0,0,0,' + (drawing ? 0.016 : Math.min(0.016 + idle * 0.004, 0.5)) + ')';
    mctx.fillRect(0, 0, w, h);
    mctx.globalCompositeOperation = 'source-over';
    queue.forEach(function (p) { stamp(p.x, p.y); });
    queue = [];
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bw, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, w, h);
    tctx.drawImage(col, 0, 0);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(tmp, 0, 0);
    if (!showing) { showing = true; img.style.opacity = '0'; }
    if (idle > 120) {
      ctx.clearRect(0, 0, w, h); mctx.clearRect(0, 0, w, h);
      img.style.opacity = ''; showing = false; return;
    }
    raf = requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', function (e) {
    if (!ok) return;
    var r = fig.getBoundingClientRect();
    if (e.clientX < r.left - R || e.clientX > r.right + R || e.clientY < r.top - R || e.clientY > r.bottom + R) { last = null; return; }
    var p = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
    if (last) {
      var d = Math.hypot(p.x - last.x, p.y - last.y), stepLen = R * dpr * 0.3, n = Math.min(60, Math.floor(d / stepLen));
      for (var i = 1; i <= n; i++) queue.push({ x: last.x + (p.x - last.x) * i / (n + 1), y: last.y + (p.y - last.y) * i / (n + 1) });
    }
    queue.push(p); last = p;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });

  if (img.complete && img.naturalWidth) size(); else img.addEventListener('load', size);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
  fig.addEventListener('transitionend', size, { once: true });
})();
