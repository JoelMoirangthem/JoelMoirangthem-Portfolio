/* Room page: one door's work as stacked sticky cards. Talks to the hall (index.html) via postMessage when embedded. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT, html = document.documentElement;
  var params = new URLSearchParams(location.search);
  var embed = html.classList.contains('embed') && window.parent !== window;
  var idx = JM.doorSlugFromHash(params.get('d') || '');
  if (idx < 0) idx = 0;
  var d = C.doors[idx], GH = C.links.github + '/';
  var rn = document.getElementById('rn'), stack = document.getElementById('stack');

  document.title = d.title + ' — Moirangthem Joel Singh';
  document.getElementById('rmTitle').textContent = d.title;
  document.getElementById('rmIntro').textContent = d.intro;

  /* ---------- navigation ---------- */
  var NAV = [['Home', 'home']].concat(C.doors.slice(0, 4).map(function (x, i) { return [x.title, 'door:' + i]; }), [['My story', 'about'], ['Contact', 'contact']]);
  function navBtn(n, i) { return '<button data-nav="' + n[1] + '"' + (n[1] === 'door:' + idx ? ' aria-current="page"' : '') + ' style="--i:' + i + '">' + JM.esc(n[0]) + '</button>'; }
  document.getElementById('rnNav').innerHTML = NAV.map(function (n, i) { return '<li>' + navBtn(n, i) + '</li>'; }).join('');
  document.getElementById('rnList').innerHTML = NAV.map(navBtn).join('');
  document.getElementById('sfWork').innerHTML = C.doors.map(function (x, i) { return '<li><button data-nav="door:' + i + '">' + JM.esc(x.title) + '</button></li>'; }).join('');
  document.getElementById('sfLinks').innerHTML = [['GitHub', C.links.github], ['LinkedIn', C.links.linkedin], ['LeetCode', C.links.leetcode], ['GeeksforGeeks', C.links.gfg]]
    .map(function (l) { return '<li><a href="' + l[1] + '" target="_blank" rel="noopener">' + l[0] + '</a></li>'; }).join('') + '<li><a href="mailto:' + C.email + '">Email</a></li>';

  function send(msg) { if (embed) window.parent.postMessage(msg, '*'); }
  function go(to) {
    closeMenu();
    if (to === 'top') return window.scrollTo({ top: 0, behavior: JM.reduced ? 'auto' : 'smooth' });
    if (to === 'door:' + idx) return window.scrollTo({ top: 0, behavior: 'smooth' });
    if (embed) return send({ wall: 'go', to: to });
    if (to.indexOf('door:') === 0) {
      var n = +to.slice(5);
      location.href = n === idx ? '#' : 'room.html?d=' + C.doors[n].slug;
    } else location.href = 'index.html' + (to === 'home' ? '' : '#' + to);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]');
    if (b) { e.preventDefault(); go(b.dataset.nav); }
  });
  var backd = document.getElementById('backd');
  requestAnimationFrame(function () { backd.classList.add('show'); });
  backd.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey) return;
    if (embed) { e.preventDefault(); send({ wall: 'close' }); }
  });

  /* menu panel */
  var menuBtn = document.getElementById('rnMenu'), panel = document.getElementById('rnPanel');
  function openMenu() { rn.classList.add('open'); html.classList.add('rn-lock'); menuBtn.setAttribute('aria-expanded', 'true'); setTimeout(function () { document.getElementById('rnClose').focus(); }, 60); }
  function closeMenu() { if (!rn.classList.contains('open')) return; rn.classList.remove('open'); html.classList.remove('rn-lock'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
  menuBtn.addEventListener('click', openMenu);
  document.getElementById('rnClose').addEventListener('click', closeMenu);
  panel.addEventListener('keydown', function (e) { JM.trapFocus(panel, e); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (rn.classList.contains('open')) closeMenu(); else send({ wall: 'close' });
  });
  window.matchMedia('(min-width:1200px)').addEventListener('change', function (m) { if (m.matches) closeMenu(); });

  /* clock */
  function tick() {
    var t = JM.now(), small = window.innerWidth < 768;
    document.querySelectorAll('[data-ftime]').forEach(function (n) { n.textContent = JM.fmtTime(t); });
    document.querySelectorAll('[data-fdate]').forEach(function (n) { n.textContent = small ? JM.fmtDate(t).replace(/(\d+ \w{3})\w*, \d+/, '$1') : JM.fmtDate(t); });
    document.querySelectorAll('[data-fyear]').forEach(function (n) { n.textContent = t.getFullYear(); });
  }
  tick(); setInterval(tick, 20000);
  new ResizeObserver(function () { html.style.setProperty('--nav-h', rn.offsetHeight + 'px'); }).observe(rn);

  /* ---------- stats (problem-solving room) ---------- */
  if (d.stats) {
    var s = d.stats, el = document.getElementById('rmStats');
    el.hidden = false;
    el.innerHTML = '<div class="stat"><b>' + s.solved + '</b><span>LeetCode problems solved</span><span class="stat__bar">' +
      '<i style="width:' + (s.easy / s.solved * 100) + '%;background:#7FB069"></i><i style="width:' + (s.medium / s.solved * 100) + '%;background:#D6B26E"></i><i style="width:' + (s.hard / s.solved * 100) + '%;background:#B3412F"></i></span></div>' +
      '<div class="stat"><b>' + s.easy + '</b><span>Easy</span></div><div class="stat"><b>' + s.medium + '</b><span>Medium</span></div><div class="stat"><b>' + s.hard + '</b><span>Hard</span></div>';
  }

  /* ---------- cards ---------- */
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var SBAR = '<div class="sbar"><span>9:41</span><span>' +
    '<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.6a9 9 0 0 1 6.3 2.6l1.2-1.3A10.8 10.8 0 0 0 8 .8 10.8 10.8 0 0 0 .5 3.9l1.2 1.3A9 9 0 0 1 8 2.6Zm0 3.6a5.4 5.4 0 0 1 3.8 1.6L13 6.5A7.2 7.2 0 0 0 8 4.4a7.2 7.2 0 0 0-5 2.1l1.2 1.3A5.4 5.4 0 0 1 8 6.2Zm0 3.6c.5 0 1 .2 1.3.5L8 11.7l-1.3-1.4c.3-.3.8-.5 1.3-.5Z"/></svg>' +
    '<svg viewBox="0 0 27 12" fill="none"><rect x=".5" y=".5" width="23" height="11" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="8" rx="2" fill="currentColor"/><path d="M25 4v4c.8-.3 1.3-1.1 1.3-2S25.8 4.3 25 4Z" fill="currentColor" opacity=".4"/></svg>' +
    '</span></div>';
  function stageHtml(p) {
    if (p.badge) return '<div class="medal"><b>' + JM.esc(p.badge) + '</b><span>' + JM.esc(p.sub) + '</span></div>';
    var img = '<img class="page" src="assets/shots/' + p.shot + '.webp" alt="" loading="lazy" decoding="async">';
    if (p.device === 'phone') {
      return '<div class="phone"><div class="phone__body"><i class="phone__btn l" style="top:19%;height:4%"></i><i class="phone__btn l" style="top:26%;height:7.5%"></i><i class="phone__btn l" style="top:35%;height:7.5%"></i><i class="phone__btn r" style="top:28%;height:11%"></i>' +
        '<div class="phone__screen scr">' + img + SBAR + '<div class="island"></div></div></div></div>';
    }
    return '<div class="mon"><div class="mon__body"><div class="mon__screen scr">' + img + '</div></div><div class="mon__neck"></div><div class="mon__foot"></div></div>';
  }
  stack.innerHTML = d.projects.map(function (p, i) {
    var acts = '';
    if (p.live) acts += '<a class="live" href="' + p.live + '" target="_blank" rel="noopener noreferrer">Visit live site ' + ICON + '</a>';
    if (p.repo) acts += '<a class="live' + (p.live ? ' live--ghost' : '') + '" href="' + GH + encodeURIComponent(p.repo) + '" target="_blank" rel="noopener noreferrer">View source ' + ICON + '</a>';
    if (!acts) acts = '<span class="note">' + JM.esc(p.stack.join(' · ')) + '</span>';
    return '<article class="card' + (i % 2 ? ' flip' : '') + (p.device === 'phone' ? ' card--phone' : '') + '" style="--i:' + i + '" aria-labelledby="p' + i + '">' +
      '<div class="card__in"><div class="card__info">' +
        '<p class="card__meta"><span>' + JM.esc(p.meta || d.plate) + '</span></p>' +
        '<h2 id="p' + i + '">' + JM.esc(p.name) + '</h2>' +
        '<p class="sub">' + JM.esc(p.sub || '') + '</p>' +
        '<p class="desc">' + JM.esc(p.text) + '</p>' +
        '<ul class="tags">' + p.stack.map(function (t) { return '<li>' + JM.esc(t) + '</li>'; }).join('') + '</ul>' +
        '<div class="acts">' + acts + '</div>' +
      '</div><div class="stage" aria-hidden="true">' + stageHtml(p) + '</div></div><div class="card__dim"></div></article>';
  }).join('');
  var cards = Array.prototype.slice.call(stack.querySelectorAll('.card'));

  /* skeleton until each screenshot loads */
  stack.querySelectorAll('img.page').forEach(function (img) {
    var scr = img.parentNode;
    if (img.complete && img.naturalWidth) return;
    scr.classList.add('skel');
    img.addEventListener('load', function () { scr.classList.remove('skel'); fitCards(); measure(); }, { once: true });
    img.addEventListener('error', function () { scr.classList.remove('skel'); }, { once: true });
  });

  /* reveal + "on" state */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('seen'); e.target.classList.toggle('on', e.isIntersecting); });
  }, { threshold: 0.25 });
  cards.forEach(function (c) { io.observe(c); });

  /* stacking: the covered card shrinks to 94% and dims to .28 */
  var ticking = false;
  /* Sticky stacking only works for a card that fits below the header; taller cards scroll normally. */
  function fitCards() {
    var navH = rn.offsetHeight;
    cards.forEach(function (c, i) {
      c.classList.remove('card--free');
      var stickTop = navH + (window.innerWidth < 900 ? 10 + i * 10 : 16 + i * 14);
      c.classList.toggle('card--free', c.offsetHeight > window.innerHeight - stickTop - 8);
    });
  }
  function stackFx() {
    ticking = false;
    cards.forEach(function (c, i) {
      var next = cards[i + 1], p = 0;
      if (next && !c.classList.contains('card--free')) {
        var top = parseFloat(getComputedStyle(c).top), h = c.offsetHeight;
        p = JM.clamp((top + h - next.getBoundingClientRect().top) / h, 0, 1);
      }
      c.style.transform = p ? 'scale(' + (1 - p * 0.06).toFixed(4) + ')' : '';
      c.lastElementChild.style.opacity = (p * 0.28).toFixed(3);
      c.dataset.covered = p > 0.98 ? '1' : '';
    });
    rn.classList.toggle('stuck', window.scrollY > 10);
    totopFx();
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(stackFx); } }, { passive: true });
  window.addEventListener('resize', function () { fitCards(); measure(); stackFx(); });

  /* auto-scrolling screenshots inside each screen */
  var SPEED = 230, REST = 1100, live = !embed, pans = [];
  function measure() {
    pans = Array.prototype.map.call(stack.querySelectorAll('img.page'), function (img, k) {
      var old = pans[k] || { pos: 0, dir: 1, wait: REST };
      return { img: img, card: img.closest('.card'), scr: img.parentNode, dist: Math.max(0, img.offsetHeight + img.offsetTop - img.parentNode.clientHeight), pos: old.pos, dir: old.dir, wait: old.wait };
    });
  }
  var last = 0;
  function pan(now) {
    var dt = Math.min(64, now - (last || now)); last = now;
    if (live && !JM.reduced) pans.forEach(function (s) {
      var r = s.scr.getBoundingClientRect(), hidden = !s.card.classList.contains('on') || s.card.dataset.covered || r.bottom < 0 || r.top > window.innerHeight;
      if (hidden) { if (!s.hidden && s.pos) { s.pos = 0; s.dir = 1; s.wait = REST; s.img.style.transform = ''; } s.hidden = true; return; }
      s.hidden = false;
      if (!s.dist) return;
      if (s.wait > 0) { s.wait -= dt; return; }
      var left = s.dir > 0 ? s.dist - s.pos : s.pos;
      var ease = Math.min(1, 0.3 + left / 160) * Math.min(1, 0.35 + (s.dist - left) / 160);
      s.pos += s.dir * SPEED * ease * dt / 1000;
      if (s.pos >= s.dist) { s.pos = s.dist; s.dir = -1; s.wait = REST; }
      else if (s.pos <= 0) { s.pos = 0; s.dir = 1; s.wait = REST; }
      s.img.style.transform = 'translate3d(0,' + (-s.pos).toFixed(1) + 'px,0)';
    });
    requestAnimationFrame(pan);
  }

  /* back to top ring and colour */
  var totop = document.querySelector('.totop'), bot = document.querySelector('.sf__bot');
  function lum(c) { var m = c.match(/[\d.]+/g); return m ? (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 : 1; }
  function totopFx() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    totop.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    totop.classList.toggle('show', window.scrollY > window.innerHeight * 0.9 && bot.getBoundingClientRect().top >= window.innerHeight - 8);
    var r = totop.getBoundingClientRect();
    totop.style.pointerEvents = 'none';
    var el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    totop.style.pointerEvents = '';
    while (el && el !== html) { var bg = getComputedStyle(el).backgroundColor; if (bg && !/rgba\([^)]*,\s*0(\.0+)?\)|transparent/.test(bg)) break; el = el.parentElement; }
    totop.dataset.on = el && el !== html && lum(getComputedStyle(el).backgroundColor) < 0.45 ? 'dark' : 'light';
  }

  /* ---------- talking to the hall ---------- */
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent || !e.data || typeof e.data !== 'object') return;
    var m = e.data;
    if (m.wall === 'mode') { if (m.mode === 'dark') html.dataset.mode = 'dark'; else delete html.dataset.mode; }
    else if (m.wall === 'enter') {
      window.scrollTo(0, 0); html.classList.remove('out'); html.classList.add('in'); live = true;
      cards.forEach(function (c) { c.classList.remove('seen'); }); requestAnimationFrame(function () { cards.forEach(function (c) { if (c.classList.contains('on')) c.classList.add('seen'); }); });
      setTimeout(function () { backd.focus({ preventScroll: true }); }, 300);
    } else if (m.wall === 'exit') { html.classList.add('out'); html.classList.remove('in'); live = false; }
    else if (m.wall === 'reset') { window.scrollTo(0, 0); pans.forEach(function (s) { s.pos = 0; s.dir = 1; s.wait = REST; s.img.style.transform = ''; }); }
  });

  fitCards(); measure(); stackFx(); requestAnimationFrame(pan);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitCards(); measure(); stackFx(); });
})();
