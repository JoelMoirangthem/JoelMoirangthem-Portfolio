"""Responsive regression tests. Each check maps to a root cause from the audit.
Run with the static server on :8765:  python tests/test_responsive.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:8765/")
VPS = [(320, 568), (360, 640), (375, 667), (390, 844), (430, 932), (600, 960), (639, 900), (641, 900),
       (667, 375), (844, 390), (915, 412), (768, 1024), (1024, 768), (1280, 720), (1366, 768), (1440, 900), (1920, 1080), (2560, 1440)]
ROOMS = ["full-stack", "ai-agents", "backend", "problem-solving", "achievements"]
fails = []


def check(ok, msg):
    if not ok:
        fails.append(msg)
        print("FAIL", msg)


def open_page(ctx, url):
    pg = ctx.new_page()
    pg.goto(url, wait_until="commit", timeout=60000)
    pg.wait_for_load_state("domcontentloaded", timeout=60000)
    return pg


def rects(pg, sels):
    return pg.evaluate("""(sels) => Object.fromEntries(sels.map(s => { const e = document.querySelector(s); if (!e) return [s, null];
        const r = e.getBoundingClientRect(); return [s, { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }]; }))""", sels)


def overlap(a, b, pad=0):
    return a and b and a["w"] and b["w"] and min(a["r"], b["r"]) - max(a["l"], b["l"]) > pad and min(a["b"], b["b"]) - max(a["t"], b["t"]) > pad


with sync_playwright() as p:
    br = p.chromium.launch()

    # 1. root cause 1+2: base size is continuous and bounded
    pg = br.new_page()
    pg.goto(BASE, wait_until="commit"); pg.wait_for_load_state("domcontentloaded")
    prev = None
    for w in range(300, 2621, 20):
        pg.set_viewport_size({"width": w, "height": 900})
        rem = pg.evaluate("parseFloat(getComputedStyle(document.documentElement).fontSize)")
        check(13 <= rem <= 22, f"rem {rem:.2f}px out of [13,22] at {w}px wide")
        if prev:
            check(max(rem, prev) / min(rem, prev) <= 1.12, f"rem jumps {prev:.2f}->{rem:.2f}px at {w}px wide")
        prev = rem
    for w, h in [(844, 390), (667, 375)]:
        pg.set_viewport_size({"width": w, "height": h})
        h1 = pg.evaluate("document.querySelector('.h1').getBoundingClientRect().height")
        check(h1 <= h * 0.55, f"{w}x{h}: headline takes {h1 / h:.0%} of the screen height")
    pg.close()

    for w, h in VPS:
        tag = f"{w}x{h}"
        ctx = br.new_context(viewport={"width": w, "height": h}, has_touch=w < 1024, is_mobile=w < 900 and h > w)
        pg = open_page(ctx, BASE)
        pg.wait_for_function("document.body.classList.contains('ready') && !document.getElementById('loader')", timeout=15000)
        pg.wait_for_timeout(2600)  # cord drop
        check(pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 1, f"{tag}: page scrolls sideways")
        r = rects(pg, [".ctas", ".hero__left", ".fig", ".eyebrow", ".menu-btn", ".clock", ".cord__hit", ".h1"])
        # hero: buttons on the first screen, text never on the photo
        check(r[".ctas"]["b"] <= h + 1, f"{tag}: hero buttons below the first screen (bottom {r['.ctas']['b']:.0f} > {h})")
        check(not overlap(r[".hero__left"], r[".fig"], 4) or w >= 1024 and r[".hero__left"]["r"] <= r[".fig"]["l"] + 40, f"{tag}: hero text overlaps the photo")
        check(r[".fig"]["h"] >= 150, f"{tag}: portrait too small ({r['.fig']['h']:.0f}px)")
        # cord: knob never on header buttons or hero text
        knob = r[".cord__hit"]
        for s in [".menu-btn", ".clock", ".eyebrow", ".h1"]:
            check(not overlap(knob, r[s], 6), f"{tag}: pull cord knob covers {s}")
        rope_x = knob["l"] + knob["w"] / 2
        for s in [".menu-btn", ".clock"]:
            if r[s] and r[s]["w"]:
                check(not (r[s]["l"] - 4 < rope_x < r[s]["r"] + 4), f"{tag}: pull cord rope runs through {s}")
        # doors
        pg.evaluate("window.scrollTo(0, document.querySelector('.doors__row').getBoundingClientRect().top + scrollY - innerHeight + document.querySelector('.doors__row').offsetHeight + 8)")
        pg.wait_for_timeout(700)
        d = pg.evaluate("""() => { const u = document.querySelector('.unit').getBoundingClientRect(); return { w: u.width, h: u.height, hdr: document.getElementById('hdr').offsetHeight }; }""")
        check(d["w"] >= 100, f"{tag}: doors only {d['w']:.0f}px wide")
        check(pg.evaluate("document.querySelector('.paint').classList.contains('in')"), f"{tag}: doors heading never revealed")
        ph = pg.evaluate("""() => { const p = document.querySelector('.paint'), rg = document.createRange(); rg.selectNodeContents(p);
            const ls = [...rg.getClientRects()].filter(q => q.width > 1); return { lines: new Set(ls.map(q => Math.round(q.top))).size, right: Math.max(...ls.map(q => q.right)) }; }""")
        check(ph["right"] <= w - 8, f"{tag}: doors heading runs off the screen (right {ph['right']:.0f})")
        if w < 640:
            check(ph["lines"] == 2, f"{tag}: doors heading should be 2 lines (Magic happens / behind the doors), got {ph['lines']}")
        check(d["h"] <= h - d["hdr"] + 2, f"{tag}: a door ({d['h']:.0f}px) is taller than the screen below the header")
        # story header fits
        pg.evaluate("window.scrollTo(0, document.querySelector('#about').getBoundingClientRect().top + scrollY + innerHeight * .8)")
        pg.wait_for_timeout(700)
        s = pg.evaluate("""() => { const c = document.querySelector('.story__clock'), kids = [...c.children].filter(e => e.offsetHeight && !e.matches('canvas'));
            const t = Math.min(...kids.map(e => e.getBoundingClientRect().top)), b = Math.max(...kids.map(e => e.getBoundingClientRect().bottom));
            return { content: b - t, top: t, bottom: b, bar: getComputedStyle(c).position === 'sticky' && c.offsetHeight < innerHeight * .9 ? c.offsetHeight : 0 }; }""")
        check(s["bottom"] <= h + 1 and s["top"] >= -1, f"{tag}: story year panel cut off ({s['top']:.0f}..{s['bottom']:.0f})")
        if s["bar"]:
            check(s["bar"] <= h * 0.42, f"{tag}: story header bar uses {s['bar'] / h:.0%} of the screen")
        # footer controls large enough to tap
        small = pg.evaluate("""() => [...document.querySelectorAll('.sf__btn,.sf__ghost,.sf__cols a,.sf__cols button,.sf__bot button')].filter(e => e.offsetHeight && e.getBoundingClientRect().height < 43.5).length""")
        check(small == 0, f"{tag}: {small} footer controls under 44px tall")
        # ability card back
        if tag == "1440x900":
            check(pg.inner_text(".hc__mono").strip() == "MJ", "ability card back should read MJ")
        pg.close()
        # rooms: card content never cut, controls tappable
        for slug in ROOMS:
            rp = open_page(ctx, f"{BASE}room.html?d={slug}")
            rp.wait_for_timeout(1200)
            check(rp.evaluate("document.documentElement.scrollWidth - innerWidth") <= 1, f"{tag} room {slug}: page scrolls sideways")
            cut = rp.evaluate("""() => [...document.querySelectorAll('.card')].map((c, i) => { const n = c.querySelector('.card__in'), info = c.querySelector('.card__info');
                const ib = info.getBoundingClientRect(), cb = c.getBoundingClientRect();
                return (n.scrollHeight > n.clientHeight + 4 || ib.bottom > cb.bottom + 2) ? i : -1; }).filter(i => i >= 0)""")
            check(not cut, f"{tag} room {slug}: content cut off in cards {cut}")
            tiny = rp.evaluate("""() => [...document.querySelectorAll('.rn nav button,.backd,.rn__menu,.live,.sf__cols a,.sf__cols button,.sf__bot button,.sf__btn')].filter(e => e.offsetHeight && e.getBoundingClientRect().height < 43.5).map(e => e.textContent.trim().slice(0, 20))""")
            check(not tiny, f"{tag} room {slug}: controls under 44px tall: {tiny[:4]}")
            rp.close()
        ctx.close()
        print(f"{tag} checked", flush=True)
    br.close()

print(f"\n{len(fails)} failure(s)")
sys.exit(1 if fails else 0)

