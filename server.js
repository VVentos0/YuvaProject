require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoose = require("mongoose");

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/yuva";
const publicOrigin = process.env.PUBLIC_ORIGIN || "https://yuvarchive.com";
const databaseOrigin = process.env.DATABASE_ORIGIN || "https://database.yuvarchive.com";
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminToken = process.env.ADMIN_TOKEN || "";
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminCookieName = "yuva_admin";

const allowedOrigins = new Set([
  publicOrigin,
  databaseOrigin,
  "https://www.yuvarchive.com",
  "http://yuvarchive.com",
  "http://www.yuvarchive.com",
  "http://database.yuvarchive.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...configuredOrigins,
]);

const allowedOriginHosts = new Set([
  "yuvarchive.com",
  "www.yuvarchive.com",
  "database.yuvarchive.com",
  "localhost",
  "127.0.0.1",
]);

function isAllowedOrigin(origin) {
  if (!origin || origin === "null") return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol) && allowedOriginHosts.has(parsed.hostname);
  } catch (error) {
    return false;
  }
}

const RECIPIENTS = ["SEDO", "IRO"];
const PAPER_STYLES = ["warm", "linen", "blue", "rose"];
const FONT_STYLES = ["modern", "serif", "soft", "pixel", "mono", "hand", "dream"];
const ENVELOPE_STYLES = ["cream", "rose", "blue", "sage"];
const MIN_LETTER_BODY_LENGTH = 500;
const MIN_LETTER_COMPOSE_MS = 5000;
const DUPLICATE_BODY_WINDOW_MS = 10 * 60 * 1000;
const DUPLICATE_IP_BODY_WINDOW_MS = 24 * 60 * 60 * 1000;

