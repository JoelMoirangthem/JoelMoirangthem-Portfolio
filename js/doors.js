/* The doors: hover to crack one open, click to walk through it into a room of work. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var sec = document.getElementById('works'), row = document.getElementById('doorsRow');
  var info = document.getElementById('dinfo'), cursor = document.getElementById('doorCursor'), wallv = document.getElementById('wallv');
  var paintEl = sec.querySelector('.paint'), dots = sec.querySelectorAll('.doors__dots i');
  var hdr = document.getElementById('hdr');
  /* keep identical to the compact media query in css/doors.css */
  var DOORS_COMPACT = '(max-width:639.98px),(max-height:540px) and (orientation:landscape)';
  var D = C.doors, ANG = 70, mobileMq = window.matchMedia(DOORS_COMPACT);
  var landMq = window.matchMedia('(max-height:540px) and (orientation:landscape)');

  row.innerHTML = D.map(function (d, i) {
    var secret = i === 4;
    return '<li class="unit pre' + (secret ? ' unit--secret' : '') + '" style="--i:' + i + ';--door:' + d.color + ';--door-dk:' + d.dark + ';--rgb:' + d.rgb + '"' + (secret ? ' inert' : '') + '>' +
      '<button class="doorway" data-i="' + i + '" aria-label="Open the ' + JM.esc(d.title) + ' door">' +
        '<span class="casing"></span>' +
        '<span class="opening"><span class="room"><span class="room__glow"></span></span>' +
          '<span class="door"><span class="door__flute"></span><span class="plate">' + JM.esc(d.plate) + '</span>' +
            '<span class="handle"><span class="handle__lever"></span><span class="handle__lock"></span></span><span class="door__shade"></span></span>' +
          '<span class="sill"></span></span>' +
      '</button></li>';
  }).join('');
  var units = row.querySelectorAll('.unit');
  var doorEls = row.querySelectorAll('.door');

  /* ---------- per-door springs ---------- */
  var springs = Array.prototype.map.call(doorEls, function (el) { return { el: el, x: 0, v: 0, target: 0, raf: 0 }; });
  function setDoor(i, target) {
    var s = springs[i];
    s.target = target;
    if (JM.reduced) { s.x = target; paintDoor(s); return; }
    if (!s.raf) s.raf = requestAnimationFrame(function step() {
      var dt = 1 / 60;
      s.v += (120 * (s.target - s.x) - 14 * s.v) * dt;
      s.x += s.v * dt;
      paintDoor(s);
      if (Math.abs(s.target - s.x) < 0.001 && Math.abs(s.v) < 0.001) { s.x = s.target; paintDoor(s); s.raf = 0; return; }
      s.raf = requestAnimationFrame(step);
    });
  }
  function paintDoor(s) {
    s.el.style.transform = 'rotateY(' + (Math.max(0, s.x) * ANG).toFixed(2) + 'deg)';
    s.el.style.setProperty('--o', Math.max(0, s.x).toFixed(3));
  }

  /* ---------- entrance reveal ----------
     Observe the wall, not the heading: the heading starts fully clipped (clip-path inset 100%),
     which IntersectionObserver reports as 0 visible area, so it would never reveal. */
  var wallEl = paintEl.parentNode;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target === wallEl) { paintEl.classList.add('in'); paintEl.classList.remove('pre'); }
      else units.forEach(function (u) { u.classList.remove('pre'); });
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  io.observe(wallEl); io.observe(row);

  /* ---------- room iframes ---------- */
  var frames = [];
  function frame(i) {
    if (frames[i]) return frames[i];
    var f = document.createElement('iframe');
    f.title = D[i].title;
    f.src = 'room.html?d=' + encodeURIComponent(D[i].slug) + '&embed';
    f.loading = 'eager';
    f.dataset.loaded = '';
    f.addEventListener('load', function () {
      f.dataset.loaded = '1';
      post(f, { wall: 'mode', mode: JM.isDark() ? 'dark' : 'light' });
      if (f.classList.contains('cur') && wallv.classList.contains('on')) post(f, { wall: 'enter' });
    });
    wallv.appendChild(f);
    frames[i] = f;
    return f;
  }
  function post(f, msg) { try { f.contentWindow.postMessage(msg, '*'); } catch (e) { /* frame not ready */ } }
  JM.on('mode:change', function (e) { frames.forEach(function (f) { if (f) post(f, { wall: 'mode', mode: e.detail.dark ? 'dark' : 'light' }); }); });
  var preIo = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    preIo.disconnect();
    setTimeout(function () { D.forEach(function (_, i) { frame(i); }); }, 600);
  }, { rootMargin: '200px' });
  preIo.observe(sec);

  /* ---------- desktop hover and info panel ---------- */
  var active = -1, busy = false, inRoom = -1, placeTok = 0, ptr = null, lifted = false;
  function fillInfo(i) {
    var d = D[i];
    info.querySelector('.dinfo__h').textContent = d.title;
    info.querySelector('.dinfo__t').textContent = d.tagline;
    info.querySelector('.dinfo__p').innerHTML = d.points.map(function (p, j) { return '<li style="--j:' + j + '">' + JM.esc(p) + '</li>'; }).join('');
  }
  function visibleUnits() { return Array.prototype.filter.call(units, function (u) { return !u.classList.contains('unit--secret') || sec.classList.contains('reveal'); }); }
  function placeInfo(i) {
    var vis = visibleUnits(), u = units[i], vi = vis.indexOf(u);
    if (vi < 0) return;
    var pair = vi < 2 ? [vis[vi + 1], vis[vi + 2]] : [vis[vi - 2], vis[vi - 1]];
    if (!pair[0] || !pair[1]) return;
    var wall = info.offsetParent.getBoundingClientRect(), a = pair[0].getBoundingClientRect(), b = pair[1].getBoundingClientRect(), r = u.getBoundingClientRect();
    var span = b.right - a.left, w = Math.min(span, 22 * parseFloat(getComputedStyle(document.documentElement).fontSize));
    info.style.width = w + 'px';
    info.style.left = (a.left - wall.left + (span - w) / 2) + 'px';
    info.style.top = (r.top - wall.top + r.height / 2 - info.offsetHeight / 2) + 'px';
  }
  function showInfo(i) {
    var tok = ++placeTok, was = info.classList.contains('on');
    info.classList.remove('on');
    setTimeout(function () {
      if (tok !== placeTok) return;
      fillInfo(i); placeInfo(i);
      info.classList.add('on');
    }, was ? 130 : 0);
  }
  function setActive(i) {
    if (i === active) return;
    if (active >= 0) { units[active].classList.remove('on'); if (!busy) setDoor(active, 0); }
    active = i;
    if (i < 0) { sec.classList.remove('focus'); placeTok++; info.classList.remove('on'); return; }
    units[i].classList.add('on');
    sec.classList.add('focus');
    if (!busy) setDoor(i, 0.1);
    frame(i);
    showInfo(i);
  }
  function hoverCheck() {
    if (mobileMq.matches || !ptr || busy || inRoom >= 0) return;
    var el = document.elementFromPoint(ptr.x, ptr.y), dw = el && el.closest ? el.closest('.doorway') : null;
    var i = dw ? +dw.dataset.i : -1;
    setActive(i);
    cursor.classList.toggle('on', i >= 0 && JM.fine);
  }
  if (JM.fine) {
    window.addEventListener('pointermove', function (e) {
      ptr = { x: e.clientX, y: e.clientY };
      cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0) translate(-50%,-50%)';
      hoverCheck();
    }, { passive: true });
    window.addEventListener('scroll', hoverCheck, { passive: true });
    sec.addEventListener('pointerenter', function () { if (!lifted) { lifted = true; sec.classList.add('lift'); } });
  }
  row.addEventListener('focusin', function (e) {
    var dw = e.target.closest('.doorway');
    if (dw && !mobileMq.matches && !busy) setActive(+dw.dataset.i);
  });
  row.addEventListener('focusout', function () { if (!ptr && !busy) setActive(-1); });

  /* ---------- walking through ---------- */
  var zoom = null, queued = null;
  row.addEventListener('click', function (e) {
    var dw = e.target.closest('.doorway');
    if (dw) enter(+dw.dataset.i);
  });
  function enter(i) {
    if (busy || inRoom >= 0) return;
    busy = true;
    cursor.classList.remove('on');
    placeTok++; info.classList.remove('on');
    springs.forEach(function (_, j) { if (j !== i) setDoor(j, 0); });
    if (!mobileMq.matches) { if (active !== i) { if (active >= 0) units[active].classList.remove('on'); active = i; units[i].classList.add('on'); } sec.classList.add('focus'); }
    frame(i);
    units[i].classList.add('press');
    setTimeout(function () { units[i].classList.remove('press'); }, 380);
    setTimeout(function () { setDoor(i, 1); }, 170);
    setTimeout(function () { through(i); }, JM.reduced ? 200 : 760);
  }
  function holdScroll(on) {
    if (on) { JM.stopScroll(); hdr.classList.add('away'); if (JM.cord) JM.cord.away(true); }
    else { JM.startScroll(); hdr.classList.remove('away'); if (JM.cord) JM.cord.away(false); }
  }
  function through(i) {
    var op = units[i].querySelector('.opening').getBoundingClientRect(), dr = doorEls[i].getBoundingClientRect();
    var gapL = JM.clamp(dr.right, op.left, op.right - 6), gw = Math.max(op.right - gapL, 10), gh = op.height;
    var cx = (gapL + op.right) / 2, cy = op.top + gh * 0.5;
    var sr = sec.getBoundingClientRect();
    var sEnd = Math.max(window.innerWidth / gw, window.innerHeight / gh) * 1.15;
    var tx = window.innerWidth / 2 - cx, ty = window.innerHeight / 2 - cy;
    holdScroll(true);
    sec.style.transformOrigin = (cx - sr.left) + 'px ' + (cy - sr.top) + 'px';
    sec.classList.add('through');
    zoom = { i: i, s: sEnd, tx: tx, ty: ty };
    if (JM.reduced) return handoff(i);
    var t0 = performance.now(), handed = false;
    (function step(now) {
      var p = Math.min(1, (now - t0) / 1500), e = JM.easeInOutCubic(p);
      var sc = Math.exp(Math.log(sEnd) * e), f = Math.min(1, e * 1.6);
      sec.style.transform = 'translate(' + (tx * f) + 'px,' + (ty * f) + 'px) scale(' + sc + ')';
      if (!handed && sc >= sEnd / 1.15) { handed = true; handoff(i); }
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function handoff(i) {
    var f = frame(i);
    frames.forEach(function (x) { if (x) x.classList.toggle('cur', x === f); });
    wallv.classList.add('on');
    inRoom = i;
    busy = false;
    history.pushState({ wall: 1 }, '', '#' + D[i].slug);
    document.title = D[i].title + ' — Joel';
    post(f, { wall: 'enter' });
    setTimeout(function () { try { f.focus(); } catch (e) { /* cross-origin focus blocked */ } }, 400);
  }
  function leaveWall(fromPop) {
    if (inRoom < 0) return;
    var i = inRoom, f = frames[i];
    inRoom = -1; busy = true;
    post(f, { wall: 'exit' });
    if (!fromPop && location.hash === '#' + D[i].slug) history.replaceState(null, '', location.pathname + location.search + '#works');
    document.title = 'Moirangthem Joel Singh — Full-Stack & AI Developer';
    setTimeout(function () {
      wallv.classList.remove('on');
      setTimeout(function () { zoomBack(i); }, JM.reduced ? 0 : 360);
    }, JM.reduced ? 0 : 520);
  }
  function zoomBack(i) {
    var z = zoom || { s: 1, tx: 0, ty: 0 };
    function done() {
      sec.classList.remove('through');
      sec.style.transform = ''; sec.style.transformOrigin = '';
      setDoor(i, 0);
      units[i].classList.remove('on'); sec.classList.remove('focus'); active = -1;
      holdScroll(false);
      frames.forEach(function (x) { if (x) { x.classList.remove('cur'); post(x, { wall: 'reset' }); } });
      busy = false; zoom = null;
      if (i === 4) setTimeout(function () { reveal(false); }, mobileMq.matches ? 580 : 500);
      var q = queued; queued = null;
      if (q) q();
    }
    if (JM.reduced) return done();
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / 1300), e = JM.easeOutCubic(p);
      var sc = Math.exp(Math.log(z.s) * (1 - e)), f = Math.min(1, (1 - e) * 1.6);
      sec.style.transform = 'translate(' + (z.tx * f) + 'px,' + (z.ty * f) + 'px) scale(' + sc + ')';
      if (p < 1) requestAnimationFrame(step); else done();
    })(t0);
  }

  window.addEventListener('message', function (e) {
    var src = frames.filter(function (f) { return f && f.contentWindow === e.source; })[0];
    if (!src || !e.data || typeof e.data !== 'object') return;
    var m = e.data;
    if (m.wall === 'close') leaveWall(false);
    else if (m.wall === 'go' && typeof m.to === 'string') {
      var to = m.to;
      if (to === 'contact') { if (JM.layers) JM.layers.openModal(); return; }
      queued = function () {
        if (to.indexOf('door:') === 0) JM.openDoor(parseInt(to.slice(5), 10));
        else if (to === 'about' || to === 'home') JM.scrollToId(to);
      };
      leaveWall(false);
    }
  });
  window.addEventListener('popstate', function () { if (inRoom >= 0) leaveWall(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && inRoom >= 0 && !(JM.layers && JM.layers.anyOpen())) leaveWall(false);
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && inRoom < 0) { wallv.classList.remove('on'); sec.classList.remove('through'); sec.style.transform = ''; busy = false; }
  });

  /* ---------- the hidden fifth door ---------- */
  function reveal(on) {
    sec.classList.toggle('reveal', on);
    units[4].inert = !on;
    if (!mobileMq.matches) {
      var a = units[0].getBoundingClientRect(), b = units[1].getBoundingClientRect();
      row.style.transform = on ? 'translateX(' + -(b.left - a.left) + 'px)' : '';
    } else mobileLayout();
  }

  /* ---------- phones: pinned wall, doors glide sideways ---------- */
  var mCur = 0, mTarget = 0, mRaf = 0, mLast = 0, snapT = 0, finger = false, swipeLock = 0, mIdx = -1;
  function mobileLayout(again) {
    if (!mobileMq.matches) { row.style.removeProperty('--uw'); row.style.transform = sec.classList.contains('reveal') ? row.style.transform : ''; return; }
    var pin = sec.querySelector('.doors__pin'), track = row.parentNode, uw;
    if (landMq.matches) {
      var availH = pin.clientHeight - parseFloat(getComputedStyle(pin).paddingTop) - 48;
      uw = Math.max(90, Math.min(track.clientWidth * 0.62, availH / 2.25));
    } else {
      /* same rule as the reference: the door is as tall as the space from its top edge to the bottom of the screen */
      var doorTop = row.getBoundingClientRect().top - pin.getBoundingClientRect().top + parseFloat(getComputedStyle(row).paddingTop);
      uw = Math.max(110, Math.min(window.innerWidth * 0.6, (pin.clientHeight - doorTop - 2) / 2.25));
    }
    row.style.setProperty('--uw', uw + 'px');
    /* Like the reference: decide with the checklist shown; if the door would be under 150px, hide the
       checklist and size the door again for the space that frees up (and keep it hidden). */
    if (!again) {
      if (sec.classList.contains('compact')) { sec.classList.remove('compact'); return mobileLayout(); }
      if (uw < 150) { sec.classList.add('compact'); return mobileLayout(true); }
    }
  }
  function mProgress() {
    var r = sec.getBoundingClientRect();
    return JM.clamp(-r.top / (r.height - window.innerHeight), 0, 1);
  }
  function mobY(k) { return sec.getBoundingClientRect().top + window.scrollY + k / 3 * (sec.offsetHeight - window.innerHeight); }
  function mFrame(now) {
    mRaf = 0;
    if (!mobileMq.matches) return;
    var dt = Math.min(64, now - (mLast || now)); mLast = now;
    if (inRoom < 0 && !busy) {
      if (sec.classList.contains('reveal')) mTarget = 4;
      else {
        var f = mProgress() * 3, i = Math.floor(f), u = JM.clamp((f - i - 0.2) / 0.6, 0, 1);
        mTarget = Math.min(3, i + u * u * (3 - 2 * u));
      }
    }
    mCur += (mTarget - mCur) * Math.min(1, dt / 1000 * 10);
    if (Math.abs(mTarget - mCur) > 1) mCur = mTarget - Math.sign(mTarget - mCur);
    var step = units[1].offsetLeft - units[0].offsetLeft;
    row.style.transform = 'translate3d(' + (-mCur * step) + 'px,0,0)';
    var idx = Math.round(mCur);
    if (idx !== mIdx) {
      mIdx = idx; fillInfo(idx);
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
      units.forEach(function (u, k) { u.classList.toggle('on', k === idx); });
    }
    if (Math.abs(mTarget - mCur) > 0.001) mRaf = requestAnimationFrame(mFrame);
  }
  function mKick() { if (!mRaf && mobileMq.matches) { mLast = performance.now(); mRaf = requestAnimationFrame(mFrame); } }
  window.addEventListener('scroll', function () {
    if (!mobileMq.matches) return;
    mKick();
    clearTimeout(snapT);
    snapT = setTimeout(function () {
      if (finger || busy || inRoom >= 0 || performance.now() < swipeLock) return;
      var r = sec.getBoundingClientRect();
      if (r.top <= 0 && r.bottom >= window.innerHeight) JM.scrollToY(mobY(Math.round(mProgress() * 3)));
    }, 220);
  }, { passive: true });
  var sx = 0, sy = 0, sIdx = 0;
  sec.addEventListener('touchstart', function (e) { finger = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; sIdx = Math.round(mProgress() * 3); }, { passive: true });
  sec.addEventListener('touchend', function (e) {
    finger = false;
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
      swipeLock = performance.now() + 700;
      JM.scrollToY(mobY(JM.clamp(sIdx + (dx < 0 ? 1 : -1), 0, 3)));
    }
  }, { passive: true });
  mobileMq.addEventListener('change', function () { mobileLayout(); mIdx = -1; mKick(); if (!mobileMq.matches) row.style.transform = ''; });
  landMq.addEventListener('change', function () { mobileLayout(); mIdx = -1; mKick(); });
  window.addEventListener('resize', function () { mobileLayout(); mKick(); if (active >= 0 && !busy) placeInfo(active); });
  mobileLayout(); mKick();
  if (mobileMq.matches) fillInfo(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mobileLayout(); mKick(); });

  /* ---------- public: open a door from the nav, menu or footer ---------- */
  JM.openDoor = function (i) {
    if (i < 0 || i >= D.length || busy || inRoom >= 0) return;
    frame(i);
    var y = mobileMq.matches ? mobY(Math.min(i, 3)) : sec.getBoundingClientRect().top + window.scrollY - Math.max(0, (window.innerHeight - sec.offsetHeight) / 2);
    JM.scrollToY(y, function () {
      var t0 = performance.now(), f = frames[i];
      (function wait() {
        if (f.dataset.loaded || performance.now() - t0 > 4000) {
          if (i === 4) { reveal(true); setTimeout(function () { enter(i); }, 850); }
          else enter(i);
          return;
        }
        setTimeout(wait, 80);
      })();
    });
  };
  JM.doors = { inRoom: function () { return inRoom >= 0; }, leave: function () { leaveWall(false); } };

  var deep = JM.doorSlugFromHash(location.hash.slice(1));
  if (deep >= 0) {
    history.replaceState(null, '', location.pathname + location.search + '#works');
    JM.onIntro(function () { setTimeout(function () { JM.openDoor(deep); }, 650); });
  }
})();
