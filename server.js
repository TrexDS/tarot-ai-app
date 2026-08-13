const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// The OpenAI SDK needs the global fetch that Node 18+ ships.
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
if (nodeMajor < 18) {
  console.error(
    `This needs Node 18 or newer (found ${process.version}).\n` +
    "If you use nvm: nvm install 18 && nvm use 18\n" +
    "Otherwise, use a newer node binary directly, e.g. /opt/homebrew/bin/node server.js"
  );
  process.exit(1);
}

const OpenAI = require("openai");

const PORT = process.env.PORT || 8787;
const APP_ROOT = __dirname;

// This key is from Volcano Engine / 火山方舟 (volces.com), NOT DeepSeek's own
// platform.deepseek.com — different service, different base URL, different key format
// (the "sk-ark-..." prefix is the giveaway). Ark's OpenAI-compatible endpoint:
const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

// Confirmed by user from their own Ark console (模型广场). Override via ARK_MODEL
// env var if this ever changes without needing to edit this file.
const MODEL = process.env.ARK_MODEL || "deepseek-v4-flash-ga-260731";

const apiKey = process.env.ARK_API_KEY || process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error(
    "ARK_API_KEY is not set.\n" +
    "Run: export ARK_API_KEY=sk-ark-...   (get one at https://console.volcengine.com/ark)"
  );
  process.exit(1);
}

// eslint-disable-next-line no-control-regex
if (!/^[\x00-\x7F]+$/.test(apiKey)) {
  console.error(
    "ARK_API_KEY contains non-ASCII characters — it looks like a placeholder\n" +
    "rather than a real key. Get a real key at https://console.volcengine.com/ark\n" +
    "and use the whole string it gives you, e.g. ARK_API_KEY=sk-ark-XXXXXXXX... node server.js"
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL: ARK_BASE_URL });

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(req, res, urlPath) {
  let safePath = urlPath === "/" ? "/index.html" : urlPath;
  safePath = safePath.split("?")[0];
  const filePath = path.normalize(path.join(APP_ROOT, safePath.replace(/^\/+/, "")));

  if (!filePath.startsWith(APP_ROOT)) {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (safePath !== "/index.html") {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      sendJson(res, 404, { error: "not found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon"
    }[ext] || "application/octet-stream";

    res.writeHead(200, { "content-type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  // Permissive CORS for local dev or deployed origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && urlObj.pathname === "/api/reading") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendJson(res, 400, { error: "invalid JSON body" });
        return;
      }

      const { system, message } = parsed;
      if (typeof system !== "string" || typeof message !== "string") {
        sendJson(res, 400, { error: "system and message must both be strings" });
        return;
      }

      try {
        const response = await client.chat.completions.create({
          model: MODEL,
          max_tokens: 300,
          messages: [
            { role: "system", content: system },
            { role: "user", content: message },
          ],
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        if (!text) {
          sendJson(res, 502, { error: "no text in model response" });
          return;
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ text }));
      } catch (err) {
        console.error("[tarot-ai-proxy] request failed:", err && err.message);
        sendJson(res, 500, { error: "internal error" });
      }
    });
    return;
  }

  if (req.method === "GET") {
    serveStaticFile(req, res, urlObj.pathname);
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Tarot AI proxy listening on http://localhost:${PORT}`);
});
