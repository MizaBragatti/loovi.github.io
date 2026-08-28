const functions = require("firebase-functions");
const https = require("https");

const TARGET_HOST = "sso.loovi.app.br";
const TARGET_PREFIX = "/api/auth/otp";
const PROXY_PREFIX = "/api/sso";

exports.proxyService = functions.https.onRequest((req, res) => {
  // Configura CORS
  res.setHeader("Access-Control-Allow-Origin", "https://sistema-de-seguros-loovi.web.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST" || !req.url.startsWith(`${PROXY_PREFIX}/`)) {
    res.status(404).json({error: "not_found"});
    return;
  }

  let body = [];
  req.on("data", (chunk) => body.push(chunk));
  req.on("end", () => {
    body = Buffer.concat(body);

    const targetPath = TARGET_PREFIX + req.url.slice(PROXY_PREFIX.length);
    const options = {
      hostname: TARGET_HOST,
      path: targetPath,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
    };

    const upstreamReq = https.request(options, (upstreamRes) => {
      res.status(upstreamRes.statusCode || 502);
      res.setHeader("Content-Type", upstreamRes.headers["content-type"] || "application/json");
      upstreamRes.pipe(res);
    });

    upstreamReq.on("error", (err) => {
      console.error("[proxy] erro:", err.message);
      res.status(502).json({error: "bad_gateway"});
    });

    upstreamReq.write(body);
    upstreamReq.end();
  });
});
