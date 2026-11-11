"""Compare the phone doors wall (heading, info, dots, first door) with the reference, both at rest on door 1."""
import os
from playwright.sync_api import sync_playwright

OURS = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")
REF = "https://therishithakor.com/"
OUT = os.path.join(os.path.dirname(__file__), "shots", "paint")
os.makedirs(OUT, exist_ok=True)
PROBE = """() => { const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  return { paint: g('.paint'), title: g('.dinfo__h'), tag: g('.dinfo__t'), list: g('.dinfo__p'), dots: g('.doors__dots i'), door: g('.unit .doorway'), fs: getComputedStyle(document.querySelector('.dinfo__h')).fontSize }; }"""
diffs = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(320, 568), (360, 640), (390, 844), (430, 932), (600, 960)]:
        res = {}
        for name, base in [("ours", OURS), ("ref", REF)]:
            ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True)
            pg = ctx.new_page()
            pg.goto(base, wait_until="commit", timeout=90000)
            pg.wait_for_load_state("domcontentloaded", timeout=90000)
            pg.wait_for_timeout(4000)
            pg.evaluate("window.scrollTo(0, document.querySelector('#works').getBoundingClientRect().top + scrollY + 2)")
            pg.wait_for_timeout(3000)
            res[name] = pg.evaluate(PROBE)
            pg.screenshot(path=os.path.join(OUT, f"wall-{w}x{h}-{name}.png"))
            ctx.close()
        print(f"--- {w}x{h}")
        for k in res["ours"]:
            o, r = res["ours"][k], res["ref"][k]
            off = k != "fs" and o and r and max(abs(a - c) for a, c in zip(o, r)) > 3
            diffs += bool(off)
            print(f"  {'!!' if off else 'ok'} {k:<6} ours={o}  ref={r}")
    b.close()
print("elements off by >3px:", diffs)
