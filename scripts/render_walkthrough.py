from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
out = root / 'walkthrough-frames'
out.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
    page.goto((root / 'walkthrough.html').as_uri(), wait_until='networkidle')
    frames = page.locator('.frame')
    assert frames.count() == 5
    for i in range(frames.count()):
        frames.nth(i).screenshot(path=str(out / f'{i + 1:02d}.png'))
    browser.close()
print('rendered 5 frames')
