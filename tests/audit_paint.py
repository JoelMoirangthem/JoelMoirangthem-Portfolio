"""Compare the doors heading ('Magic happens behind the doors') on our site vs the reference.
Hosts CDP on 9336 so REA can capture the reference at the same viewport."""
import json, os, subprocess, sys
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), "shots", "paint")
os.makedirs(OUT, exist_ok=True)
OURS = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")
REF = "https://therishithakor.com/"
VPS = [(320, 568), (360, 640), (390, 844), (430, 932), (600, 960), (768, 1024), (844, 390), (1440, 900)]
NPX = "npx.cmd" if os.name == "nt" else "npx"

PROBE = """() => {
  const p = document.querySelector('.paint'), w = p.parentElement, s = getComputedStyle(p), r = p.getBoundingClientRect();
  const range = document.createRange(); range.selectNodeContents(p);
  const lines = [...range.getClientRects()].map(q => [Math.round(q.left), Math.round(q.right)]);
  const ink = range.getBoundingClientRect();
  return { cls: p.className, fontSize: s.fontSize, whiteSpace: s.whiteSpace, textAlign: s.textAlign, maxWidth: s.maxWidth, width: s.width,
    display: s.display, clip: s.clipPath, alignSelf: getComputedStyle(w).alignItems,
    box: [Math.round(r.left), Math.round(r.right)], ink: [Math.round(ink.left), Math.round(ink.right)], lines, vw: innerWidth,
    br: [...p.querySelectorAll('br')].map(b => getComputedStyle(b).display) };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=["--remote-debugging-port=9336"])
    rows = []
    for w, h in VPS:
        for name, base in [("ours", OURS), ("ref", REF)]:
            ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=w < 1024, is_mobile=w < 900 and h > w)
            pg = ctx.new_page()
            pg.goto(base, wait_until="commit", timeout=90000)
            pg.wait_for_load_state("domcontentloaded", timeout=90000)
            pg.wait_for_timeout(4000)
            pg.evaluate("window.scrollTo(0, document.querySelector('#works').getBoundingClientRect().top + scrollY)")
            pg.wait_for_timeout(2600)
            m = pg.evaluate(PROBE)
            pg.screenshot(path=os.path.join(OUT, f"{w}x{h}-{name}.png"))
            rows.append((f"{w}x{h}", name, m))
            print(f"{w}x{h} {name:<4} fs={m['fontSize']:<9} ws={m['whiteSpace']:<7} align={m['textAlign']:<6} box={m['box']} ink={m['ink']} lines={m['lines']} clip={m['clip']} cls={m['cls']} br={m['br']}", flush=True)
            if name == "ref" and (w, h) in [(390, 844), (768, 1024)]:
                tl = json.loads(subprocess.run(["curl", "-s", "http://127.0.0.1:9336/json/list"], capture_output=True, text=True).stdout)
                tid = [t for t in tl if t["type"] == "page" and "therishithakor" in t["url"]][-1]["id"]
                rea = subprocess.run([NPX, "-y", "rea-agents@latest", "capture-web-screenshot", "http://127.0.0.1:9336", tid,
                                      "--allowed-origins", "https://therishithakor.com", "--format", "json"], capture_output=True, text=True, timeout=240)
                open(os.path.join(OUT, f"rea-{w}x{h}.json"), "w", encoding="utf-8").write(rea.stdout)
                print("   REA evidence:", rea.stdout[:110].replace("\n", " "), flush=True)
            ctx.close()
    json.dump(rows, open(os.path.join(OUT, "paint.json"), "w"), indent=1)
    b.close()
