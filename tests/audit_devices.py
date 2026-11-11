"""Reproduce the phone doors behaviour on real device profiles, scrolling through the section step by step.
Records, for each scroll step: which door is centred, the door's box, the row transform, and a screenshot."""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "https://joelmoirangthem.github.io/JoelMoirangthem-Portfolio/")
OUT = os.path.join(os.path.dirname(__file__), "shots", "devices")
os.makedirs(OUT, exist_ok=True)
DEVICES = ["iPhone SE", "iPhone 13", "iPhone 15 Pro Max", "Pixel 7", "Galaxy S9+", "Galaxy S5", "iPad Mini"]
ENGINES = sys.argv[1:] or ["chromium", "webkit"]

PROBE = """() => {
  const sec = document.querySelector('#works'), row = document.querySelector('.doors__row'), pin = document.querySelector('.doors__pin');
  const units = [...document.querySelectorAll('.unit')].filter(u => getComputedStyle(u).display !== 'none');
  const vw = innerWidth, vh = innerHeight;
  const doors = units.map((u, i) => { const r = u.querySelector('.doorway').getBoundingClientRect();
    return { i, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), vis: r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh }; });
  const centred = doors.filter(d => d.l < vw / 2 && d.r > vw / 2).map(d => d.i);
  const sr = sec.getBoundingClientRect(), pr = pin.getBoundingClientRect();
  return { vw, vh, secTop: Math.round(sr.top), secH: Math.round(sr.height), pinTop: Math.round(pr.top), pinH: Math.round(pr.height),
    pinPos: getComputedStyle(pin).position, transform: row.style.transform, uw: row.style.getPropertyValue('--uw'),
    title: document.querySelector('.dinfo__h').textContent, dot: [...document.querySelectorAll('.doors__dots i')].findIndex(d => d.classList.contains('on')),
    centred, doors, scrollX: document.documentElement.scrollWidth - vw };
}"""

report = {}
with sync_playwright() as p:
    for eng in ENGINES:
        bt = getattr(p, eng).launch()
        for dev in DEVICES:
            d = dict(p.devices[dev])
            if eng == "webkit" or "iPhone" in dev or "iPad" in dev:
                d.pop("default_browser_type", None)
            d.pop("default_browser_type", None)
            if eng == "firefox":
                d.pop("is_mobile", None)
            ctx = bt.new_context(**d)
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE, wait_until="commit", timeout=90000)
            pg.wait_for_load_state("domcontentloaded", timeout=90000)
            pg.wait_for_function("document.body.classList.contains('ready')", timeout=20000)
            pg.wait_for_timeout(1500)
            top = pg.evaluate("document.querySelector('#works').getBoundingClientRect().top + scrollY")
            span = pg.evaluate("document.querySelector('#works').offsetHeight - innerHeight")
            steps = []
            for k, frac in enumerate([0, 0.17, 0.33, 0.5, 0.67, 0.83, 1.0]):
                # scroll with the mouse wheel / touch-like increments rather than jumping, so scroll handlers fire
                target = top + frac * span
                pg.evaluate(f"window.scrollTo(0, {target})")
                pg.wait_for_timeout(1400)
                m = pg.evaluate(PROBE)
                m["frac"] = frac
                steps.append(m)
                pg.screenshot(path=os.path.join(OUT, f"{eng}-{dev.replace(' ', '_')}-{k}.png"))
            key = f"{eng} | {dev} ({d['viewport']['width']}x{d['viewport']['height']})"
            report[key] = {"steps": steps, "errors": errs}
            print(key, "errors:", errs[:2])
            for s in steps:
                ds = [f"{x['i']}:{x['l']}..{x['r']}x{x['t']}..{x['b']}" for x in s["doors"] if x["vis"]]
                print(f"   p={s['frac']:.2f} pin={s['pinPos']}@{s['pinTop']} title={s['title'][:18]:<18} dot={s['dot']} centred={s['centred']} uw={s['uw']} visible={ds} scrollX={s['scrollX']}")
            ctx.close()
        bt.close()
json.dump(report, open(os.path.join(OUT, "devices.json"), "w"), indent=1)