const letterSchema = new mongoose.Schema(
  {
    author: { type: String, trim: true, maxlength: 48, default: "" },
    anonymous: { type: Boolean, default: false },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    recipient: { type: String, enum: RECIPIENTS, required: true },
    body: { type: String, trim: true, minlength: 1, maxlength: 5000, required: true },
    paper: { type: String, enum: PAPER_STYLES, default: "warm" },
    color: { type: String, match: /^#[0-9a-f]{6}$/i, default: "#2d2926" },
    senderColor: { type: String, match: /^#[0-9a-f]{6}$/i, default: "#6b4f2a" },
    font: { type: String, enum: FONT_STYLES, default: "modern" },
    envelope: { type: String, enum: ENVELOPE_STYLES, default: "blue" },
    sticker: { type: String, trim: true, maxlength: 120, default: "" },
    ipAddress: { type: String, trim: true, maxlength: 64, default: "" },
    ipHash: { type: String, default: "" },
    bodyHash: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

letterSchema.index({ createdAt: -1 });
letterSchema.index({ recipient: 1, createdAt: -1 });
letterSchema.index({ bodyHash: 1, createdAt: -1 });
letterSchema.index({ ipHash: 1, bodyHash: 1, createdAt: -1 });

const Letter = mongoose.model("Letter", letterSchema);

const blockedIpSchema = new mongoose.Schema(
  {
    ipHash: { type: String, required: true, unique: true },
    ipAddress: { type: String, trim: true, maxlength: 64, default: "" },
    reason: { type: String, trim: true, maxlength: 160, default: "admin" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const BlockedIp = mongoose.model("BlockedIp", blockedIpSchema);

app.set("trust proxy", 1);
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      callback(new Error("Origin not allowed"));
    },
  }),
);
app.use(express.json({ limit: "24kb" }));
app.use(express.urlencoded({ extended: false }));

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: { error: "Too many letters, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  message: { error: "Too many letters, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { error: "Hourly letter limit reached, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 24,
  standardHeaders: true,
  legacyHeaders: false,
});

function isDatabaseHost(req) {
  return req.hostname.toLowerCase() === "database.yuvarchive.com";
}

function applyAdminSecurityHeaders(req, res, next) {
  if (isDatabaseHost(req) || req.path.startsWith("/api/admin") || req.path === "/admin" || req.path === "/admin.js") {
    res.set({
      "Cache-Control": "no-store, private",
      "Pragma": "no-cache",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    });
  }

  next();
}

function normalizeLetter(input) {
  return {
    author: input.anonymous ? "anonim kus" : String(input.author || "").trim(),
    anonymous: Boolean(input.anonymous),
    title: String(input.title || "").trim(),
    recipient: RECIPIENTS.includes(input.recipient) ? input.recipient : "SEDO",
    body: String(input.body || "").trim(),
    paper: PAPER_STYLES.includes(input.paper) ? input.paper : "warm",
    color: /^#[0-9a-f]{6}$/i.test(input.color || "") ? input.color : "#2d2926",
    senderColor: /^#[0-9a-f]{6}$/i.test(input.senderColor || "") ? input.senderColor : "#6b4f2a",
    font: FONT_STYLES.includes(input.font) ? input.font : "modern",
    envelope: ENVELOPE_STYLES.includes(input.envelope) ? input.envelope : "blue",
    sticker: String(input.sticker || "").trim(),
  };
}

function normalizeBodyForHash(body) {
  return String(body || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function hashLetterBody(body) {
  return crypto.createHash("sha256").update(normalizeBodyForHash(body)).digest("hex");
}

function getSubmittedAt(input) {
  const value = Number(input?.submittedAt || 0);
  return Number.isFinite(value) ? value : 0;
}

function getFormStartedAt(input) {
  const value = Number(input?.formStartedAt || 0);
  return Number.isFinite(value) ? value : 0;
}

function isHoneypotFilled(input) {
  return Boolean(String(input?.website || input?.homepage || "").trim());
}

async function findDuplicateLetter({ bodyHash, ipHash }) {
  if (!bodyHash) return null;

  const now = Date.now();
  const sameBodySince = new Date(now - DUPLICATE_BODY_WINDOW_MS);
  const sameIpBodySince = new Date(now - DUPLICATE_IP_BODY_WINDOW_MS);

  return Letter.findOne({
    bodyHash,
    $or: [
      { createdAt: { $gte: sameBodySince } },
      { ipHash, createdAt: { $gte: sameIpBodySince } },
    ],
  })
    .select("_id")
    .lean();
}

function toPublicLetter(letter) {
  return {
    id: letter._id.toString(),
    recipient: letter.recipient,
    envelope: letter.envelope,
    createdAt: letter.createdAt,
  };
}

function toAdminLetter(letter) {
  return {
    id: letter._id.toString(),
    recipient: letter.recipient,
    createdAt: letter.createdAt,
    author: letter.author,
    anonymous: letter.anonymous,
    title: letter.title,
    body: letter.body,
    paper: letter.paper,
    color: letter.color,
    senderColor: letter.senderColor,
    font: letter.font,
    sticker: letter.sticker,
    ipAddress: letter.ipAddress || "",
    ipHash: letter.ipHash || "",
    updatedAt: letter.updatedAt,
  };
}

function getClientIp(req) {
  const forwardedFor = String(req.get("x-forwarded-for") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const value = forwardedFor[0] || req.ip || req.socket?.remoteAddress || "";
  return value.replace(/^::ffff:/, "").slice(0, 64);
}

function hashIp(ipAddress) {
  if (!ipAddress) return "";
  const secret = adminToken || adminPassword || "yuva";
  return crypto.createHmac("sha256", secret).update(ipAddress).digest("hex");
}

function normalizeAdminLetterPatch(input) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(input, "author")) {
    patch.author = String(input.author || "").trim().slice(0, 48);
  }

  if (Object.prototype.hasOwnProperty.call(input, "body")) {
    patch.body = String(input.body || "").trim();
  }

  if (RECIPIENTS.includes(input.recipient)) {
    patch.recipient = input.recipient;
  }

  return patch;
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.get("cookie") || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) return [cookie, ""];
        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))];
      }),
  );
}

function getAdminCookieValue() {
  const secret = adminToken || adminPassword;
  if (!secret || !adminPassword) return "";

  return crypto.createHmac("sha256", secret).update(`${adminUsername}:${adminPassword}`).digest("hex");
}

