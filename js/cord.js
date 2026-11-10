/* Pull cord: a Verlet rope hanging from the top edge. Pull it down past the switch point to flip light/dark mode. */
(function () {
  'use strict';
  var JM = window.JM;
  var box = document.getElementById('cord');
  var cv = document.getElementById('cordCv');
  var hit = document.getElementById('cordHit');
  if (!box || !cv) return;
  var ctx = cv.getContext('2d');

  var N = 26, G = 4600, STEP = 1 / 120, PASSES = 16, K = 760, C = 21;
  var W, H, L, EXT_MAX, HIDDEN, thick, knobS, seg, ax, dpr;
  var pts = [], prv = [], wts = [];
  var ext = 0, extV = 0, armed = true, live = false, dropped = false;
  var grab = -1, gOff = { x: 0, y: 0 }, gTarget = null, gStart = null, lastG = null;
  var acc = 0, last = 0, raf = 0, t = 0, calm = 0, lastTouch = 0;
  var mouse = null;

  function rem(n) { return n * parseFloat(getComputedStyle(document.documentElement).fontSize); }

  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight, off;
    if (vw >= 1024) { L = JM.clamp(vh * 0.3, 190, 270); EXT_MAX = 72; thick = 3.7; knobS = 1.3; off = rem(4.25); }
    else if (vw >= 640) { L = JM.clamp(vh * 0.2, 160, 220); EXT_MAX = 62; thick = 3.4; knobS = 1.2; off = rem(5.9); }
    else { L = 70; EXT_MAX = 54; thick = 3.1; knobS = 1.1; off = rem(5.7); }
    var clock = document.querySelector('.clock');
    if (clock && clock.offsetParent) {
      var r = clock.getBoundingClientRect();
      off = vw >= 1200 ? Math.max(rem(1.2), vw - r.right - rem(1.4)) : (vw - r.left) + rem(1.4);
    }
    W = Math.min(vw, 340);
    HIDDEN = EXT_MAX + 18;
    H = L + EXT_MAX + 170;
    seg = (L + HIDDEN) / N;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    box.style.height = H + 'px';
    cv.width = W * dpr; cv.height = H * dpr;
    var nax = JM.clamp(W - off, 20, W - 20);
    if (pts.length && ax !== undefined) {
      var dx = nax - ax;
      for (var i = 0; i < pts.length; i++) { pts[i].x += dx; prv[i].x += dx; }
    }
    ax = nax;
  }

  function init() {
    pts = []; prv = []; wts = [];
    for (var i = 0; i <= N; i++) {
      var p = { x: ax + i * 0.6, y: -HIDDEN - (N - i) * 0.5 - 40 };
      pts.push(p); prv.push({ x: p.x, y: p.y });
      wts.push(i === 0 ? 0 : i === N ? 0.28 : 1);
    }
  }

  function simulate(dt) {
    t += dt;
    if (grab < 0) {
      extV += (-K * ext - C * extV) * dt;
      ext += extV * dt;
    }
    ext = JM.clamp(ext, -8, EXT_MAX * 1.15);
    if (live && armed && ext > EXT_MAX * 0.8) { armed = false; JM.toggleMode(); if (navigator.vibrate) navigator.vibrate(12); }
    if (ext < EXT_MAX * 0.22) armed = true;

    var wind = JM.reduced ? 0 : Math.sin(t * 0.63) * 16 + Math.sin(t * 1.71 + 1.3) * 7;
    var damp = grab >= 0 ? 0.992 : 0.9875;
    if (grab < 0 && performance.now() - lastTouch > 2500) damp *= 0.995;
    for (var i = 1; i <= N; i++) {
      if (i === grab) continue;
      var p = pts[i], q = prv[i];
      var vx = (p.x - q.x) * damp, vy = (p.y - q.y) * damp;
      q.x = p.x; q.y = p.y;
      p.x += vx + wind * (i / N) * dt * dt;
      p.y += vy + G * dt * dt;
    }
    pts[0].x = ax; pts[0].y = -HIDDEN + ext;
    if (grab >= 0 && gTarget) { pts[grab].x = gTarget.x; pts[grab].y = gTarget.y; }

    for (var k = 0; k < PASSES; k++) {
      for (var j = 0; j < N; j++) {
        var a = pts[j], b = pts[j + 1];
        var wa = j === grab ? 0 : wts[j], wb = j + 1 === grab ? 0 : wts[j + 1], tw = wa + wb;
        if (!tw) continue;
        var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        if (d <= seg) continue;
        var f = (d - seg) / d;
        a.x += dx * f * wa / tw; a.y += dy * f * wa / tw;
        b.x -= dx * f * wb / tw; b.y -= dy * f * wb / tw;
      }
    }
    for (var m = 1; m <= N; m++) {
      pts[m].x = JM.clamp(pts[m].x, 14, W - 14);
      if (pts[m].y > H - 46) pts[m].y = H - 46;
    }
  }

  function motion() {
    var mx = Math.abs(extV) * 0.002;
    for (var i = 1; i <= N; i++) mx = Math.max(mx, Math.abs(pts[i].x - prv[i].x), Math.abs(pts[i].y - prv[i].y));
    return mx;
  }

  function path() {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < N; i++) {
      var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[N].x, pts[N].y);
  }

  function knob(shadow) {
    var a = pts[N], b = pts[N - 1];
    var ang = Math.atan2(a.y - b.y, a.x - b.x) - Math.PI / 2;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(ang);
    ctx.scale(knobS, knobS);
    if (shadow) {
      ctx.beginPath(); pear(); ctx.fill();
      ctx.restore(); return;
    }
    var fg = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
    fg.addColorStop(0, '#5b4a2c'); fg.addColorStop(0.35, '#e8d59e'); fg.addColorStop(0.7, '#b0924f'); fg.addColorStop(1, '#4a3a1f');
    ctx.fillStyle = fg; ctx.fillRect(-3.5, -1, 7, 8.6);
    ctx.fillStyle = 'rgba(40,28,12,.55)'; ctx.fillRect(-3.5, 1.4, 7, 0.9); ctx.fillRect(-3.5, 5, 7, 0.9);
    var bg = ctx.createLinearGradient(-9.6, 0, 9.6, 0);
    [['#24150c', 0], ['#6b3f22', 0.2], ['#a8693d', 0.42], ['#7c4828', 0.62], ['#3b2213', 0.84], ['#1d110a', 1]].forEach(function (s) { bg.addColorStop(s[1], s[0]); });
    ctx.beginPath(); pear(); ctx.fillStyle = bg; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(30,16,8,.28)'; ctx.lineWidth = 0.5;
    for (var g = 0; g < 7; g++) {
      var gx = -7 + g * 2.3;
      ctx.beginPath(); ctx.moveTo(gx, 7); ctx.bezierCurveTo(gx + 1.5, 18, gx - 1.5, 28, gx + 0.6, 42); ctx.stroke();
    }
    var kl = ctx.createRadialGradient(-3.5, 19, 0, -3.5, 19, 9);
    kl.addColorStop(0, 'rgba(255,220,170,.38)'); kl.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = kl; ctx.fillRect(-10, 6, 20, 37);
    var oc = ctx.createLinearGradient(0, 32, 0, 42);
    oc.addColorStop(0, 'rgba(0,0,0,0)'); oc.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = oc; ctx.fillRect(-10, 30, 20, 13);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-4.2, 23, 1.3, 4.2, -0.15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,240,215,.45)'; ctx.fill();
    ctx.restore();
  }
  function pear() {
    ctx.moveTo(-3, 7);
    ctx.bezierCurveTo(-4, 14, -9.6, 20, -9.6, 29);
    ctx.bezierCurveTo(-9.6, 37, -5, 42, 0, 42);
    ctx.bezierCurveTo(5, 42, 9.6, 37, 9.6, 29);
    ctx.bezierCurveTo(9.6, 20, 4, 14, 3, 7);
    ctx.closePath();
  }

  function braid() {
    ctx.strokeStyle = 'rgba(96,82,64,.55)'; ctx.lineWidth = 0.8;
    var gap = thick * 1.05, carry = 0;
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      if (!len) continue;
      var tx = dx / len, ty = dy / len, nx = -ty, ny = tx;
      for (var s = carry; s < len; s += gap) {
        var px = a.x + tx * s, py = a.y + ty * s, h = thick * 0.45;
        ctx.moveTo(px - nx * h - tx * h * 0.7, py - ny * h - ty * h * 0.7);
        ctx.lineTo(px + nx * h + tx * h * 0.7, py + ny * h + ty * h * 0.7);
        carry = s + gap - len;
      }
    }
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!dropped) return;
    var sh = JM.isDark() ? 0.55 : 0.2;
    ctx.save();
    ctx.translate(7, 11);
    ctx.filter = 'blur(3px)';
    ctx.strokeStyle = ctx.fillStyle = 'rgba(0,0,0,' + sh + ')';
    ctx.lineWidth = thick; ctx.lineCap = 'round';
    path(); ctx.stroke(); knob(true);
    ctx.restore();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = '#6f6455'; ctx.lineWidth = thick + 1.3; ctx.stroke();
    ctx.strokeStyle = '#d6ccba'; ctx.lineWidth = thick; ctx.stroke();
    braid();
    ctx.save(); ctx.translate(-thick * 0.22, 0);
    path(); ctx.strokeStyle = 'rgba(255,252,244,.55)'; ctx.lineWidth = thick * 0.28; ctx.stroke();
    ctx.restore();
    knob(false);
    var k = pts[N];
    hit.style.transform = 'translate(' + k.x + 'px,' + (k.y + 24 * knobS) + 'px)';
  }

  function loop(now) {
    var dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    acc += dt;
    while (acc >= STEP) { simulate(STEP); acc -= STEP; }
    draw();
    if (grab < 0 && live && motion() < 0.06 && Math.abs(ext) < 0.5) { if (++calm > 30) { raf = 0; return; } }
    else calm = 0;
    raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (!dropped) return;
    calm = 0;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  function local(e) {
    var r = box.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function tug() {
    if (!live) return;
    extV = EXT_MAX * 44;
    prv[N].x -= (Math.random() > 0.5 ? 1 : -1) * 3;
    lastTouch = performance.now();
    wake();
  }
  function startGrab(i, e) {
    var p = local(e);
    grab = i;
    gOff = { x: p.x - pts[i].x, y: p.y - pts[i].y };
    gTarget = { x: pts[i].x, y: pts[i].y };
    gStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    lastG = { x: pts[i].x, y: pts[i].y };
    box.classList.add('dragging');
    lastTouch = performance.now();
    wake();
  }
  function moveGrab(e) {
    if (grab < 0) return;
    var p = local(e), tx = p.x - gOff.x, ty = p.y - gOff.y;
    var bx = ax, by = -HIDDEN, reach = grab * seg;
    var dx = tx - bx, dy = ty - by, d = Math.sqrt(dx * dx + dy * dy) || 1;
    var need = d - reach;
    if (need > EXT_MAX) {
      var over = need - EXT_MAX, allowed = reach + EXT_MAX + over * 0.14 / (1 + over / 160);
      tx = bx + dx / d * allowed; ty = by + dy / d * allowed;
      need = allowed - reach;
    }
    var prevExt = ext;
    ext += (Math.max(0, need) - ext) * 0.55;
    extV = (ext - prevExt) * 60;
    lastG = { x: gTarget.x, y: gTarget.y };
    gTarget = { x: tx, y: ty };
    lastTouch = performance.now();
    wake();
  }
  function endGrab(e) {
    if (grab < 0) return;
    var i = grab;
    var moved = Math.hypot(e.clientX - gStart.x, e.clientY - gStart.y);
    var quick = performance.now() - gStart.t < 300;
    prv[i].x = pts[i].x - (gTarget.x - lastG.x) * 0.5;
    prv[i].y = pts[i].y - (gTarget.y - lastG.y) * 0.5;
    grab = -1; gTarget = null;
    box.classList.remove('dragging');
    if (moved < 6 && quick) tug();
    wake();
  }

  hit.addEventListener('pointerdown', function (e) {
    if (!live) return;
    e.preventDefault();
    hit.setPointerCapture(e.pointerId);
    startGrab(N, e);
  });
  hit.addEventListener('pointermove', moveGrab);
  hit.addEventListener('pointerup', endGrab);
  hit.addEventListener('pointercancel', endGrab);
  hit.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tug(); }
  });

  /* desktop: grab the rope anywhere along its length, and brush it with the cursor */
  if (JM.fine) {
    var winGrab = false;
    window.addEventListener('pointerdown', function (e) {
      if (!live || e.button !== 0 || e.target === hit || box.classList.contains('away')) return;
      var p = local(e);
      for (var i = N - 1; i >= 2; i--) {
        if (Math.hypot(pts[i].x - p.x, pts[i].y - p.y) < 11) { e.preventDefault(); winGrab = true; startGrab(i, e); return; }
      }
    }, true);
    window.addEventListener('pointermove', function (e) {
      if (winGrab) return moveGrab(e);
      if (!dropped) return;
      var p = local(e);
      if (mouse && p.y < H && p.x > 0) {
        var vx = p.x - mouse.x, vy = p.y - mouse.y, touched = false;
        for (var i = 2; i <= N; i++) {
          var d = Math.hypot(pts[i].x - p.x, pts[i].y - p.y);
          if (d < 16) { var s = (1 - d / 16) * 0.35; prv[i].x -= vx * s; prv[i].y -= vy * s * 0.5; touched = true; }
        }
        if (touched) wake();
      }
      mouse = p;
    });
    window.addEventListener('pointerup', function (e) { if (winGrab) { winGrab = false; endGrab(e); } });
  }

  function syncAria() { hit.setAttribute('aria-checked', JM.isDark() ? 'true' : 'false'); }
  JM.on('mode:change', function () { syncAria(); wake(); });
  syncAria();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { layout(); wake(); draw(); }, 120);
  });

  layout();
  init();
  JM.onIntro(function () {
    setTimeout(function () {
      dropped = true;
      for (var i = 1; i <= N; i++) prv[i].x = pts[i].x + 2.2 * (i / N);
      wake();
      setTimeout(function () { live = true; }, 900);
    }, 650);
  });
  JM.cord = { away: function (on) { box.classList.toggle('away', !!on); } };
})();
