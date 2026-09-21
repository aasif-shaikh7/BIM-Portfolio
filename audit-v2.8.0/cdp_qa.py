import base64
import json
import os
import secrets
import socket
import struct
import subprocess
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


class Cdp:
    def __init__(self, url):
        parsed = urlparse(url)
        self.sock = socket.create_connection((parsed.hostname, parsed.port), timeout=10)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET {parsed.path} HTTP/1.1\r\nHost: {parsed.hostname}:{parsed.port}\r\n"
            "Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n"
            "Origin: http://localhost\r\n\r\n"
        )
        self.sock.sendall(request.encode("ascii"))
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
            payload = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
        if opcode == 8:
            raise RuntimeError("WebSocket closed")
        return json.loads(payload.decode("utf-8"))

    def _send(self, value):
        payload = json.dumps(value).encode("utf-8")
        mask = secrets.token_bytes(4)
        length = len(payload)
        header = bytearray([0x81])
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.extend([0x80 | 126])
            header.extend(struct.pack("!H", length))
        else:
            header.extend([0x80 | 127])
            header.extend(struct.pack("!Q", length))
        header.extend(mask)
        encoded = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
        self.sock.sendall(header + encoded)

    def call(self, method, params=None):
        self.call_id += 1
        expected = self.call_id
        self._send({"id": expected, "method": method, "params": params or {}})
        while True:
            message = self._receive()
            if message.get("id") != expected:
                continue
            if "error" in message:
                raise RuntimeError(message["error"])
            return message.get("result", {})

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", {"expression": expression, "returnByValue": True})
        return result.get("result", {}).get("value")


def wait_for_page(port):
    endpoint = f"http://127.0.0.1:{port}/json"
    for _ in range(80):
        try:
            pages = json.load(urllib.request.urlopen(endpoint, timeout=1))
            return next(item["webSocketDebuggerUrl"] for item in pages if item.get("type") == "page")
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("Chrome did not expose a page target")


def screenshot(cdp, name):
    encoded = cdp.call("Page.captureScreenshot", {"format": "png", "fromSurface": True})["data"]
    (OUT / name).write_bytes(base64.b64decode(encoded))


def main():
    resume_path = ROOT / "assets" / "asif-shaikh-resume.pdf"
    if not resume_path.is_file() or not resume_path.read_bytes().startswith(b"%PDF"):
        raise RuntimeError("Resume PDF is missing or invalid")
    port = 9340
    profile = OUT / "cdp-profile"
    process = subprocess.Popen([
        CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
        "--no-default-browser-check", "--disable-background-networking",
        f"--remote-debugging-port={port}", "--remote-allow-origins=*",
        f"--user-data-dir={profile}", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        cdp = Cdp(wait_for_page(port))
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call("Network.enable")
        cdp.call("Network.setBlockedURLs", {"urls": ["*goatcounter.com/*", "*gc.zgo.at/*"]})
        cdp.call("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True,
        })
        cdp.call("Emulation.setScrollbarsHidden", {"hidden": True})
        cdp.call("Page.navigate", {"url": (ROOT / "index.html").as_uri()})
        time.sleep(4)
        screenshot(cdp, "01-mobile-home.png")
        cdp.evaluate("document.querySelector('.proj-dot').click(); document.querySelector('.proj-toggle').click(); document.querySelector('#projects').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(2)
        screenshot(cdp, "02-mobile-projects.png")

        results = cdp.evaluate("""
          (() => {
            const title = document.querySelector('.hero-title').getBoundingClientRect();
            const talk = getComputedStyle(document.querySelector('.lets-talk-float'));
            const visitor = getComputedStyle(document.querySelector('.visitor-widget'));
            const projectToggle = document.querySelector('.proj-toggle');
            if (projectToggle.getAttribute('aria-pressed') === 'true') projectToggle.click();
            projectToggle.click();
            document.querySelector('.proj-next').click();
            const projectButton = document.querySelector('.proj-feature:not([aria-hidden="true"]) .view-project');
            projectButton.click();
            const modalOpened = document.querySelector('#projectModal').classList.contains('open');
            const closeFocused = document.activeElement.classList.contains('modal-close');
            document.querySelector('.modal-close').click();
            const focusRestored = document.activeElement === projectButton;
            const galleryCleared = document.querySelector('#modalGallery').children.length === 0;
            const form = document.querySelector('#contactForm');
            form.elements.message.value = '';
            form.dispatchEvent(new Event('submit', {cancelable: true}));
            return {
              version: document.querySelector('link[href*="style.css"]').href.includes('2.8.0'),
              projectDots: document.querySelectorAll('.proj-dot').length,
              bbsDots: document.querySelectorAll('.bbs-dot').length,
              titleFits: title.left >= -0.5 && title.right <= innerWidth + 0.5,
              talkHidden: talk.display === 'none',
              visitorInFlow: visitor.position === 'static',
              resumeLinked: document.querySelector('.hero-actions a[download]')?.getAttribute('href') === 'assets/asif-shaikh-resume.pdf',
              linkedinLinked: document.querySelector('a[aria-label="LinkedIn profile"]')?.href === 'https://www.linkedin.com/in/shaikh-aasif-4253a739b',
              projectPaused: projectToggle.getAttribute('aria-pressed') === 'true',
              projectAdvanced: document.querySelector('#proj-current').textContent === '02',
              modalOpened, closeFocused, focusRestored, galleryCleared,
              formErrorVisible: !document.querySelector('#cf-error').hidden,
              messageInvalid: form.elements.message.getAttribute('aria-invalid') === 'true',
              jsErrors: window.__qaErrors || []
            };
          })()
        """)
        cdp.call("Emulation.setDeviceMetricsOverride", {
            "width": 1440, "height": 1000, "deviceScaleFactor": 1, "mobile": False,
        })
        cdp.evaluate("document.querySelector('#projects').scrollIntoView({behavior:'instant',block:'start'}); true")
        time.sleep(2)
        screenshot(cdp, "03-desktop-projects.png")
        print(json.dumps(results, indent=2))
        boolean_checks = [value for key, value in results.items() if key not in {"projectDots", "bbsDots", "jsErrors"}]
        if not all(value is True for value in boolean_checks):
            raise SystemExit(1)
        if results["projectDots"] != 14 or results["bbsDots"] != 19 or results["jsErrors"]:
            raise SystemExit(1)
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    main()
