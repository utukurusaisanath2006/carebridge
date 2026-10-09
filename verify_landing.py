import asyncio
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
import websockets
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9223

async def send_cdp(ws, method, params=None, msg_id=1):
    payload = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(payload))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get("id") == msg_id:
            return data.get("result", {})

async def capture(ws, filename, msg_id):
    res = await send_cdp(ws, "Page.captureScreenshot", {"format": "png"}, msg_id)
    b64 = res.get("data", "")
    if b64:
        with open(filename, "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"Saved {filename} ({os.path.getsize(filename)/1024:.1f} KB)")

async def main():
    user_data = tempfile.mkdtemp()
    print("Using temporary incognito profile:", user_data)
    
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={user_data}",
        "--window-size=1280,800",
        "--hide-scrollbars",
        "http://127.0.0.1:5173/"
    ])
    
    time.sleep(2.5)
    
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json") as r:
            tabs = json.loads(r.read().decode())
            page_tab = next(t for t in tabs if t.get("type") == "page" and "5173" in t.get("url", ""))
            ws_url = page_tab["webSocketDebuggerUrl"]
            print(f"Connected to page tab: {page_tab['url']} - {page_tab['title']}")
            
        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            
            # Wait a moment for React hydration
            await asyncio.sleep(1.5)
            
            # 1. Test first run theme default
            eval_theme = await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.documentElement.getAttribute('data-theme')"
            }, msg_id); msg_id += 1
            first_run_theme = eval_theme.get("result", {}).get("value")
            print(f"[TEST 1] First run default theme: '{first_run_theme}' (Expected: 'dark')")
            assert first_run_theme == "dark", f"Expected dark default but got {first_run_theme}"
            
            # Capture dark landing screenshot
            await capture(ws, "screenshot_dark_1280.png", msg_id); msg_id += 1
            
            # 2. Test horizontal scroll across widths
            for w in [1920, 1280, 768, 375]:
                h = 812 if w == 375 else (1024 if w == 768 else 800)
                await send_cdp(ws, "Emulation.setDeviceMetricsOverride", {
                    "width": w, "height": h, "deviceScaleFactor": 1, "mobile": (w <= 768)
                }, msg_id); msg_id += 1
                await asyncio.sleep(0.5)
                
                eval_scroll = await send_cdp(ws, "Runtime.evaluate", {
                    "expression": "document.documentElement.scrollWidth <= window.innerWidth"
                }, msg_id); msg_id += 1
                no_scroll = eval_scroll.get("result", {}).get("value")
                print(f"[TEST 2] Viewport width {w}px has no horizontal overflow: {no_scroll}")
                
                if w == 375:
                    await capture(ws, "screenshot_dark_375.png", msg_id); msg_id += 1
            
            # Reset viewport to 1280x800
            await send_cdp(ws, "Emulation.setDeviceMetricsOverride", {
                "width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False
            }, msg_id); msg_id += 1
            await asyncio.sleep(0.5)
            
            # 3. Test light theme toggle
            await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-label=\"Toggle theme\"]').click()"
            }, msg_id); msg_id += 1
            await asyncio.sleep(0.5)
            
            eval_theme_light = await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.documentElement.getAttribute('data-theme')"
            }, msg_id); msg_id += 1
            light_theme = eval_theme_light.get("result", {}).get("value")
            print(f"[TEST 3] After toggle: '{light_theme}' (Expected: 'light')")
            assert light_theme == "light", f"Expected light theme but got {light_theme}"
            
            # Capture light landing screenshot
            await capture(ws, "screenshot_light_1280.png", msg_id); msg_id += 1
            
            # 4. Test toggling back to dark theme
            await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-label=\"Toggle theme\"]').click()"
            }, msg_id); msg_id += 1
            await asyncio.sleep(0.5)
            
            eval_theme_dark2 = await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.documentElement.getAttribute('data-theme')"
            }, msg_id); msg_id += 1
            dark2_theme = eval_theme_dark2.get("result", {}).get("value")
            print(f"[TEST 4] After toggling back: '{dark2_theme}' (Expected: 'dark')")
            assert dark2_theme == "dark", f"Expected dark theme but got {dark2_theme}"
            
            # 5. Test opening Registration Sheet
            await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('button[aria-label=\"Register as patient\"], header button:has(svg)').click(); "
                              "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Patient Registration'))?.click();"
            }, msg_id); msg_id += 1
            await asyncio.sleep(0.6)
            
            # Scroll form into view
            await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.querySelector('#product').scrollIntoView();"
            }, msg_id); msg_id += 1
            await asyncio.sleep(0.5)
            
            eval_reg = await send_cdp(ws, "Runtime.evaluate", {
                "expression": "document.body.innerText.includes('Patient Care Registration')"
            }, msg_id); msg_id += 1
            reg_visible = eval_reg.get("result", {}).get("value")
            print(f"[TEST 5] Registration sheet visible: {reg_visible}")
            assert reg_visible is True, "Registration stepper should be visible"
            
            # Capture Registration sheet screenshot
            await capture(ws, "screenshot_register_sheet_1280.png", msg_id); msg_id += 1
            
    finally:
        proc.terminate()
        try:
            shutil.rmtree(user_data, ignore_errors=True)
        except Exception:
            pass

if __name__ == '__main__':
    asyncio.run(main())
