"use strict";
/* ROUTELESS — local full-stack server (plain Node.js http, zero dependencies).
   Serves the static frontend AND the same API routes as the Vercel
   functions, by reusing api/_lib/handlers.js — one implementation.
   Run:  node server.js   →  http://localhost:3000 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const handlers = require("./api/_lib/handlers");
const {sendError} = require("./api/_lib/http");

const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const ROUTES = {
  "/api/health": handlers.health,
  "/api/students": handlers.students,
  "/api/bookings": handlers.bookings,
  "/api/vehicles": handlers.vehicles,
  "/api/demand": handlers.demand,
  "/api/allocate": handlers.allocate,
  "/api/crisis": handlers.crisis,
  "/api/notifications": handlers.notifications
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    let p = u.pathname;
    if (p === "/") p = "/index.html";

    // API routes — same handlers as Vercel
    if (p.startsWith("/api/")) {
      const h = ROUTES[p];
      if (!h) return handlers.notFound(req, res);
      await h(req, res);
      return;
    }

    // Static files (never serve server code or dotfiles)
    if (p.startsWith("/api") || p === "/server.js" || p === "/package.json" || p.includes("..")) {
      return sendError(res, 404, "Not found");
    }
    const file = path.join(ROOT, decodeURIComponent(p));
    if (!file.startsWith(ROOT)) return sendError(res, 403, "Forbidden");
    fs.readFile(file, (err, data) => {
      if (err) return sendError(res, 404, "Not found: " + p);
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {"Content-Type": MIME[ext] || "application/octet-stream"});
      res.end(data);
    });
  } catch (e) {
    try { sendError(res, 500, "Server error"); } catch (_) { /* socket closed */ }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("ROUTELESS running at http://localhost:" + PORT);
  console.log("API: /api/health /api/students /api/bookings /api/vehicles /api/demand /api/allocate /api/crisis /api/notifications");
});
