"""Reproduce UI glitches: layout shifts during scroll, work triggered by address-bar resizes,
canvas clears (blinks), scroll locks, and whether pull-to-refresh is allowed."""
import json
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")

INSTRUMENT = """
window.__shifts = []; window.__clears = 0; window.__hdr = [];
new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.value > 0.001) window.__shifts.push({ v: +e.value.toFixed(4), y: scrollY,
  src: (e.sources || []).map(s => s.node ? (s.node.className || s.node.tagName || '').toString().slice(0, 40) : '?') }); })).observe({ type: 'layout-shift', buffered: true });
const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
Object.defineProperty(HTMLCanvasElement.prototype, 'width', { set(v) { window.__clears++; (window.__clearBy = window.__clearBy || {})[this.id || this.className] = ((window.__clearBy || {})[this.id || this.className] || 0) + 1; d.set.call(this, v); }, get() { return d.get.call(this); } });
"""

STATE = """() => ({ overflow: document.documentElement.style.overflow, htmlOverscroll: getComputedStyle(document.documentElement).overscrollBehaviorY,
  bodyOverscroll: getComputedStyle(document.body).overscrollBehaviorY, hdrH: getComputedStyle(document.documentElement).getPropertyValue('--hdr-h'),
  scrollable: document.documentElement.scrollHeight > innerHeight })"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, mobile in [("phone 390x844", (390, 844), True), ("desktop 1440x900", (1440, 900), False)]:
        ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1)
        ctx.add_init_script(INSTRUMENT)
        pg = ctx.new_page()
        pg.goto(BASE, wait_until="commit"); pg.wait_for_load_state("domcontentloaded")
        pg.wait_for_function("document.body.classList.contains('ready') && !document.getElementById('loader')", timeout=20000)
        pg.wait_for_timeout(2500)
        print(f"\n===== {name}")
        print("after intro:", pg.evaluate(STATE))
        pg.evaluate("window.__shifts = []; window.__clears = 0; window.__clearBy = {}")
        # 1. scroll the whole page slowly, like a finger
        total = pg.evaluate("document.documentElement.scrollHeight")
        for y in range(0, total, 120):
            pg.mouse.wheel(0, 120); pg.wait_for_timeout(35)
        pg.wait_for_timeout(800)
        sh = pg.evaluate("window.__shifts")
        print(f"scroll pass: {len(sh)} layout shifts, total {sum(s['v'] for s in sh):.3f}; canvas clears {pg.evaluate('window.__clears')} {pg.evaluate('window.__clearBy')}")
        for s in sh[:12]:
            print("   shift", s)
        # 2. address bar hiding/showing = viewport height changes by ~60px (phones do this while scrolling)
        if mobile:
            pg.evaluate("window.scrollTo(0, document.querySelector('#works').getBoundingClientRect().top + scrollY + 300)"); pg.wait_for_timeout(800)
            pg.evaluate("window.__shifts = []; window.__clears = 0; window.__clearBy = {}")
            before = pg.evaluate("({ uw: document.querySelector('.doors__row').style.getPropertyValue('--uw'), y: scrollY })")
            for h in [784, 844, 784, 844]:
                pg.set_viewport_size({"width": vp[0], "height": h}); pg.wait_for_timeout(250)
            after = pg.evaluate("({ uw: document.querySelector('.doors__row').style.getPropertyValue('--uw'), y: scrollY })")
            sh = pg.evaluate("window.__shifts")
            print(f"address-bar toggles x4: {len(sh)} layout shifts, canvas clears {pg.evaluate('window.__clears')} {pg.evaluate('window.__clearBy')}; door width {before['uw']} -> {after['uw']}")
        # 3. scroll lock after opening/closing every layer
        for js in ["JM.card.open()", "JM.layers.openModal()", "document.getElementById('menuBtn').click()"]:
            if "menuBtn" in js and not mobile:
                continue
            pg.evaluate(js); pg.wait_for_timeout(700); pg.keyboard.press("Escape"); pg.wait_for_timeout(700)
        print("after open/close layers:", pg.evaluate(STATE))
        ctx.close()
    b.close()
