from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # Test mobile
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path="mobile_01_drop.png")
    page.wait_for_timeout(2500)
    page.screenshot(path="mobile_02_split.png")
    page.wait_for_timeout(5000)
    page.screenshot(path="mobile_03_right.png")
    
    page.close()
    browser.close()