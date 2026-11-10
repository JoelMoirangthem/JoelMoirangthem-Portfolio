"""Responsive audit: every page/section x many viewports. Measures, does not fix.
Run with the static server on :8765:  python tests/audit_responsive.py
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")
OUT = os.path.join(os.path.dirname(__file__), "shots", "audit")
os.makedirs(OUT, exist_ok=True)
VIEWPORTS = [
    (320, 568), (360, 640), (375, 667), (390, 844), (414, 896), (430, 932),
    (667, 375), (844, 390), (915, 412),
    (600, 960), (768, 1024), (820, 1180), (1024, 768), (1024, 1366),
    (1280, 720), (1366, 768), (1440, 900), (1920, 1080), (2560, 1440),
]
ROOMS = ["full-stack", "ai-agents", "backend", "problem-solving", "achievements"]

PROBE = r"""
(scope) => {
  const vw = innerWidth, vh = innerHeight, out = [];
  const root = scope ? document.querySelector(scope) : document.body;
  if (!root) return out;
  const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05; };
  const clippedByAncestor = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(hidden|clip)/.test(s.overflowX) || s.position === 'fixed') return true; } return false; };
  for (const el of root.querySelectorAll('*')) {
    if (!visible(el) || el.closest('svg,canvas,.loader,[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // 1. sticks out of the viewport sideways (and nothing clips it)
    if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el)) out.push({ kind: 'overflow-x', el: name(el), left: Math.round(r.left), right: Math.round(r.right), vw });
    // 2. text that does not fit its box
    const s = getComputedStyle(el);
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) out.push({ kind: 'text-clip-x', el: name(el), need: el.scrollWidth, have: el.clientWidth, ws: s.whiteSpace });
    // 3. boxes whose content is cut vertically (overflow hidden + taller content)
    if (/(hidden|clip)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 40 && !el.matches('.mon__screen,.phone__screen,.scr,.dg,.line,.hc__win,.opening,.room,.fig__frame,.door,.doors,.hero,.cal,.cal__body,.navm__list,.modal__panel'))
      out.push({ kind: 'clip-y', el: name(el), need: el.scrollHeight, have: el.clientHeight });
    // 4. tap targets
    if (el.matches('a[href],button') && (r.width < 40 || r.height < 40) && r.width > 0 && !el.closest('.cal'))
      out.push({ kind: 'small-target', el: name(el), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
}
"""

OVERLAP = r"""
(pairs) => pairs.map(([a, b]) => {
  const A = document.querySelector(a), B = document.querySelector(b);
  if (!A || !B) return null;
  const r = A.getBoundingClientRect(), q = B.getBoundingClientRect();
  if (!r.width || !q.width) return null;
  const x = Math.max(0, Math.min(r.right, q.right) - Math.max(r.left, q.left));
  const y = Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top));
  return x * y > 64 ? { kind: 'overlap', a, b, px: Math.round(x * y) } : null;
}).filter(Boolean)
"""


def ready(pg):
    pg.wait_for_function("document.body.classList.contains('ready') && !document.getElementById('loader')", timeout=15000)


def go_section(pg, sel, extra=0):
    pg.evaluate(f"(() => {{ const e = document.querySelector('{sel}'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + {extra}); }})()")
    pg.wait_for_timeout(900)


def main():
    report = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for (w, h) in VIEWPORTS:
            key = f"{w}x{h}"
            ctx = b.new_context(viewport={"width": w, "height": h}, has_touch=w < 1024, is_mobile=w < 900 and h > w)
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE, wait_until="domcontentloaded")
            ready(pg)
            pg.wait_for_timeout(1300)
            issues = []
            page_x = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            if page_x > 1:
                issues.append({"kind": "page-scroll-x", "px": page_x})
            # hero
            hero = pg.evaluate("""() => { const h = document.querySelector('.hero'), c = document.querySelector('.hero__left'), f = document.querySelector('.fig');
              const hr = h.getBoundingClientRect(), cr = c.getBoundingClientRect(), fr = f.getBoundingClientRect();
              return { heroH: Math.round(hr.height), vh: innerHeight, contentBottom: Math.round(cr.bottom), figTop: Math.round(fr.top), figH: Math.round(fr.height), figW: Math.round(fr.width), calW: Math.round(document.querySelector('.cal__body').getBoundingClientRect().width), h1W: Math.round(document.querySelector('.h1').getBoundingClientRect().width) }; }""")
            if hero["contentBottom"] > hero["figTop"] + 4 and w < 1024:
                issues.append({"kind": "hero-text-over-photo", **hero})
            if hero["calW"] > hero["h1W"] + 2:
                issues.append({"kind": "calendar-wider-than-headline", **hero})
            if hero["figH"] < 120:
                issues.append({"kind": "portrait-too-small", **hero})
            issues += [dict(i, section="hero") for i in pg.evaluate(PROBE, ".hero")]
            issues += pg.evaluate(OVERLAP, [[".hero__left", ".fig"], [".ctas", ".fig"], [".hero__links", ".fig"], [".hdr__in", ".cord__hit"]])
            pg.screenshot(path=os.path.join(OUT, f"{key}-1hero.png"))
            # doors
            go_section(pg, "#works")
            doors = pg.evaluate("""() => { const r = document.querySelector('.doors__row').getBoundingClientRect(), u = document.querySelector('.unit').getBoundingClientRect(),
              p = document.querySelector('.paint').getBoundingClientRect(), i = document.querySelector('#dinfo').getBoundingClientRect();
              return { rowBottom: Math.round(r.bottom), unitW: Math.round(u.width), unitH: Math.round(u.height), unitTop: Math.round(u.top), paintBottom: Math.round(p.bottom), infoBottom: Math.round(i.bottom), vh: innerHeight }; }""")
            if doors["unitH"] > h * 0.98 and w >= 640:
                issues.append({"kind": "doors-taller-than-screen", **doors})
            if doors["unitW"] < 90:
                issues.append({"kind": "doors-too-narrow", **doors})
            if w < 640 and doors["infoBottom"] > doors["unitTop"] + 4:
                issues.append({"kind": "door-info-over-door", **doors})
            issues += [dict(i, section="doors") for i in pg.evaluate(PROBE, "#works")]
            pg.screenshot(path=os.path.join(OUT, f"{key}-2doors.png"))
            # story
            go_section(pg, "#about", int(h * 0.6))
            issues += [dict(i, section="story") for i in pg.evaluate(PROBE, "#about")]
            story = pg.evaluate("""() => { const c = document.querySelector('.story__clock').getBoundingClientRect(), ch = document.querySelector('.ch.on') || document.querySelector('.ch');
              const yr = document.querySelector('.story__yr').getBoundingClientRect(); return { clockH: Math.round(c.height), clockW: Math.round(c.width), yrRight: Math.round(yr.right), vw: innerWidth, vh: innerHeight }; }""")
            if w < 768 and story["clockH"] > h * 0.45:
                issues.append({"kind": "story-header-eats-screen", **story})
            pg.screenshot(path=os.path.join(OUT, f"{key}-3story.png"))
            # footer
            pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            pg.wait_for_timeout(700)
            issues += [dict(i, section="footer") for i in pg.evaluate(PROBE, ".sf")]
            pg.screenshot(path=os.path.join(OUT, f"{key}-4footer.png"))
            # overlays: menu, modal, card
            for opener, layer, tag in [("document.getElementById('menuBtn').click()", "#navm", "menu"),
                                       ("JM.layers.openModal()", "#modal", "modal"),
                                       ("JM.card.open()", "#holo", "card")]:
                pg.evaluate("window.scrollTo(0,0)")
                if tag == "menu" and w >= 1200:
                    continue
                pg.evaluate(opener)
                pg.wait_for_timeout(900)
                dim = pg.evaluate(f"""() => {{ const l = document.querySelector('{layer}'); const kids = [...l.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height);
                    const bottom = Math.max(...kids.map(e => e.getBoundingClientRect().bottom)), top = Math.min(...kids.map(e => e.getBoundingClientRect().top));
                    return {{ top: Math.round(top), bottom: Math.round(bottom), vh: innerHeight, scroll: l.scrollHeight > l.clientHeight }}; }}""")
                if dim["bottom"] > h + 2 or dim["top"] < -2:
                    issues.append({"kind": f"{tag}-cut-off", **dim})
                issues += [dict(i, section=tag) for i in pg.evaluate(PROBE, layer)]
                pg.screenshot(path=os.path.join(OUT, f"{key}-5{tag}.png"))
                pg.keyboard.press("Escape")
                pg.wait_for_timeout(500)
                if tag == "card":
                    pg.evaluate("JM.card.close()")
                    pg.wait_for_timeout(500)
            report[key] = {"index": issues, "errors": errs}
            pg.close()
            # rooms
            for slug in ROOMS:
                rp = ctx.new_page()
                rerr = []
                rp.on("pageerror", lambda e: rerr.append(str(e)))
                rp.goto(f"{BASE}room.html?d={slug}", wait_until="domcontentloaded")
                rp.wait_for_timeout(1400)
                ri = []
                rx = rp.evaluate("document.documentElement.scrollWidth - innerWidth")
                if rx > 1:
                    ri.append({"kind": "page-scroll-x", "px": rx})
                ri += rp.evaluate(PROBE, "body")
                card = rp.evaluate("""() => { const c = document.querySelector('.card'), i = c.querySelector('.card__in'), info = c.querySelector('.card__info'), st = c.querySelector('.stage');
                  const cr = c.getBoundingClientRect(), nav = document.querySelector('.rn').offsetHeight;
                  return { cardH: Math.round(cr.height), inScroll: i.scrollHeight, inClient: i.clientHeight, available: innerHeight - nav - 16, stageH: Math.round(st.getBoundingClientRect().height), infoH: Math.round(info.getBoundingClientRect().height), h1: document.querySelector('.intro h1').scrollWidth, h1box: document.querySelector('.intro h1').clientWidth, vh: innerHeight }; }""")
                if card["inScroll"] > card["inClient"] + 4:
                    ri.append({"kind": "card-content-cut", **card})
                if card["cardH"] > card["available"] + 4:
                    ri.append({"kind": "card-taller-than-screen", **card})
                if card["h1"] > card["h1box"] + 2:
                    ri.append({"kind": "room-title-overflows", **card})
                rp.evaluate("window.scrollTo(0, document.querySelector('.card').getBoundingClientRect().top + scrollY - 80)")
                rp.wait_for_timeout(900)
                rp.screenshot(path=os.path.join(OUT, f"{key}-room-{slug}.png"))
                report[key]["room:" + slug] = ri
                report[key]["room-errors:" + slug] = rerr
                rp.close()
            ctx.close()
            n = sum(len(v) for k, v in report[key].items() if not k.startswith(("errors", "room-errors")))
            print(f"{key:>10}: {n} findings", flush=True)
        b.close()
    with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)
    print("report:", os.path.join(OUT, "report.json"))


if __name__ == "__main__":
    sys.exit(main())

