// Tiny browser driver for the end-to-end test, using the Chrome DevTools Protocol (CDP) that
// Microsoft Edge and Google Chrome already include. No extra npm packages are needed.
// It needs Node's built-in WebSocket client: run with `node --experimental-websocket` on Node 20/21.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/microsoft-edge",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchBrowser({ width = 1400, height = 1000, headless = true } = {}) {
  const exe = CANDIDATES.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("No Edge or Chrome found. Set BROWSER_PATH to the browser executable.");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "skillsync-e2e-"));
  const proc = spawn(exe, [
    ...(headless ? ["--headless=new"] : []), "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, "--no-first-run", "--no-default-browser-check", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = "";
    const timer = setTimeout(() => reject(new Error("Browser did not start")), 20000);
    proc.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 1;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
    } else if (msg.method) {
      for (const l of listeners) l(msg);
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
  });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = new Page(send, sessionId, listeners, width, height);
  await page.init();

  return {
    page,
    async close() {
      try { await send("Browser.close"); } catch { /* already closed */ }
      ws.close();
      await sleep(500);
      proc.kill();
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
    },
  };
}

class Page {
  constructor(send, sessionId, listeners, width, height) {
    this.cmd = (method, params) => send(method, params, sessionId);
    this.sessionId = sessionId;
    this.listeners = listeners;
    this.width = width;
    this.height = height;
    this.requests = []; // { id, method, url, status } of every API request (counts + request log)
    this.interceptors = []; // { pattern: RegExp, respond: "fail" | { status, body } }
  }

  async init() {
    await this.cmd("Page.enable");
    await this.cmd("Runtime.enable");
    await this.cmd("Network.enable");
    await this.cmd("Emulation.setDeviceMetricsOverride", { width: this.width, height: this.height, deviceScaleFactor: 1, mobile: false });
    this.listeners.push(async (msg) => {
      if (msg.sessionId !== this.sessionId) return;
      if (msg.method === "Network.requestWillBeSent" && msg.params.request.url.includes("/api/")
        && msg.params.request.method !== "OPTIONS") {
        this.requests.push({ id: msg.params.requestId, method: msg.params.request.method, url: msg.params.request.url, status: null });
      }
      if (msg.method === "Network.responseReceived") {
        const req = this.requests.find((r) => r.id === msg.params.requestId);
        if (req) req.status = msg.params.response.status;
      }
      if (msg.method === "Network.loadingFailed") {
        const req = this.requests.find((r) => r.id === msg.params.requestId);
        if (req && req.status === null) req.status = "failed";
      }
      // Accept window.confirm() dialogs (e.g. "Delete your roadmap?")
      if (msg.method === "Page.javascriptDialogOpening") {
        await this.cmd("Page.handleJavaScriptDialog", { accept: true });
      }
      // Simulated API failures (see failRequests)
      if (msg.method === "Fetch.requestPaused") {
        const { requestId, request } = msg.params;
        const rule = this.interceptors.find((r) => r.pattern.test(request.url));
        if (request.method === "OPTIONS" || !rule) return this.cmd("Fetch.continueRequest", { requestId });
        if (rule.respond === "fail") return this.cmd("Fetch.failRequest", { requestId, errorReason: "ConnectionRefused" });
        return this.cmd("Fetch.fulfillRequest", {
          requestId, responseCode: rule.respond.status,
          responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" }],
          body: Buffer.from(JSON.stringify(rule.respond.body)).toString("base64"),
        });
      }
    });
  }

  // Makes matching API requests fail as if the server were down ("fail") or return an error response.
  async failRequests(pattern, respond = "fail") {
    this.interceptors.push({ pattern, respond });
    await this.cmd("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  }

  async stopFailing() {
    this.interceptors = [];
    await this.cmd("Fetch.disable");
  }

  async goto(url) {
    await this.cmd("Page.navigate", { url });
    await this.waitFor("document.readyState === 'complete'");
  }

  async eval(expression) {
    const res = await this.cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    return res.result.value;
  }

  async waitFor(expression, { timeout = 15000, message } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try { if (await this.eval(`Boolean(${expression})`)) return; } catch { /* page is still loading */ }
      await sleep(100);
    }
    throw new Error(`Timed out waiting for: ${message || expression}`);
  }

  waitForText(text, timeout) {
    return this.waitFor(`document.body && document.body.innerText.includes(${JSON.stringify(text)})`,
      { timeout, message: `text "${text}"` });
  }

  hasText(text) {
    return this.eval(`document.body.innerText.includes(${JSON.stringify(text)})`);
  }

  // Finds an element by CSS selector, or a button/link by its visible text, and returns its centre.
  async locate(target) {
    const js = target.startsWith("text=")
      ? `[...document.querySelectorAll("button, a, [role=radio], [role=checkbox]")]
          .find((e) => e.innerText.trim().includes(${JSON.stringify(target.slice(5))}) && e.offsetParent !== null)`
      : `document.querySelector(${JSON.stringify(target)})`;
    await this.waitFor(js, { message: target });
    return this.eval(`(() => { const el = ${js}; el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  }

  // A real mouse click (mouse down + up at the element's position), like a user would do.
  async click(target, { times = 1 } = {}) {
    const { x, y } = await this.locate(target);
    for (let i = 0; i < times; i++) {
      await this.cmd("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await this.cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    }
  }

  // Types into an input like a user: focus, select the old value, insert the new text.
  async type(selector, text) {
    await this.locate(selector);
    await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.select && el.select(); })()`);
    await this.cmd("Input.insertText", { text });
  }

  async press(key) {
    const code = { Enter: 13 }[key];
    await this.cmd("Input.dispatchKeyEvent", { type: "keyDown", key, windowsVirtualKeyCode: code, text: key === "Enter" ? "\r" : undefined });
    await this.cmd("Input.dispatchKeyEvent", { type: "keyUp", key, windowsVirtualKeyCode: code });
  }

  async setFile(selector, filePath) {
    const { root } = await this.cmd("DOM.getDocument", { depth: 1 });
    const { nodeId } = await this.cmd("DOM.querySelector", { nodeId: root.nodeId, selector });
    await this.cmd("DOM.setFileInputFiles", { nodeId, files: [path.resolve(filePath)] });
  }

  async screenshot(file) {
    await sleep(300); // let transitions finish
    const { cssContentSize } = await this.cmd("Page.getLayoutMetrics");
    const height = Math.min(Math.ceil(cssContentSize.height), 4000);
    const { data } = await this.cmd("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: this.width, height, scale: 1 },
    });
    fs.writeFileSync(file, Buffer.from(data, "base64"));
  }

  path() {
    return this.eval("location.pathname");
  }
}
