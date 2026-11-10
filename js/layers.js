/* Global layers: click routing, menu overlay, contact questionnaire, back-to-top, footer lists. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var navm = document.getElementById('navm'), menuBtn = document.getElementById('menuBtn');
  var modal = document.getElementById('modal');
  var openLayer = null, returnFocus = null;

  /* ---------- footer lists ---------- */
  document.getElementById('footWork').innerHTML = C.doors.map(function (d, i) {
    return '<li><a href="#' + d.slug + '" data-door="' + i + '">' + JM.esc(d.title) + '</a></li>';
  }).join('');
  document.getElementById('footLinks').innerHTML = [
    ['GitHub', C.links.github], ['LinkedIn', C.links.linkedin], ['LeetCode', C.links.leetcode], ['GeeksforGeeks', C.links.gfg], ['Email', 'mailto:' + C.email]
  ].map(function (l) { return '<li><a href="' + l[1] + '"' + (l[0] === 'Email' ? '' : ' target="_blank" rel="noopener"') + '>' + l[0] + '</a></li>'; }).join('');

  /* ---------- generic layer open / close ---------- */
  function show(layer, focusEl) {
    if (openLayer) hide(openLayer, true);
    returnFocus = document.activeElement;
    openLayer = layer;
    layer.hidden = false;
    JM.stopScroll();
    requestAnimationFrame(function () { requestAnimationFrame(function () { layer.classList.add('open'); }); });
    setTimeout(function () { (focusEl || layer.querySelector('button')).focus(); }, 60);
  }
  function hide(layer, instant) {
    if (layer.hidden) return;
    layer.classList.remove('open');
    if (openLayer === layer) openLayer = null;
    JM.startScroll();
    var done = function () { layer.hidden = true; };
    if (instant) done(); else setTimeout(done, 460);
    if (!instant && returnFocus && returnFocus.focus) returnFocus.focus();
    if (layer === navm) menuBtn.setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('keydown', function (e) {
    if (!openLayer) return;
    if (e.key === 'Escape') { e.stopPropagation(); hide(openLayer); return; }
    JM.trapFocus(openLayer, e);
  }, true);

  /* ---------- menu ---------- */
  var items = [['Home', 'go:home']].concat(C.doors.slice(0, 4).map(function (d, i) { return [d.title, 'door:' + i]; }), [['My story', 'go:about'], ['Contact', 'contact']]);
  document.getElementById('navList').innerHTML = items.map(function (it, i) {
    return '<button style="--d:' + (i * 45 + 80) + 'ms" data-act="' + it[1] + '"><small>' + String(i + 1).padStart(2, '0') + '</small><span>' + JM.esc(it[0]) + '</span></button>';
  }).join('');
  menuBtn.addEventListener('click', function () { menuBtn.setAttribute('aria-expanded', 'true'); show(navm); });
  document.getElementById('navClose').addEventListener('click', function () { hide(navm); });
  navm.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    hide(navm);
    setTimeout(function () { run(act); }, 480);
  });

  function run(act) {
    if (act === 'contact') return openModal();
    if (act.indexOf('door:') === 0) return JM.openDoor(parseInt(act.slice(5), 10));
    if (act.indexOf('go:') === 0) return JM.scrollToId(act.slice(3));
  }

  /* ---------- click routing for data-go / data-door / data-contact ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var t = e.target.closest('[data-go],[data-door],[data-contact]');
    if (!t || navm.contains(t) && !t.hasAttribute('data-contact')) return;
    e.preventDefault();
    if (t.hasAttribute('data-contact')) { if (openLayer === navm) { hide(navm); setTimeout(openModal, 480); } else openModal(); return; }
    if (t.hasAttribute('data-door')) return JM.openDoor(+t.dataset.door);
    JM.scrollToId(t.dataset.go);
  });

  /* ---------- contact questionnaire (opens the visitor's email app) ---------- */
  var STEPS = [
    { name: 'need', q: 'What do you need?', opts: ['A full-stack web app', 'An AI agent or LLM feature', 'Backend or API work', 'An SDE role or internship', 'Something else'] },
    { name: 'when', q: 'When do you want to start?', opts: ['Within a month', 'In 1 to 3 months', "I'm flexible", 'Just exploring for now'] },
    { name: 'who', q: 'Who is this for?', opts: ['A company that is hiring', 'A startup', 'A business or client project', 'A personal or open-source project'] },
    { name: 'details', q: 'How can I reach you?' }
  ];
  var stepsEl = document.getElementById('steps'), form = document.getElementById('hireForm');
  var err = document.getElementById('formErr'), back = document.getElementById('stepBack'), nextTxt = document.getElementById('nextTxt');
  var progTxt = document.getElementById('progTxt'), progBar = document.getElementById('progBar'), nextBtn = document.getElementById('stepNext');
  stepsEl.innerHTML = STEPS.map(function (s, i) {
    var inner = s.opts
      ? '<div class="qcs">' + s.opts.map(function (o) { return '<label class="qc"><input type="radio" name="' + s.name + '" value="' + JM.esc(o) + '">' + JM.esc(o) + '</label>'; }).join('') + '</div>'
      : '<label class="fld">Your name<input name="fname" autocomplete="name" maxlength="80" required></label>' +
        '<label class="fld">Email<input name="femail" type="email" autocomplete="email" maxlength="120" required></label>' +
        '<label class="fld">A few words about it<textarea name="fmsg" maxlength="2000" required></textarea></label>';
    return '<fieldset class="step" data-step="' + i + '"' + (i ? ' hidden' : '') + '><legend>' + s.q + '</legend>' + inner + '</fieldset>';
  }).join('');
  var fsets = stepsEl.querySelectorAll('.step'), step = 0;

  function goStep(i) {
    step = i;
    fsets.forEach(function (f, k) { f.hidden = k !== i; });
    err.textContent = '';
    back.disabled = i === 0;
    nextTxt.textContent = i === STEPS.length - 1 ? 'Open email' : 'Next';
    progTxt.textContent = (i + 1) + ' of ' + STEPS.length;
    progBar.style.setProperty('--w', ((i + 1) / STEPS.length * 100) + '%');
    var first = fsets[i].querySelector('input:checked') || fsets[i].querySelector('input,textarea');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function value(name) { var el = form.elements[name]; return el ? (el.value || '').trim() : ''; }
  function validate() {
    var s = STEPS[step];
    if (s.opts) return value(s.name) ? '' : 'Pick one option to continue.';
    if (value('fname').length < 2) return 'Please add your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value('femail'))) return 'Please add a valid email address.';
    if (value('fmsg').length < 10) return 'Tell me a little more (at least 10 characters).';
    return '';
  }
  stepsEl.addEventListener('change', function (e) {
    if (e.target.type === 'radio') setTimeout(function () { if (step < STEPS.length - 1) goStep(step + 1); }, 220);
  });
  back.addEventListener('click', function () { if (step > 0) goStep(step - 1); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var problem = validate();
    if (problem) { err.textContent = problem; return; }
    if (step < STEPS.length - 1) return goStep(step + 1);
    var subject = 'Portfolio enquiry: ' + value('need');
    var body = 'Hi Joel,\n\n' + value('fmsg') + '\n\n' +
      'Need: ' + value('need') + '\nStart: ' + value('when') + '\nFor: ' + value('who') + '\n\n' + value('fname') + '\n' + value('femail');
    var href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = href;
    fsets.forEach(function (f) { f.hidden = true; });
    form.querySelector('.prog').hidden = true;
    nextBtn.hidden = true; back.hidden = true;
    var done = document.createElement('p');
    done.className = 'done';
    done.innerHTML = 'Thanks, ' + JM.esc(value('fname')) + '. Your email app should open with the message ready to send. If it didn’t, write to <a href="' + href + '">' + JM.esc(C.email) + '</a>.';
    stepsEl.appendChild(done);
  });
  function resetForm() {
    form.reset();
    var d = stepsEl.querySelector('.done'); if (d) d.remove();
    form.querySelector('.prog').hidden = false; nextBtn.hidden = false; back.hidden = false;
    goStep(0);
  }
  function openModal() { resetForm(); show(modal, fsets[0].querySelector('input')); }
  document.getElementById('modalClose').addEventListener('click', function () { hide(modal); });
  modal.addEventListener('click', function (e) { if (e.target === modal) hide(modal); });

  /* ---------- back to top ---------- */
  var totop = document.getElementById('totop'), ring = totop.querySelector('.fg'), circ = 2 * Math.PI * 24, bot = document.querySelector('.sf__bot');
  ring.style.strokeDasharray = circ;
  totop.addEventListener('click', function () { JM.scrollToY(0); });
  function lum(rgb) {
    var m = rgb.match(/\d+(\.\d+)?/g); if (!m) return 1;
    return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
  }
  function bgUnder(el) {
    while (el && el !== document.documentElement) {
      var c = getComputedStyle(el).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\([^)]*,\s*0\)/.test(c)) return c;
      el = el.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  }
  var tt = false;
  function onScroll() {
    tt = false;
    var max = document.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? window.scrollY / max : 0;
    ring.style.strokeDashoffset = circ * (1 - p);
    var br = bot.getBoundingClientRect();
    totop.classList.toggle('show', window.scrollY > window.innerHeight * 0.9 && br.top > window.innerHeight);
    var r = totop.getBoundingClientRect();
    totop.style.visibility = 'hidden';
    var under = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    totop.style.visibility = '';
    totop.dataset.on = lum(bgUnder(under)) < 0.45 ? 'dark' : 'light';
  }
  window.addEventListener('scroll', function () { if (!tt) { tt = true; requestAnimationFrame(onScroll); } }, { passive: true });
  JM.on('mode:change', function () { setTimeout(onScroll, 60); });
  onScroll();

  JM.layers = { openModal: openModal, anyOpen: function () { return !!openLayer || (JM.card && JM.card.isOpen()); } };

  if (location.hash === '#contact') JM.onIntro(function () { setTimeout(openModal, 400); });
})();
