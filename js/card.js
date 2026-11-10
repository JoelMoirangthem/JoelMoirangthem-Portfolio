/* Ability card: a tilting, flippable trading card with foil and glare that follow the pointer. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var holo = document.getElementById('holo'), hc = document.getElementById('hc');
  var openers = [document.getElementById('holoOpen'), document.getElementById('fig')];
  var closeBtn = document.getElementById('holoClose');
  if (!holo || !hc) return;
  hc.querySelector('.hc__win img').src = C.portrait.src;

  var tx = 0, ty = 0, cx = 0, cy = 0, held = false, raf = 0, t0 = 0, down = null, back = null;

  function loop(now) {
    var t = (now - t0) / 1000, sway = held || JM.reduced ? 0 : 1;
    cx += (tx + sway * Math.sin(t * 0.62) * 0.34 - cx) * 0.12;
    cy += (ty + sway * Math.sin(t * 0.47 + 1.1) * 0.22 - cy) * 0.12;
    hc.style.setProperty('--px', cx.toFixed(4));
    hc.style.setProperty('--py', cy.toFixed(4));
    hc.style.setProperty('--ry', (cx * 14).toFixed(2) + 'deg');
    hc.style.setProperty('--rx', (-cy * 11).toFixed(2) + 'deg');
    hc.style.setProperty('--lift', Math.min(1, Math.hypot(cx, cy) * 1.3).toFixed(3));
    raf = requestAnimationFrame(loop);
  }
  function point(e) {
    var r = hc.getBoundingClientRect();
    tx = JM.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    ty = JM.clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  }
  hc.addEventListener('pointermove', function (e) { point(e); });
  hc.addEventListener('pointerleave', function () { if (!held) { tx = 0; ty = 0; } });
  hc.addEventListener('pointerdown', function (e) { held = true; down = { x: e.clientX, y: e.clientY }; hc.setPointerCapture(e.pointerId); point(e); });
  hc.addEventListener('pointerup', function (e) {
    held = false;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 9) hc.classList.toggle('flip');
    down = null;
    if (e.pointerType !== 'mouse') { tx = 0; ty = 0; }
  });
  hc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hc.classList.toggle('flip'); } });
  function orient(e) {
    if (held || e.gamma == null) return;
    tx = JM.clamp(e.gamma / 28, -1, 1); ty = JM.clamp((e.beta - 45) / 30, -1, 1);
  }

  function open() {
    back = document.activeElement;
    holo.hidden = false;
    JM.stopScroll();
    requestAnimationFrame(function () { requestAnimationFrame(function () { holo.classList.add('on'); }); });
    t0 = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
    window.addEventListener('deviceorientation', orient);
    setTimeout(function () { hc.focus(); }, 350);
  }
  function close() {
    if (holo.hidden) return;
    holo.classList.remove('on');
    window.removeEventListener('deviceorientation', orient);
    setTimeout(function () {
      holo.hidden = true; hc.classList.remove('flip');
      cancelAnimationFrame(raf); raf = 0;
      JM.startScroll();
      if (back && back.focus) back.focus();
    }, 360);
  }
  openers.forEach(function (o) {
    if (!o) return;
    o.addEventListener('click', function (e) { e.stopPropagation(); open(); });
  });
  closeBtn.addEventListener('click', close);
  holo.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    JM.trapFocus(holo, e);
  });
  JM.card = { open: open, close: close, isOpen: function () { return !holo.hidden; } };
})();
