"""Capture real screenshots used inside the room mockups (assets/shots/)."""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "shots")
os.makedirs(OUT, exist_ok=True)
GH = "https://github.com/JoelMoirangthem/"
DESKTOP = {
    "healtine": "https://healtine.com",
    "library-management": GH + "Library-Management", "manipurtourism": GH + "ManipurTourism",
    "weather-analysing": GH + "Weather-analysing", "to-do-list": GH + "To-Do-List",
    "smarteducation": GH + "smartEducation", "ai-interview": GH + "ai-interview",
    "whatsapp-agent": GH + "-whatsapp-agent", "ai_account": GH + "ai_account",
    "spotify-backend": GH + "SPOTIFY-BACKEND", "guesthouse": GH + "GuestHouse",
    "razorpay": GH + "razorpay-finance-controller", "mini-interpreter": GH + "mini-Enterpreter",
    "myers-diff": GH + "myers-diff-algorithm", "java-dsa": GH + "Java-DSA",
}
MOBILE = {"leetcode": "https://leetcode.com/u/JoelMoirangthem/",
          "gfg": "https://www.geeksforgeeks.org/profile/joelofficial123",
          "github-m": "https://github.com/JoelMoirangthem"}

with sync_playwright() as p:
    b = p.chromium.launch()
    d = b.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=1, color_scheme="light")
    for name, url in DESKTOP.items():
        pg = d.new_page()
        try:
            pg.goto(url, wait_until="domcontentloaded", timeout=45000)
            pg.wait_for_timeout(4000)
            pg.add_style_tag(content="[class*=cookie],[id*=cookie],.js-header-wrapper,header.HeaderMktg{display:none!important}")
            h = min(pg.evaluate("document.documentElement.scrollHeight"), 4200)
            pg.screenshot(path=os.path.join(OUT, name + ".webp" if False else name + ".png"), clip={"x": 0, "y": 0, "width": 1280, "height": h}, full_page=True)
            print("ok", name, h, flush=True)
        except Exception as e:
            print("fail", name, e, flush=True)
        pg.close()
    m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                      user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
    for name, url in MOBILE.items():
        pg = m.new_page()
        try:
            pg.goto(url, wait_until="domcontentloaded", timeout=45000)
            pg.wait_for_timeout(7000)
            h = min(pg.evaluate("document.documentElement.scrollHeight"), 2600)
            pg.screenshot(path=os.path.join(OUT, name + ".png"), clip={"x": 0, "y": 0, "width": 390, "height": h}, full_page=True)
            print("ok", name, h, flush=True)
        except Exception as e:
            print("fail", name, e, flush=True)
        pg.close()
    b.close()
