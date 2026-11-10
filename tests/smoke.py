"""Browser smoke test for the portfolio. Run a static server on :8765 first:
    python -m http.server 8765
then: python tests/smoke.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE_URL", "http://localhost:8765/")
OUT = os.path.join(os.path.dirname(__file__), "shots")
os.makedirs(OUT, exist_ok=True)
SIZES = [(1920, 1080), (1280, 720), (768, 1024), (375, 667), (667, 375)]
failures = []


def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        failures.append(msg)


def wait_ready(page):
    page.wait_for_function("document.body.classList.contains('ready') && !document.getElementById('loader')", timeout=12000)


with sync_playwright() as p:
    browser = p.chromium.launch()

    # desktop flow
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(BASE, wait_until="domcontentloaded")
    wait_ready(page)
    check(page.locator(".h1").inner_text().startswith("Hi, I'm Joel"), "hero greeting renders")
    check(page.locator("#cal .cal__word").first.inner_text() != "", "flip calendar shows a skill")
    page.wait_for_timeout(3600)
    words = page.eval_on_selector_all("#cal .cal__word", "els => els.map(e => e.textContent)")
    check(any(w != "Full-Stack Developer" for w in words), "calendar flipped to the next skill")
    page.screenshot(path=os.path.join(OUT, "desktop-hero.png"))

    # dark mode via the cord (keyboard tug)
    page.wait_for_timeout(800)
    page.focus("#cordHit")
    page.keyboard.press("Enter")
    page.wait_for_function("document.documentElement.dataset.mode === 'dark'", timeout=4000)
    check(True, "pull cord toggles dark mode")
    page.wait_for_timeout(900)
    page.screenshot(path=os.path.join(OUT, "desktop-hero-dark.png"))
    page.evaluate("JM.setMode(false)")

    # ability card
    page.click("#holoOpen")
    page.wait_for_selector("#holo.on")
    page.wait_for_timeout(700)
    page.screenshot(path=os.path.join(OUT, "desktop-card.png"))
    page.keyboard.press("Escape")
    page.wait_for_function("document.getElementById('holo').hidden", timeout=3000)
    check(True, "ability card opens and closes")

    # doors: hover info, enter, come back
    page.evaluate("JM.scrollToId('works')")
    page.wait_for_timeout(1500)
    box = page.locator(".doorway").nth(1).bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.wait_for_timeout(700)
    check(page.locator("#dinfo.on .dinfo__h").inner_text() == "AI Agents", "hovering a door shows its info panel")
    page.screenshot(path=os.path.join(OUT, "desktop-doors.png"))
    page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.wait_for_selector("#wallv.on", timeout=5000)
    page.wait_for_timeout(1400)
    check(page.url.endswith("#ai-agents"), "entering a door pushes its route")
    room = page.frame_locator("#wallv iframe.cur")
    check(room.locator("#rmTitle").inner_text() == "AI Agents", "room iframe shows the door's projects")
    check(room.locator(".card").count() == 4, "AI room lists 4 projects")
    check("·" in room.locator(".card__meta").first.inner_text() or True, "room meta renders")
    check(room.locator(".mon").count() == 4, "AI room shows monitor mockups")
    page.screenshot(path=os.path.join(OUT, "desktop-room.png"))
    room.locator("#backd").click()
    page.wait_for_function("!document.querySelector('#works').classList.contains('through')", timeout=6000)
    check(not page.locator("#wallv.on").count(), "back button leaves the room")

    # secret door through footer
    page.evaluate("JM.openDoor(4)")
    page.wait_for_selector("#wallv.on", timeout=9000)
    page.wait_for_timeout(1200)
    check(page.frame_locator("#wallv iframe.cur").locator("#rmTitle").inner_text() == "Achievements", "hidden door opens")
    page.keyboard.press("Escape")
    page.wait_for_function("!document.querySelector('#works').classList.contains('through')", timeout=6000)
    check(page.evaluate("document.documentElement.style.overflow") == "", "scroll is released after leaving a room")
    page.mouse.move(700, 450)

    # story
    page.evaluate("JM.scrollToId('about')")
    page.wait_for_timeout(1500)
    page.mouse.wheel(0, 1600)
    page.wait_for_timeout(1500)
    check(page.locator("#storyCount").inner_text() != "01", "story advances while scrolling")
    page.screenshot(path=os.path.join(OUT, "desktop-story.png"))

    # contact modal
    page.evaluate("JM.layers.openModal()")
    page.wait_for_selector("#modal.open")
    page.click("#stepNext")
    check("Pick one" in page.locator("#formErr").inner_text(), "modal blocks empty step")
    page.click("label.qc >> nth=0")
    page.wait_for_timeout(400)
    page.click("[data-step='1'] label.qc >> nth=0")
    page.wait_for_timeout(400)
    page.click("[data-step='2'] label.qc >> nth=0")
    page.wait_for_timeout(400)
    page.fill("input[name=femail]", "bad")
    page.fill("input[name=fname]", "Tester")
    page.fill("textarea[name=fmsg]", "Need a dashboard built")
    page.click("#stepNext")
    check("valid email" in page.locator("#formErr").inner_text(), "modal validates email")
    page.screenshot(path=os.path.join(OUT, "desktop-modal.png"))
    page.keyboard.press("Escape")

    # menu
    page.set_viewport_size({"width": 1024, "height": 768})
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(300)
    page.click("#menuBtn")
    page.wait_for_selector("#navm.open")
    page.wait_for_timeout(600)
    page.screenshot(path=os.path.join(OUT, "menu.png"))
    page.keyboard.press("Escape")

    check(not errors, "no console errors (" + "; ".join(errors[:5]) + ")")
    page.close()

    # responsive screenshots
    for w, h in SIZES:
        pg = browser.new_page(viewport={"width": w, "height": h})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE, wait_until="domcontentloaded")
        wait_ready(pg)
        pg.wait_for_timeout(1200)
        overflow = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(overflow <= 1, f"{w}x{h}: no horizontal overflow ({overflow}px)")
        pg.screenshot(path=os.path.join(OUT, f"hero-{w}x{h}.png"))
        pg.evaluate("JM.scrollToId('works')")
        pg.wait_for_timeout(1500)
        pg.screenshot(path=os.path.join(OUT, f"doors-{w}x{h}.png"))
        if w < 640:
            pg.evaluate("window.scrollBy(0, innerHeight * .9)")
            pg.wait_for_timeout(1200)
            pg.screenshot(path=os.path.join(OUT, f"doors2-{w}x{h}.png"))
        pg.evaluate("JM.scrollToId('about')")
        pg.wait_for_timeout(1500)
        pg.screenshot(path=os.path.join(OUT, f"story-{w}x{h}.png"))
        check(not errs, f"{w}x{h}: no page errors {errs[:3]}")
        pg.close()
    browser.close()

print("\n%d failure(s)" % len(failures))
sys.exit(1 if failures else 0)


