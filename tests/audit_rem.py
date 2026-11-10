"""Measure how the root font-size (rem) scales across viewports — evidence for the sizing root cause."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(320, 568), (360, 640), (430, 932), (600, 960), (639, 900), (641, 900), (768, 1024),
                 (844, 390), (1024, 768), (1366, 768), (1920, 1080), (2560, 1440)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto("http://localhost:8765/", wait_until="domcontentloaded")
        pg.wait_for_timeout(300)
        rem = pg.evaluate("getComputedStyle(document.documentElement).fontSize")
        h1 = pg.evaluate("getComputedStyle(document.querySelector('.h1')).fontSize")
        cal = pg.evaluate("Math.round(document.querySelector('.cal__body').getBoundingClientRect().height)")
        print(f"{w:>5}x{h:<5} 1rem={rem:<9} h1={h1:<9} calendarH={cal}px  ({cal / h * 100:.0f}% of height)")
        pg.close()
    b.close()
