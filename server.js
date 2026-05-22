require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const http = require("http");
const compression = require("compression");
const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
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
const chatAdminCookieName = "yuva_chat_admin";
const youtubeApiKey = process.env.YOUTUBE_API_KEY || "";
const defaultYuvaTvChannelId = process.env.YUVA_TV_CHANNEL_ID || "UCKO9BV0HNxQs5wttm1g2vQA";

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"));
    },
  },
  maxHttpBufferSize: 16 * 1024,
});

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

const chatMessageSchema = new mongoose.Schema(
  {
    nickname: { type: String, trim: true, maxlength: 32, default: "" },
    text: { type: String, trim: true, maxlength: 300, default: "" },
    userSessionId: { type: String, trim: true, maxlength: 96, default: "" },
    userId: { type: String, trim: true, maxlength: 96, default: "" },
    isAdmin: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    reported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    type: { type: String, enum: ["user", "system"], default: "user" },
    ipHash: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  },
);

chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ reported: 1, createdAt: -1 });
chatMessageSchema.index({ userSessionId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

const chatPresenceSchema = new mongoose.Schema(
  {
    userSessionId: { type: String, required: true, unique: true, trim: true, maxlength: 96 },
    nickname: { type: String, trim: true, maxlength: 32, default: "" },
    socketId: { type: String, trim: true, maxlength: 96, default: "" },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

chatPresenceSchema.index({ lastSeen: 1 });

const ChatPresence = mongoose.model("ChatPresence", chatPresenceSchema);

const chatBanSchema = new mongoose.Schema(
  {
    userSessionId: { type: String, required: true, unique: true, trim: true, maxlength: 96 },
    nickname: { type: String, trim: true, maxlength: 32, default: "" },
    reason: { type: String, trim: true, maxlength: 160, default: "admin" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const ChatBan = mongoose.model("ChatBan", chatBanSchema);

app.set("trust proxy", 1);
app.use(compression());
app.use(
  helmet({
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", "https://www.youtube.com", "https://www.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "https://i.ytimg.com"],
        mediaSrc: ["'self'", "https://p4rrot.com"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "https://www.youtube.com", "https://s.ytimg.com"],
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

function toPublicChatMessage(message) {
  return {
    id: message._id.toString(),
    nickname: message.nickname || "",
    text: message.deleted ? "" : message.text,
    createdAt: message.createdAt,
    isAdmin: Boolean(message.isAdmin),
    reported: Boolean(message.reported),
    type: message.type || "user",
  };
}

function toAdminChatMessage(message) {
  return {
    ...toPublicChatMessage(message),
    text: message.text,
    userSessionId: message.userSessionId || "",
    userId: message.userId || "",
    approved: Boolean(message.approved),
    deleted: Boolean(message.deleted),
    hidden: Boolean(message.hidden),
    reportCount: Number(message.reportCount || 0),
    updatedAt: message.updatedAt,
  };
}

function normalizeChatNickname(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

function normalizeChatText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function normalizeSessionId(value) {
  const sessionId = String(value || "").trim();
  if (/^[a-zA-Z0-9_-]{12,96}$/.test(sessionId)) return sessionId;
  return crypto.randomUUID();
}

function getVisibleChatQuery() {
  return {
    approved: true,
    deleted: false,
    hidden: false,
  };
}

const blockedChatPatterns = [
  /\b(o[cç]|orospu|siktir|amk|aq|pi[cç]|g[oö]t|yarrak|salak|aptal|gerizekal[ıi])\b/i,
  /\b(kill yourself|kys|die|threat|doxx)\b/i,
  /\b(sedo|iro|sedo'nun|iro'nun).{0,40}\b(aptal|salak|gerizekal[ıi]|nefret|[oö]l)\b/i,
];

function isBlockedChatText(text) {
  const normalized = String(text || "").toLocaleLowerCase("tr-TR");
  return blockedChatPatterns.some((pattern) => pattern.test(normalized));
}

async function createChatSystemMessage(text) {
  const message = await ChatMessage.create({
    type: "system",
    nickname: "YUVA",
    text,
    approved: true,
  });
  const payload = toPublicChatMessage(message);
  io.emit("chat:message", payload);
  return payload;
}

async function createUserChatMessage({ nickname, text, userSessionId, isAdmin = false, ipHash = "" }) {
  const normalizedNickname = normalizeChatNickname(nickname);
  const normalizedText = normalizeChatText(text);

  if (!normalizedNickname) {
    const error = new Error("Nickname is required");
    error.status = 400;
    throw error;
  }

  if (!normalizedText) {
    const error = new Error("Boş mesaj gönderilemez.");
    error.status = 400;
    throw error;
  }

  if (isBlockedChatText(normalizedText)) {
    const error = new Error("Bu mesaj YUVA'nın sakin alanına uygun değil.");
    error.status = 400;
    throw error;
  }

  const sessionId = normalizeSessionId(userSessionId);
  const ban = await ChatBan.findOne({ userSessionId: sessionId }).select("_id").lean();
  if (ban) {
    const error = new Error("Bu sohbet alanına erişimin kapalı.");
    error.status = 403;
    throw error;
  }

  const now = Date.now();
  const lastSentAt = chatSendTimes.get(sessionId) || 0;
  if (now - lastSentAt < 3000) {
    const error = new Error("Biraz yavaş canım");
    error.status = 429;
    throw error;
  }

  chatSendTimes.set(sessionId, now);
  const message = await ChatMessage.create({
    nickname: normalizedNickname,
    text: normalizedText,
    userSessionId: sessionId,
    userId: isAdmin ? adminUsername : "",
    isAdmin: Boolean(isAdmin),
    ipHash,
  });
  const publicMessage = toPublicChatMessage(message);
  io.to("yuva-chat").emit("chat:message", publicMessage);
  return publicMessage;
}

async function getOnlineCount() {
  const cutoff = new Date(Date.now() - 60 * 1000);
  await ChatPresence.deleteMany({ lastSeen: { $lt: cutoff } });
  return ChatPresence.countDocuments({ lastSeen: { $gte: cutoff } });
}

async function broadcastPresence() {
  const cutoff = new Date(Date.now() - 60 * 1000);
  await ChatPresence.deleteMany({ lastSeen: { $lt: cutoff } });
  const users = await ChatPresence.find({ lastSeen: { $gte: cutoff } })
    .sort({ joinedAt: 1 })
    .select("nickname userSessionId joinedAt lastSeen")
    .lean();
  io.emit("chat:presence", {
    onlineCount: users.length,
    users: users.map((user) => ({
      nickname: user.nickname,
      userSessionId: user.userSessionId,
      joinedAt: user.joinedAt,
      lastSeen: user.lastSeen,
    })),
  });
}

function getChatAdminCookieValue() {
  const secret = adminToken || adminPassword;
  if (!secret || !adminPassword) return "";
  return crypto.createHmac("sha256", secret).update(`chat:${adminUsername}:${adminPassword}`).digest("hex");
}

function isChatAdminAuthorized(req) {
  const cookies = parseCookies(req);
  const cookieValue = getChatAdminCookieValue();
  return Boolean(cookieValue && safeEqual(cookies[chatAdminCookieName] || "", cookieValue));
}

function isSocketChatAdmin(socket) {
  const cookies = Object.fromEntries(
    String(socket.handshake.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        if (index === -1) return [cookie, ""];
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      }),
  );
  const cookieValue = getChatAdminCookieValue();
  return Boolean(cookieValue && safeEqual(cookies[chatAdminCookieName] || "", cookieValue));
}

function requireChatAdmin(req, res, next) {
  if (isChatAdminAuthorized(req) || isAdminAuthorized(req)) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
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

function sanitizeYouTubeId(value, maxLength = 64) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, maxLength);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`YouTube request failed: ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/xml,text/xml,text/plain" },
  });
  if (!response.ok) throw new Error(`YouTube feed failed: ${response.status}`);
  return response.text();
}

async function fetchYuvaTvVideosFromDataApi(channelId) {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", youtubeApiKey);
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("part", "id");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "50");

  const data = await fetchJson(searchUrl);
  return [...new Set((data.items || []).map((item) => sanitizeYouTubeId(item.id?.videoId, 24)).filter(Boolean))];
}

async function fetchYuvaTvVideosFromFeed(channelId) {
  const feedUrl = new URL("https://www.youtube.com/feeds/videos.xml");
  feedUrl.searchParams.set("channel_id", channelId);
  const xml = await fetchText(feedUrl);
  return [...new Set(Array.from(xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)).map((match) => sanitizeYouTubeId(match[1], 24)).filter(Boolean))];
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

app.get("/api/chat/messages", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 50);
    const before = String(req.query.before || "");
    const query = getVisibleChatQuery();

    if (mongoose.Types.ObjectId.isValid(before)) {
      const beforeMessage = await ChatMessage.findById(before).select("createdAt").lean();
      if (beforeMessage?.createdAt) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const messages = await ChatMessage.find(query).sort({ createdAt: -1 }).limit(limit).lean(false);
    res.json({
      messages: messages.reverse().map(toPublicChatMessage),
      onlineCount: await getOnlineCount(),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/messages", async (req, res, next) => {
  try {
    const userSessionId = normalizeSessionId(req.body?.userSessionId);
    const ipHash = hashIp(getClientIp(req));
    const message = await createUserChatMessage({
      nickname: req.body?.nickname,
      text: req.body?.text,
      userSessionId,
      isAdmin: isChatAdminAuthorized(req) || isAdminAuthorized(req),
      ipHash,
    });

    await ChatPresence.findOneAndUpdate(
      { userSessionId },
      {
        $set: {
          userSessionId,
          nickname: normalizeChatNickname(req.body?.nickname),
          lastSeen: new Date(),
        },
        $setOnInsert: { joinedAt: new Date() },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    await broadcastPresence();
    res.status(201).json({ message });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.post("/api/chat/report/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const message = await ChatMessage.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      {
        $set: { reported: true },
        $inc: { reportCount: 1 },
      },
      { new: true },
    );

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    if (message.reportCount >= 3) {
      message.hidden = true;
      await message.save();
      io.emit("chat:moderated", { id: message._id.toString(), hidden: true });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat/admin/login", loginLimiter, (req, res) => {
  const email = String(req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const configuredEmail = String(process.env.ADMIN_EMAIL || adminUsername || "").trim();
  const emailMatches = Boolean(configuredEmail && safeEqual(email, configuredEmail));

  if (!adminPassword || !emailMatches || !safeEqual(password, adminPassword)) {
    res.status(403).json({ error: "Bu alana erişim yetkin yok." });
    return;
  }

  res.cookie(chatAdminCookieName, getChatAdminCookieValue(), {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: req.secure || req.get("x-forwarded-proto") === "https",
  });
  res.json({ isAdmin: true, displayName: adminUsername, email: configuredEmail });
});

app.post("/api/chat/admin/logout", (req, res) => {
  res.clearCookie(chatAdminCookieName);
  res.json({ ok: true });
});

app.get("/api/chat/admin/me", (req, res) => {
  res.json({
    isAdmin: isChatAdminAuthorized(req) || isAdminAuthorized(req),
  });
});

app.get("/api/yuva-tv/videos", async (req, res, next) => {
  try {
    const channelId = sanitizeYouTubeId(req.query.channelId || defaultYuvaTvChannelId, 64);
    const videoIds = youtubeApiKey
      ? await fetchYuvaTvVideosFromDataApi(channelId)
      : await fetchYuvaTvVideosFromFeed(channelId);

    res.json({ channelId, videoIds });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/chat/messages", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const filter = String(req.query.filter || "");
    const query = filter === "reported" ? { reported: true } : {};
    const messages = await ChatMessage.find(query).sort({ createdAt: -1 }).limit(200).lean(false);
    res.json({ messages: messages.map(toAdminChatMessage) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/chat/messages/:id", requireConfiguredAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const patch = {};
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "hidden")) patch.hidden = Boolean(req.body.hidden);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "approved")) patch.approved = Boolean(req.body.approved);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "reported")) patch.reported = Boolean(req.body.reported);
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "deleted")) patch.deleted = Boolean(req.body.deleted);

    const message = await ChatMessage.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    io.emit("chat:moderated", toPublicChatMessage(message));
    res.json(toAdminChatMessage(message));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/chat/messages/:id", requireConfiguredAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const message = await ChatMessage.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    io.emit("chat:moderated", { id: message._id.toString(), deleted: true });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/chat/messages/by-session/:userSessionId", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const userSessionId = String(req.params.userSessionId || "").trim();
    if (!/^[a-zA-Z0-9_-]{12,96}$/.test(userSessionId)) {
      res.status(400).json({ error: "Invalid session" });
      return;
    }

    const messages = await ChatMessage.find({ userSessionId }).select("_id").lean();
    const result = await ChatMessage.updateMany({ userSessionId }, { $set: { deleted: true, hidden: true } });
    messages.forEach((message) => {
      io.emit("chat:moderated", { id: message._id.toString(), deleted: true });
    });
    res.json({ deletedCount: result.modifiedCount || 0 });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/chat/bans", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const userSessionId = normalizeSessionId(req.body?.userSessionId);
    const nickname = normalizeChatNickname(req.body?.nickname);
    const reason = String(req.body?.reason || "admin").trim().slice(0, 160);
    const ban = await ChatBan.findOneAndUpdate(
      { userSessionId },
      { $set: { userSessionId, nickname, reason } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    await ChatPresence.deleteOne({ userSessionId });
    io.emit("chat:banned", { userSessionId });
    await broadcastPresence();
    res.status(201).json(ban);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/chat/presence", requireConfiguredAdmin, async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 60 * 1000);
    const users = await ChatPresence.find({ lastSeen: { $gte: cutoff } }).sort({ joinedAt: 1 }).lean();
    res.json({ users });
  } catch (error) {
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

app.use("/sounds", (req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

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

app.use("/images", (req, res) => {
  res.status(404).type("text/plain").send("Not found");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const chatSendTimes = new Map();
const socketSessions = new Map();

io.on("connection", (socket) => {
  socket.on("chat:join", async (payload = {}, ack) => {
    try {
      const nickname = normalizeChatNickname(payload.nickname);
      const userSessionId = normalizeSessionId(payload.userSessionId);
      const isAdmin = isSocketChatAdmin(socket);

      if (!nickname) {
        ack?.({ ok: false, error: "Nickname is required" });
        return;
      }

      const ban = await ChatBan.findOne({ userSessionId }).select("_id").lean();
      if (ban) {
        ack?.({ ok: false, error: "Bu sohbet alanına erişimin kapalı." });
        return;
      }

      await ChatPresence.findOneAndUpdate(
        { userSessionId },
        {
          $set: {
            userSessionId,
            nickname,
            socketId: socket.id,
            lastSeen: new Date(),
          },
          $setOnInsert: { joinedAt: new Date() },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );

      socketSessions.set(socket.id, { userSessionId, nickname, isAdmin });
      socket.join("yuva-chat");
      ack?.({ ok: true, userSessionId, isAdmin });
      await createChatSystemMessage("birisi yuvaya katıldı.");
      await broadcastPresence();
    } catch (error) {
      console.error(error);
      ack?.({ ok: false, error: "Sohbete katılamadın." });
    }
  });

  socket.on("chat:typing", async (payload = {}) => {
    const session = socketSessions.get(socket.id);
    if (!session) return;
    socket.to("yuva-chat").emit("chat:typing", {
      userSessionId: session.userSessionId,
      typing: Boolean(payload.typing),
    });
  });

  socket.on("chat:heartbeat", async () => {
    const session = socketSessions.get(socket.id);
    if (!session) return;
    await ChatPresence.updateOne({ userSessionId: session.userSessionId }, { $set: { lastSeen: new Date(), socketId: socket.id } });
    await broadcastPresence();
  });

  socket.on("chat:send", async (payload = {}, ack) => {
    try {
      const session = socketSessions.get(socket.id);
      if (!session) {
        ack?.({ ok: false, error: "Önce sohbete katıl." });
        return;
      }

      const ipHash = hashIp(getClientIp({ get: (name) => socket.handshake.headers[String(name).toLowerCase()] || "", ip: socket.handshake.address, socket }));
      const publicMessage = await createUserChatMessage({
        nickname: session.nickname,
        text: payload.text,
        userSessionId: session.userSessionId,
        isAdmin: Boolean(session.isAdmin),
        ipHash,
      });
      ack?.({ ok: true, message: publicMessage });
    } catch (error) {
      console.error(error);
      ack?.({ ok: false, error: error.status ? error.message : "Mesaj gönderilemedi." });
    }
  });

  socket.on("disconnect", async () => {
    const session = socketSessions.get(socket.id);
    socketSessions.delete(socket.id);
    if (!session) return;

    try {
      await ChatPresence.deleteOne({ userSessionId: session.userSessionId, socketId: socket.id });
      await createChatSystemMessage("birisi sessizce uçtu.");
      await broadcastPresence();
    } catch (error) {
      console.error(error);
    }
  });
});

setInterval(() => {
  broadcastPresence().catch((error) => console.error(error));
}, 30 * 1000);

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
  server.listen(port, () => {
    console.log(`YUVA server is listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
