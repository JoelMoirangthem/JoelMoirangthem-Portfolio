"""Verify whether overlay controls are actually unreachable on short screens (vs. scrolled content)."""
from playwright.sync_api import sync_playwright

CHECK = """(layer) => {
  const L = document.querySelector(layer), vh = innerHeight;
  const ctrls = [...L.querySelectorAll('button,input,textarea,a[href]')].filter(e => e.getBoundingClientRect().height);
  const unreachable = ctrls.filter(e => {
    const r = e.getBoundingClientRect(); if (r.bottom <= vh + 1 && r.top >= -1) return false;
    for (let a = e.parentElement; a; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowY) && a.scrollHeight > a.clientHeight) return false; }
    return true; });
  return unreachable.map(e => (e.id || e.className || e.tagName) + '@' + Math.round(e.getBoundingClientRect().bottom));
}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(320, 568), (360, 640), (667, 375), (844, 390), (915, 412)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto("http://127.0.0.1:8765/", wait_until="commit"); pg.wait_for_load_state("domcontentloaded", timeout=60000)
        pg.wait_for_function("document.body.classList.contains('ready')", timeout=15000)
        out = {}
        for js, layer in [("document.getElementById('menuBtn').click()", "#navm"), ("JM.layers.openModal()", "#modal"), ("JM.card.open()", "#holo")]:
            if layer == "#navm" and w >= 1200:
                continue
            pg.evaluate(js); pg.wait_for_timeout(800)
            if layer == "#modal":  # go to the longest step
                pg.evaluate("document.querySelectorAll('.step').forEach((f,i)=>f.hidden=i!==3)")
            out[layer] = pg.evaluate(CHECK, layer)
            pg.keyboard.press("Escape"); pg.wait_for_timeout(500)
            pg.evaluate("JM.card.close()"); pg.wait_for_timeout(450)
        print(f"{w}x{h}", out)
        pg.close()
    b.close()

