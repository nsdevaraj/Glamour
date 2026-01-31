from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a context with a mobile viewport
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Check for LIPS button (it's the default active category so its controls should be visible)
            print("Checking for LIPS button...")
            lips_btn = page.get_by_role("button", name="LIPS")
            lips_btn.wait_for(state="visible", timeout=5000)

            # Default active category is LIPS.
            # "Lip Color" should be visible.
            print("Checking for Lip Color control...")
            lip_color_label = page.get_by_text("Lip Color")
            lip_color_label.wait_for(state="visible", timeout=5000)

            # Click on EYES
            print("Clicking EYES button...")
            eyes_btn = page.get_by_role("button", name="EYES")
            eyes_btn.click()

            # Check for Eyeshadow control
            # The label is passed as "Eyeshadow" in the code.
            print("Checking for Eyeshadow control...")
            eyeshadow_label = page.get_by_text("Eyeshadow")
            eyeshadow_label.wait_for(state="visible", timeout=5000)

            print("Taking screenshot...")
            page.screenshot(path="verification_ux.png")
            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_failure.png")
            print("Saved failure screenshot.")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
