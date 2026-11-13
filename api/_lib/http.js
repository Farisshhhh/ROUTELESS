"use strict";
/* Tiny HTTP helpers shared by server.js and the Vercel functions. */

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function sendJson(res, status, obj) {
  cors(res);
  const body = JSON.stringify(obj);
  res.writeHead(status, {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(body)});
  res.end(body);
}
function sendError(res, status, msg) { sendJson(res, status, {ok: false, error: msg}); }

// Returns true if this was an OPTIONS preflight (already answered).
function handleOptions(req, res) {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); res.end(); return true; }
  return false;
}

// Reads and parses a JSON body. Resolves {} for an empty body.
// Rejects with {status:400} on malformed JSON or oversize body (>256 KB).
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 256 * 1024) reject({status: 400, message: "Request body too large"});
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject({status: 400, message: "Malformed JSON body"}); }
    });
    req.on("error", () => reject({status: 400, message: "Could not read request body"}));
  });
}

function query(req) {
  try { return new URL(req.url, "http://localhost").searchParams; }
  catch (e) { return new URLSearchParams(); }
}

module.exports = {cors, sendJson, sendError, handleOptions, readBody, query};
