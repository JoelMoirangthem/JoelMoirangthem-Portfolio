"""Quick check: hero portrait renders in original colour."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8765/", wait_until="domcontentloaded")
    pg.wait_for_function("document.body.classList.contains('ready')", timeout=12000)
    pg.wait_for_timeout(1500)
    print("filter:", pg.eval_on_selector("#figBase", "e => getComputedStyle(e).filter"),
          "| canvas present:", pg.query_selector("#figCanvas") is not None, "| errors:", errs)
    pg.screenshot(path="tests/shots/hero-colour.png")
    b.close()
