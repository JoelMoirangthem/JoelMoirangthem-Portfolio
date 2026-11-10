/* Flip calendar in the headline: each page carries one role and flips over on its spiral rings. */
(function () {
  'use strict';
  var JM = window.JM, C = window.JM_CONTENT;
  var cal = document.getElementById('cal');
  if (!cal) return;
  var words = C.skills, n = words.length, HOLD = 1700, FLIP = 1250;
  var cur = 0;

  cal.innerHTML =
    '<span class="cal__body">' +
      '<span class="cal__stand"></span>' +
      '<span class="cal__stack">' +
        '<span class="cal__page" id="calPage"><span class="cal__holes"></span><span class="cal__word"></span><span class="cal__no"></span><span class="cal__shade" id="calPageShade"></span></span>' +
        '<span class="cal__leaf" id="calLeaf">' +
          '<span class="cal__face" id="calFace"><span class="cal__holes"></span><span class="cal__word"></span><span class="cal__no"></span><span class="cal__shade" id="calFaceShade"></span></span>' +
          '<span class="cal__rear" id="calRear"></span>' +
        '</span>' +
      '</span>' +
      '<span class="cal__rings"></span>' +
    '</span>' +
    '<span class="cal__measure" aria-hidden="true"></span>';

  var body = cal.querySelector('.cal__body'), leaf = document.getElementById('calLeaf');
  var face = document.getElementById('calFace'), page = document.getElementById('calPage'), rear = document.getElementById('calRear');
  var faceShade = document.getElementById('calFaceShade'), pageShade = document.getElementById('calPageShade');
  var measure = cal.querySelector('.cal__measure');

  function no(i) { return String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); }
  function paint(el, i) {
    el.querySelector('.cal__word').textContent = words[i];
    el.querySelector('.cal__no').textContent = no(i);
  }

  function fit() {
    cal.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(cal).fontSize), max = 0;
    words.forEach(function (w) { measure.textContent = w; max = Math.max(max, measure.getBoundingClientRect().width); });
    var wEm = max / fs + 0.86;
    var h1 = cal.closest('.h1'), avail = h1 ? h1.getBoundingClientRect().width / fs - 0.25 : wEm;
    if (wEm > avail) cal.style.fontSize = (fs * avail / wEm) + 'px';
    cal.style.setProperty('--cal-w', wEm + 'em');
    var count = Math.max(5, Math.round((wEm - 0.64) / 0.7) + 1), dots = '';
    for (var i = 0; i < count; i++) dots += '<i></i>';
    cal.querySelectorAll('.cal__holes,.cal__rings').forEach(function (r) { r.innerHTML = dots; });
  }

  paint(face, 0); paint(page, 1 % n);
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 120); });

  function flip() {
    if (document.hidden) return setTimeout(flip, 600);
    var next = (cur + 1) % n;
    if (JM.reduced || !leaf.animate) {
      cur = next; paint(face, cur); paint(page, (cur + 1) % n);
      return setTimeout(flip, 2400);
    }
    var o = { duration: FLIP, easing: 'cubic-bezier(.5,.05,.2,1)', fill: 'forwards' };
    var anims = [
      leaf.animate([{ transform: 'translateZ(.004em) rotateX(0deg)' }, { transform: 'translateZ(.004em) rotateX(352deg)' }], o),
      face.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.285 }, { opacity: 0, offset: 0.295 }, { opacity: 0, offset: 1 }], o),
      rear.animate([{ filter: 'brightness(1)', offset: 0 }, { filter: 'brightness(1.02)', offset: 0.29 }, { filter: 'brightness(.96)', offset: 0.45 }, { filter: 'brightness(.9)', offset: 1 }], o),
      faceShade.animate([{ opacity: 0, offset: 0 }, { opacity: 0.45, offset: 0.2 }, { opacity: 0, offset: 0.275 }, { opacity: 0, offset: 1 }], o),
      pageShade.animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: FLIP * 0.9, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' })
    ];
    anims[0].onfinish = function () {
      cur = next;
      paint(face, cur);
      anims.forEach(function (a) { a.cancel(); });
      paint(page, (cur + 1) % n);
      setTimeout(flip, HOLD);
    };
  }
  JM.onIntro(function () { setTimeout(flip, 1300); });
  JM.calendarWidth = function () { return body.getBoundingClientRect().width; };
})();
