"""Headless QA for walkthrough-demo v0.1.0.

Reuses the raw-WebSocket CDP pattern from audit-v2.8.0/cdp_qa.py, but stays
self-contained so this demo folder can be copied or deleted on its own.

What it proves (not what it claims):
  1. no JS errors on load or during interaction
  2. the player mounts from data: 5 slides, 5 thumbs, 01/05, stage ratio
  3. the camera move runs on the render only (cine-cam + cineDolly)
  4. the measured autoplay interval really is ~3500 ms
  5. pause actually freezes it, keyboard actually advances it
  6. "force camera move on drawings" applies it to flat drawings too
  7. reduced-motion simulation kills the animation and autoplay
  8. the 5.0 s card advances fewer slides than the 3.5 s card in the same time

Run:  python walkthrough-demo/qa_demo.py
Exit code 0 = every assertion passed. Screenshots land next to this file.
"""
import base64
import json
import os
import secrets
import socket
import struct
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
PAGE = OUT / "index.html"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9341


class Cdp:
    """Minimal Chrome DevTools Protocol client over a raw WebSocket."""

    def __init__(self, url):
        parsed = urlparse(url)
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=20)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        self.sock.sendall((
            f"GET {parsed.path} HTTP/1.1\r\nHost: {parsed.hostname}:{parsed.port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n"
            "Origin: http://localhost\r\n\r\n"
        ).encode("ascii"))
        if b" 101 " not in self.sock.recv(4096):
            raise RuntimeError("WebSocket handshake failed")
        self.call_id = 0

    def _read(self, size):
        data = bytearray()
        while len(data) < size:
            chunk = self.sock.recv(size - len(data))
            if not chunk:
                raise RuntimeError("WebSocket closed")
            data.extend(chunk)
        return bytes(data)

    def _receive(self):
        first, second = self._read(2)
        opcode = first & 15
        length = second & 127
        if length == 126:
            length = struct.unpack("!H", self._read(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self._read(8))[0]
        mask = self._read(4) if second & 128 else None
        payload = self._read(length)
        if mask:
            payload = bytes(v ^ mask[i % 4] for i, v in enumerate(payload))
        if opcode == 8:
            raise RuntimeError("WebSocket closed")
        return json.loads(payload.decode("utf-8"))

    def _send(self, value):
        payload = json.dumps(value).encode("utf-8")
        mask = secrets.token_bytes(4)
        header = bytearray([0x81])
        if len(payload) < 126:
            header.append(0x80 | len(payload))
        elif len(payload) < 65536:
            header.extend([0x80 | 126])
            header.extend(struct.pack("!H", len(payload)))
        else:
            header.extend([0x80 | 127])
            header.extend(struct.pack("!Q", len(payload)))
        header.extend(mask)
        self.sock.sendall(header + bytes(v ^ mask[i % 4] for i, v in enumerate(payload)))

    def call(self, method, params=None):
        self.call_id += 1
        expected = self.call_id
        self._send({"id": expected, "method": method, "params": params or {}})
        while True:
            message = self._receive()
            if message.get("id") == expected:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {"expression": expression, "returnByValue": True})
        if result.get("exceptionDetails"):
            raise RuntimeError(result["exceptionDetails"].get("text"))
        return result.get("result", {}).get("value")


def wait_for_page(port):
    endpoint = f"http://127.0.0.1:{port}/json"
    for _ in range(80):
        try:
            pages = json.load(urllib.request.urlopen(endpoint, timeout=5))
            return next(p["webSocketDebuggerUrl"] for p in pages if p.get("type") == "page")
        except Exception:
            time.sleep(0.25)
    raise RuntimeError("Chrome did not expose a page target")


def screenshot(cdp, name):
    encoded = cdp.call("Page.captureScreenshot", {"format": "png", "fromSurface": True})["data"]
    (OUT / name).write_bytes(base64.b64decode(encoded))


