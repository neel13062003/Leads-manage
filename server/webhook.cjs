const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
loadEnv(path.join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 3000);
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v21.0";
const DATA_DIR = path.join(__dirname, "data");
const DIST_DIR = path.join(ROOT, "dist");

if (!VERIFY_TOKEN) {
  console.error("VERIFY_TOKEN is missing in .env");
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendText(res, 200, "Meta lead webhook is running. Callback path: /webhook");
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    if (serveStatic(req, res, url)) return;
    sendText(res, 200, "Meta lead webhook is running. Callback path: /webhook");
    return;
  }

  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      console.log("Webhook verified by Meta");
      sendText(res, 200, challenge);
      return;
    }

    console.log("Webhook verification failed");
    sendText(res, 403, "Verification failed");
    return;
  }

  if (req.method === "POST" && url.pathname === "/webhook") {
    let raw = "";
    try {
      raw = await readBody(req);
    } catch (error) {
      console.error("Could not read webhook body:", error.message);
      sendText(res, 400, "Bad request");
      return;
    }

    // Meta retries if it does not get 200 quickly.
    sendText(res, 200, "EVENT_RECEIVED");

    let body;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("Webhook body was not JSON:", error.message);
      appendJsonLine("events.jsonl", { receivedAt: new Date().toISOString(), raw });
      return;
    }

    const receivedAt = new Date().toISOString();
    console.log("\nWebhook event", receivedAt);
    console.log(JSON.stringify(body, null, 2));
    appendJsonLine("events.jsonl", { receivedAt, body });

    await handleEvent(body);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leads") {
    const source = url.searchParams.get("source");
    let leads = readLeads();
    if (source === "facebook" || source === "instagram") {
      leads = leads.filter((lead) => lead.source === source);
    }
    sendJson(res, 200, leads);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    sendJson(res, 200, statusPayload());
    return;
  }

  if (serveStatic(req, res, url)) return;
  sendText(res, 404, "Not found");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process using it, then start this server again.`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on http://localhost:${PORT}/webhook`);
  console.log(`Leads API: http://localhost:${PORT}/api/leads`);
  console.log(`Verify token: ${VERIFY_TOKEN ? "configured" : "missing"}`);
  console.log(`Graph API token: ${GRAPH_API_TOKEN ? "configured" : "missing"}`);
});

async function handleEvent(body) {
  const entries = Array.isArray(body.entry) ? body.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      if (change.field === "leadgen" && change.value?.leadgen_id) {
        await fetchLead(change.value);
      }
    }
  }
}

async function fetchLead(value) {
  const leadId = value.leadgen_id;
  const fields = "created_time,id,ad_id,form_id,field_data,platform";
  const endpoint =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadId}` +
    `?fields=${fields}&access_token=${encodeURIComponent(GRAPH_API_TOKEN || "")}`;

  console.log(`Fetching lead ${leadId}`);

  if (!GRAPH_API_TOKEN) {
    console.error("GRAPH_API_TOKEN is missing, so the lead form fields cannot be loaded");
    appendJsonLine("leads.jsonl", {
      receivedAt: new Date().toISOString(),
      webhook: value,
      error: "GRAPH_API_TOKEN missing",
    });
    return;
  }

  try {
    const response = await fetch(endpoint);
    const lead = await response.json();
    const formName = lead.error ? undefined : await fetchFormName(value.form_id || lead.form_id);
    const record = {
      receivedAt: new Date().toISOString(),
      pageId: value.page_id,
      formId: value.form_id,
      formName,
      platform: value.platform,
      leadgenId: leadId,
      lead,
    };

    appendJsonLine("leads.jsonl", record);

    if (lead.error) {
      console.error("Graph API error:", JSON.stringify(lead.error, null, 2));
      return;
    }

    console.log("Live lead:");
    console.log(JSON.stringify(toCrmLead(record), null, 2));
  } catch (error) {
    console.error("Lead fetch failed:", error.message);
    appendJsonLine("leads.jsonl", {
      receivedAt: new Date().toISOString(),
      webhook: value,
      error: error.message,
    });
  }
}

async function fetchFormName(formId) {
  if (!formId || !GRAPH_API_TOKEN) return undefined;
  try {
    const endpoint =
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${formId}` +
      `?fields=name&access_token=${encodeURIComponent(GRAPH_API_TOKEN)}`;
    const response = await fetch(endpoint);
    const form = await response.json();
    return typeof form.name === "string" ? form.name : undefined;
  } catch (error) {
    console.error("Form name fetch failed:", error.message);
    return undefined;
  }
}

function readLeads() {
  const byId = new Map();
  for (const record of readJsonLines("leads.jsonl")) {
    const lead = toCrmLead(record);
    if (lead) byId.set(lead.id, lead);
  }
  return [...byId.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function toCrmLead(record) {
  const lead = record.lead;
  if (!lead || lead.error || record.error) return null;

  const fields = {};
  for (const item of Array.isArray(lead.field_data) ? lead.field_data : []) {
    if (!item?.name) continue;
    const value = Array.isArray(item.values) ? item.values.filter(Boolean).join(", ") : "";
    if (value) fields[item.name] = value;
  }

  const platform = String(lead.platform || record.platform || "").toLowerCase();
  const source = platform === "ig" || platform === "instagram" ? "instagram" : "facebook";
  const name =
    fields.full_name ||
    fields.name ||
    [fields.first_name, fields.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  const crm = {
    id: String(lead.id || record.leadgenId || ""),
    name,
    source,
    createdAt: lead.created_time || record.receivedAt,
  };
  if (!crm.id) return null;
  if (fields.email) crm.email = fields.email;
  if (fields.phone_number || fields.phone) crm.phone = fields.phone_number || fields.phone;
  if (record.formName) crm.formName = record.formName;
  if (record.pageId) crm.pageId = String(record.pageId);
  if (record.formId || lead.form_id) crm.formId = String(record.formId || lead.form_id);
  if (lead.ad_id) crm.adId = String(lead.ad_id);

  const used = new Set([
    "full_name",
    "name",
    "first_name",
    "last_name",
    "email",
    "phone_number",
    "phone",
  ]);
  for (const [key, value] of Object.entries(fields)) {
    if (!used.has(key)) crm[key] = value;
  }
  return crm;
}

function statusPayload() {
  const leads = readLeads();
  const sourceStatus = (source) => {
    const rows = leads.filter((lead) => lead.source === source);
    return {
      configured: Boolean(GRAPH_API_TOKEN),
      lastReceived: rows[0]?.createdAt ?? null,
      count: rows.length,
    };
  };
  return {
    configured: Boolean(VERIFY_TOKEN && GRAPH_API_TOKEN),
    verifyToken: Boolean(VERIFY_TOKEN),
    graphToken: Boolean(GRAPH_API_TOKEN),
    callbackPath: "/webhook",
    sources: {
      facebook: sourceStatus("facebook"),
      instagram: sourceStatus("instagram"),
    },
  };
}

function readJsonLines(filename) {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendJsonLine(filename, value) {
  fs.appendFileSync(path.join(DATA_DIR, filename), `${JSON.stringify(value)}\n`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(text);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) return false;

  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = path.normalize(path.join(DIST_DIR, requested));
  if (!file.startsWith(DIST_DIR)) {
    sendText(res, 403, "Forbidden");
    return true;
  }

  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(target)) return false;

  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  fs.createReadStream(target).pipe(res);
  return true;
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