function isAdminAuthorized(req) {
  const authorization = req.get("authorization") || "";
  const cookies = parseCookies(req);
  const cookieValue = getAdminCookieValue();

  if (cookieValue && safeEqual(cookies[adminCookieName] || "", cookieValue)) {
    return true;
  }

  if (authorization.startsWith("Basic ")) {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return Boolean(adminPassword && safeEqual(username, adminUsername) && safeEqual(password, adminPassword));
  }

  return false;
}

function requireAdmin(req, res, next) {
  if (isAdminAuthorized(req)) {
    next();
    return;
  }

  if (req.accepts("html")) {
    res.set("WWW-Authenticate", 'Basic realm="YUVA database"');
    res.status(401).send("Authentication required");
    return;
  }

  res.set("WWW-Authenticate", 'Basic realm="YUVA database"');
  res.status(401).json({ error: "Unauthorized" });
}

function safeEqual(actual, expected) {
  const actualBuffer = Buffer.from(String(actual));
  const expectedBuffer = Buffer.from(String(expected));

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireAdminPage(req, res, next) {
  adminLimiter(req, res, () => requireAdmin(req, res, next));
}

function routeDatabaseHost(req, res, next) {
  if (!isDatabaseHost(req)) {
    next();
    return;
  }

  if (req.path === "/admin-login" && (req.method === "GET" || req.method === "HEAD")) {
    res.redirect("/");
    return;
  }

  if (req.path === "/admin-login" && req.method === "POST") {
    loginLimiter(req, res, () => {
      const username = String(req.body.username || "");
      const password = String(req.body.password || "");

      if (!adminPassword || !safeEqual(username, adminUsername) || !safeEqual(password, adminPassword)) {
        res.status(401).sendFile(path.join(__dirname, "login.html"));
        return;
      }

      res.cookie(adminCookieName, getAdminCookieValue(), {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
        secure: req.secure || req.get("x-forwarded-proto") === "https",
      });
      res.redirect("/");
    });
    return;
  }

  if (req.path === "/logout") {
    res.clearCookie(adminCookieName);
    res.redirect("/");
    return;
  }

  if (req.path === "/" || req.path === "/admin") {
    if (!isAdminAuthorized(req)) {
      res.sendFile(path.join(__dirname, "login.html"));
      return;
    }

    requireAdminPage(req, res, () => {
      res.sendFile(path.join(__dirname, "admin.html"));
    });
    return;
  }

  if (req.path === "/admin.js") {
    requireAdminPage(req, res, () => {
      res.sendFile(path.join(__dirname, "admin.js"));
    });
    return;
  }

  if (req.path.startsWith("/api/admin")) {
    next();
    return;
  }

  if (req.path === "/api/health") {
    next();
    return;
  }

  if (req.path === "/favicon.svg") {
    next();
    return;
  }

  res.status(404).send("Not found");
}

function requireConfiguredAdmin(req, res, next) {
  if (!isDatabaseHost(req)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (!adminPassword && !adminToken) {
    res.status(503).json({ error: "Admin access is not configured" });
    return;
  }

  adminLimiter(req, res, () => requireAdmin(req, res, next));
}

app.use(applyAdminSecurityHeaders);
app.use(routeDatabaseHost);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/favicon.svg", (req, res) => {
  res.type("image/svg+xml").sendFile(path.join(__dirname, "images", "cicikus-bird.svg"));
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: https://yuvarchive.com/sitemap.xml\n");
});

app.get("/sitemap.xml", (req, res) => {
  res
    .type("application/xml")
    .send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yuvarchive.com/</loc></url></urlset>');
});

