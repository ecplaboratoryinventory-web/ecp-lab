from playwright.sync_api import sync_playwright
from pathlib import Path

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.route("**/*", lambda r: r.abort() if "fonts.g" in r.request.url else r.continue_())
    page.goto(f"{BASE}/auth/login", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(1500)
    page.fill("input[type=email]", "admin@school.edu")
    page.fill("input[type=password]", "password123")
    page.click("button[type=submit]")
    page.wait_for_timeout(5000)
    page.goto(f"{BASE}/admin/damage-reports", wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(2500)
    # crop the last column area
    page.screenshot(path="dmg_table.png", clip={"x": 1000, "y": 80, "width": 440, "height": 420}, timeout=90000)
    # open a view modal
    page.get_by_role("button", name="View").first.click()
    page.wait_for_timeout(1200)
    page.screenshot(path="dmg_modal.png", full_page=False, timeout=90000)
    ctx.close()
    browser.close()
