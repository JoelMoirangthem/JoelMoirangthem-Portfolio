"""Compare the four doors with each other: box size, arch radius, and every computed style that differs.
Each door is brought to the centre (phones) before it is measured, so all are measured in the same state."""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")
OUT = os.path.join(os.path.dirname(__file__), "shots", "doors4")
os.makedirs(OUT, exist_ok=True)
PARTS = [".unit", ".doorway", ".casing", ".opening", ".room", ".door", ".door__flute", ".plate", ".handle", ".sill"]
PROPS = ["width", "height", "border-radius", "transform", "opacity", "filter", "box-shadow", "background-image", "font-size", "padding", "inset", "aspect-ratio", "max-width", "container-type"]

MEASURE = """([i, parts, props]) => {
  const u = document.querySelectorAll('.unit')[i], out = {};
  for (const p of parts) { const e = p === '.unit' ? u : u.querySelector(p); if (!e) continue; const s = getComputedStyle(e), r = e.getBoundingClientRect();
    out[p] = { box: [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] };
    for (const k of props) out[p][k] = s.getPropertyValue(k).replace(/rgba?\\([^)]*\\)/g, m => m.replace(/\\s/g, '')).slice(0, 90); }
  out.classes = u.className; return out; }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(390, 844), (360, 640), (844, 390), (1440, 900), (768, 1024)]:
        pg = b.new_page(viewport={"width": w, "height": h}, has_touch=w < 1024, is_mobile=w < 900 and h > w)
        pg.goto(BASE, wait_until="commit"); pg.wait_for_load_state("domcontentloaded")
        pg.wait_for_function("document.body.classList.contains('ready')", timeout=20000)
        pg.wait_for_timeout(1500)
        pinned = pg.evaluate("matchMedia('(max-width:639.98px),(max-height:540px) and (orientation:landscape)').matches")
        res = []
        for i in range(4):
            if pinned:
                pg.evaluate(f"(() => {{ const s = document.querySelector('#works'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY + (s.offsetHeight - innerHeight) * {i} / 3); }})()")
            else:
                pg.evaluate("window.scrollTo(0, document.querySelector('.doors__row').getBoundingClientRect().top + scrollY - 200)")
                pg.mouse.move(5, 5)
            pg.wait_for_timeout(1600)
            res.append(pg.evaluate(MEASURE, [i, PARTS, PROPS]))
            pg.screenshot(path=os.path.join(OUT, f"{w}x{h}-door{i + 1}.png"))
        print(f"=== {w}x{h} ({'pinned' if pinned else 'row'})")
        print("   doorway boxes:", [r[".doorway"]["box"] for r in res], " classes:", [r["classes"] for r in res])
        for part in PARTS:
            for k in ["box"] + PROPS:
                vals = [r.get(part, {}).get(k) for r in res]
                if k in ("background-image",) and part == ".door":
                    continue
                if len(set(map(str, vals))) > 1:
                    print(f"   DIFF {part:<13} {k:<16} " + " | ".join(str(v) for v in vals))
        pg.close()
    b.close()