app.get("/api/letters", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 160), 1), 200);
    const letters = await Letter.find({}).sort({ createdAt: -1 }).limit(limit).lean(false);

    res.json({
      letters: letters.map(toPublicLetter),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/letters", writeBurstLimiter, writeLimiter, writeHourlyLimiter, async (req, res, next) => {
  try {
    const payload = normalizeLetter(req.body);
    const ipAddress = getClientIp(req);
    const ipHash = hashIp(ipAddress);
    const bodyHash = hashLetterBody(payload.body);
    const submittedAt = getSubmittedAt(req.body);
    const formStartedAt = getFormStartedAt(req.body);

    if (!payload.body) {
      res.status(400).json({ error: "Letter body is required" });
      return;
    }

    if (payload.body.length < MIN_LETTER_BODY_LENGTH) {
      res.status(400).json({ error: "Letter body must be at least 500 characters" });
      return;
    }

    if (isHoneypotFilled(req.body)) {
      res.status(400).json({ error: "Invalid letter payload" });
      return;
    }

    if (formStartedAt && submittedAt && submittedAt - formStartedAt < MIN_LETTER_COMPOSE_MS) {
      res.status(429).json({ error: "Please spend a little more time before sending" });
      return;
    }

    const duplicateLetter = await findDuplicateLetter({ bodyHash, ipHash });
    if (duplicateLetter) {
      res.status(409).json({ error: "This letter was already sent recently" });
      return;
    }

    const blockedIp = await BlockedIp.findOne({ ipHash }).select("_id").lean();
    if (blockedIp) {
      res.status(403).json({ error: "Letter submissions are blocked" });
      return;
    }

    const letter = await Letter.create({
      ...payload,
      ipAddress,
      ipHash,
      bodyHash,
    });

    res.status(201).json(toPublicLetter(letter));
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ error: "Invalid letter payload" });
      return;
    }

    next(error);
  }
});

app.get("/api/admin/letters", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 1000);
    const recipient = RECIPIENTS.includes(req.query.recipient) ? req.query.recipient : undefined;
    const query = recipient ? { recipient } : {};
    const letters = await Letter.find(query).sort({ createdAt: -1 }).limit(limit).lean(false);

    res.json({
      letters: letters.map(toAdminLetter),
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/letters/:id", requireConfiguredAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: "Letter not found" });
      return;
    }

    const patch = normalizeAdminLetterPatch(req.body || {});

    if (Object.prototype.hasOwnProperty.call(patch, "body") && !patch.body) {
      res.status(400).json({ error: "Letter body is required" });
      return;
    }

    const letter = await Letter.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });

    if (!letter) {
      res.status(404).json({ error: "Letter not found" });
      return;
    }

    res.json(toAdminLetter(letter));
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ error: "Invalid letter payload" });
      return;
    }

    next(error);
  }
});

app.delete("/api/admin/letters/:id", requireConfiguredAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: "Letter not found" });
      return;
    }

    const result = await Letter.findByIdAndDelete(req.params.id);

    if (!result) {
      res.status(404).json({ error: "Letter not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/letters/by-ip/:ipHash", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const ipHash = String(req.params.ipHash || "").trim();

    if (!/^[a-f0-9]{64}$/i.test(ipHash)) {
      res.status(400).json({ error: "Invalid IP hash" });
      return;
    }

    const result = await Letter.deleteMany({ ipHash });
    res.json({ deletedCount: result.deletedCount || 0 });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/blocked-ips/:ipHash", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const ipHash = String(req.params.ipHash || "").trim();

    if (!/^[a-f0-9]{64}$/i.test(ipHash)) {
      res.status(400).json({ error: "Invalid IP hash" });
      return;
    }

    const ipAddress = String(req.body?.ipAddress || "").trim().slice(0, 64);
    const reason = String(req.body?.reason || "admin").trim().slice(0, 160);
    const blocked = await BlockedIp.findOneAndUpdate(
      { ipHash },
      { $set: { ipHash, ipAddress, reason } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    res.status(201).json({
      ipHash: blocked.ipHash,
      ipAddress: blocked.ipAddress,
      reason: blocked.reason,
      createdAt: blocked.createdAt,
      updatedAt: blocked.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/style.css", (req, res) => {
  res.set("Cache-Control", "public, max-age=2592000, immutable");
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(__dirname, "script.js"));
});

app.use(
  "/sounds",
  express.static(path.join(__dirname, "sounds"), {
    immutable: true,
    maxAge: "30d",
  }),
);

app.get("/admin", requireConfiguredAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.js", requireConfiguredAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.js"));
});

app.use(
  "/images",
  express.static(path.join(__dirname, "images"), {
    immutable: true,
    maxAge: "30d",
  }),
);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  if (error.message === "Origin not allowed") {
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`YUVA server is listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