def main():
    if not PAGE.is_file():
        raise SystemExit(f"demo page missing: {PAGE}")
    if not os.path.isfile(CHROME):
        raise SystemExit(f"Chrome not found at {CHROME}")

    failures = []

    def check(name, ok, detail=""):
        print(("  PASS  " if ok else "  FAIL  ") + name + ("" if ok else f"  -> {detail}"))
        if not ok:
            failures.append(name)

    process = subprocess.Popen([
        CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
        "--no-default-browser-check", "--disable-background-networking",
        f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
        f"--user-data-dir={OUT / 'cdp-profile'}", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        cdp = Cdp(wait_for_page(PORT))
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call("Emulation.setScrollbarsHidden", {"hidden": True})
        cdp.call("Emulation.setDeviceMetricsOverride",
                 {"width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False})
        cdp.call("Page.navigate", {"url": PAGE.as_uri()})
        time.sleep(3)

        # ---------- 1. player mount ----------
        mount = cdp.evaluate("""(() => {
          const slides = [...document.querySelectorAll('.cine-slide')];
          const first = slides[0].querySelector('img');
          const ar = parseFloat(getComputedStyle(document.querySelector('#cineStage')).getPropertyValue('--ar'));
          return {
            slides: slides.length,
            thumbs: document.querySelectorAll('.cine-thumb').length,
            cur: document.querySelector('#cineCur').textContent,
            total: document.querySelector('#cineTotal').textContent,
            ar: ar,
            camFlags: slides.map(s => s.classList.contains('cine-cam')),
            anim: getComputedStyle(first).animationName,
            dur: getComputedStyle(first).animationDuration
          };
        })()""")
        print(json.dumps(mount, indent=2))
        check("player mounts from data (5 slides / 5 thumbs / 01 of 05)",
              mount["slides"] == 5 and mount["thumbs"] == 5 and mount["cur"] == "01" and mount["total"] == "05",
              str(mount))
        check("stage takes the render ratio (GENESIS 1756x2473 -> 0.75 clamp)",
              abs(mount["ar"] - 0.75) < 0.01, str(mount["ar"]))
        check("camera move ON for the render, off for drawings",
              mount["camFlags"] == [True, False, False, False, False], str(mount["camFlags"]))
        check("camera move is a real running animation: cineDolly @ 3.5s",
              mount["anim"] == "cineDolly" and mount["dur"] == "3.5s",
              f"{mount['anim']} / {mount['dur']}")
        screenshot(cdp, "01-desktop-player.png")

        # ---------- 2. measured autoplay interval ----------
        log = []
        for _ in range(24):
            log = cdp.evaluate("window.__walkthroughDemo.get().advanceLog")
            if len(log) >= 3:
                break
            time.sleep(0.5)
        deltas = [log[i + 1] - log[i] for i in range(len(log) - 1)]
        print("autoplay deltas (ms):", deltas)
        check("autoplay really advances every ~3500 ms",
              len(deltas) >= 2 and all(3000 <= d <= 4100 for d in deltas), str(deltas))

        # ---------- 3. pause must actually freeze the player ----------
        cdp.evaluate("document.querySelector('[data-cine-play]').click(); true")
        before = cdp.evaluate("window.__walkthroughDemo.get()")
        time.sleep(4.5)
        after = cdp.evaluate("window.__walkthroughDemo.get()")
        check("pause freezes index and advanceLog for 4.5 s",
              after["index"] == before["index"]
              and len(after["advanceLog"]) == len(before["advanceLog"])
              and after["manualPause"] is True,
              json.dumps({"index_before": before["index"], "index_after": after["index"],
                          "log_before": len(before["advanceLog"]), "log_after": len(after["advanceLog"])}))
        cdp.evaluate("document.querySelector('[data-cine-play]').click(); true")
        time.sleep(0.3)

        # ---------- 4. keyboard transport ----------
        kb = cdp.evaluate("""(() => {
          const root = document.querySelector('#cineRoot');
          const start = window.__walkthroughDemo.get().index;
          root.focus();
          root.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true, cancelable:true}));
          const afterRight = window.__walkthroughDemo.get().index;
          root.dispatchEvent(new KeyboardEvent('keydown', {key:'Home', bubbles:true, cancelable:true}));
          return {start: start, afterRight: afterRight, afterHome: window.__walkthroughDemo.get().index};
        })()""")
        check("ArrowRight advances one slide, Home returns to 0",
              kb["afterRight"] == (kb["start"] + 1) % 5 and kb["afterHome"] == 0, str(kb))

        # ---------- 5. camera move on a flat drawing (the honest failure demo) ----------
        cam = cdp.evaluate("""(() => {
          window.__walkthroughDemo.togglePlay();               /* pause so the slide cannot change mid-test */
          window.__walkthroughDemo.go(1);                      /* slide 2 = a flat technical drawing */
          const onDrawing = getComputedStyle(document.querySelector('.cine-slide.is-active img')).animationName;
          document.querySelector('[data-force-cam]').click();
          return {
            beforeForce: onDrawing,
            afterForce: getComputedStyle(document.querySelector('.cine-slide.is-active img')).animationName,
            allFlagged: [...document.querySelectorAll('.cine-slide')].every(s => s.classList.contains('cine-cam'))
          };
        })()""")
        check("drawing gets NO camera move until forced", cam["beforeForce"] == "none", str(cam))
        check("force toggle applies the camera move to the drawing too",
              cam["afterForce"] == "cineDolly" and cam["allFlagged"] is True, str(cam))

        # ---------- 5b. proof the dolly really moves pixels, not just CSS intent ----------
        cdp.evaluate("window.__walkthroughDemo.go(0); true")
        time.sleep(0.4)
        t1 = cdp.evaluate("getComputedStyle(document.querySelector('.cine-slide.is-active img')).transform")
        time.sleep(1.6)
        t2 = cdp.evaluate("getComputedStyle(document.querySelector('.cine-slide.is-active img')).transform")
        check("camera move progresses over time (transform matrix changes)",
              t1 not in (None, "none") and t2 not in (None, "none") and t1 != t2, f"{t1}  ->  {t2}")
        # ---------- 6. reduced-motion simulation ----------
        rm = cdp.evaluate("""(() => {
          document.querySelector('[data-sim-rm]').click();
          return {
            htmlClass: document.documentElement.classList.contains('rm'),
            anim: getComputedStyle(document.querySelector('.cine-slide.is-active img')).animationName,
            manualPause: window.__walkthroughDemo.get().manualPause
          };
        })()""")
        check("reduced-motion simulation stops the camera move and autoplay",
              rm["htmlClass"] is True and rm["anim"] == "none" and rm["manualPause"] is True, str(rm))
        cdp.evaluate("document.querySelector('[data-sim-rm]').click(); true")

        # ---------- 7. A/B race: 3.5 s must out-run 5.0 s ----------
        cdp.evaluate("document.querySelector('[data-race-start]').click(); true")
        time.sleep(9)
        race = cdp.evaluate("""(() => {
          const counts = [...document.querySelectorAll('[data-race-count]')].map(e => parseInt(e.textContent, 10));
          return {slow_5s: counts[0], fast_3s5: counts[1],
                  elapsed: [...document.querySelectorAll('[data-race-elapsed]')].map(e => e.textContent)};
        })()""")
        print("race after 9 s:", json.dumps(race))
        check("3.5 s card advances more slides than the 5.0 s card in 9 s",
              race["fast_3s5"] > race["slow_5s"], str(race))
        cdp.evaluate("document.querySelector('[data-race-pause]').click(); true")

        # ---------- 8. project switch rebuilds the player ----------
        sw = cdp.evaluate("""(() => {
          document.querySelector('[data-proj="1"]').click();
          return {
            slides: document.querySelectorAll('.cine-slide').length,
            thumbs: document.querySelectorAll('.cine-thumb').length,
            total: document.querySelector('#cineTotal').textContent,
            ar: parseFloat(getComputedStyle(document.querySelector('#cineStage')).getPropertyValue('--ar'))
          };
        })()""")
        print("after switching to SB PARADISE:", json.dumps(sw))
        check("project switch rebuilds player (SB PARADISE -> 10 slides, ratio 0.866)",
              sw["slides"] == 10 and sw["thumbs"] == 10 and sw["total"] == "10"
              and abs(sw["ar"] - 0.866) < 0.01, str(sw))

        # ---------- 9. no JS errors ----------
        errors = cdp.evaluate("window.__qaErrors")
        check("no JS errors on the page", errors == [], str(errors))

        # ---------- 10. screenshots ----------
        cdp.evaluate("document.querySelector('#race').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(1.2)
        screenshot(cdp, "02-desktop-race.png")
        cdp.evaluate("document.querySelector('#player').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(1.2)
        screenshot(cdp, "03-desktop-player.png")
        cdp.evaluate("document.querySelector('#limits').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(1.2)
        screenshot(cdp, "05-desktop-limits.png")
        cdp.call("Emulation.setDeviceMetricsOverride",
                 {"width": 390, "height": 844, "deviceScaleFactor": 2, "mobile": True})
        time.sleep(1.2)
        # ---------- 11. mobile layout ----------
        # The metric override re-flows the page, so scroll explicitly: the desktop scroll
        # position no longer points at the same content at 390 px.
        cdp.evaluate("document.querySelector('#limits').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(1.2)
        # Overflow is measured with the tall weigh-in table on screen, i.e. the worst case.
        mobile = cdp.evaluate(
            "(() => { const de = document.documentElement;"
            " return { inner: window.innerWidth, scroll: de.scrollWidth,"
            " table: [...document.querySelectorAll('#limits table')]"
            "   .map(t => Math.round(t.getBoundingClientRect().width)) }; })()")
        no_overflow = mobile["scroll"] <= mobile["inner"] + 1
        print(f"390 px layout: {mobile}")
        check("no horizontal overflow at 390 px", no_overflow, str(mobile))
        screenshot(cdp, "06-mobile-limits.png")
        # Explicit scroll so the "mobile player" shot always frames the player itself,
        # never wherever the previous check happened to leave the viewport.
        cdp.evaluate("document.querySelector('#player').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(1.2)
        screenshot(cdp, "04-mobile-player.png")
        print(f"screenshots written to {OUT}")
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
    if failures:
        print("\nFAILED:", ", ".join(failures))
        sys.exit(1)
    print("\nall demo QA checks passed")


if __name__ == "__main__":
    main()
