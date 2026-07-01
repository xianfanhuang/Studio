from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Step 1: Open the app
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Step 2: Open Visual Styles Drawer
    page.get_by_label("Toggle Visual Styles Drawer").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/styles_drawer.png")

    # Step 3: Change style
    page.get_by_text("星系云海").click()
    page.wait_for_timeout(1000)

    # Step 4: Close drawer
    page.get_by_label("Close Styles Drawer").click()
    page.wait_for_timeout(500)

    # Step 5: Open Playlist Drawer
    page.get_by_label("Toggle Playlist Drawer").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/playlist_drawer.png")
    page.get_by_label("Close Playlist Drawer").click()
    page.wait_for_timeout(500)

    # Step 6: Trigger AI Host (Intro)
    page.get_by_label("Trigger AI Host Introduction").click()
    page.wait_for_timeout(2000) # Wait for thinking state
    page.screenshot(path="verification/screenshots/ai_host_loading.png")
    page.wait_for_timeout(3000) # Wait more for speech

    # Final screenshot
    page.screenshot(path="verification/screenshots/final_state.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
