"use strict";
/* ROUTELESS API handlers — ONE implementation used by BOTH:
   - server.js (local full-stack server), and
   - the Vercel serverless functions in api/*.js (thin re-exports).
   All handlers are CORS-safe, validate input, and return proper codes. */

const store = require("./store");
const {sendJson, sendError, handleOptions, readBody, query} = require("./http");

function methodNotAllowed(req, res, allowed) {
  sendJson(res, 405, {ok: false, error: "Method " + req.method + " not allowed. Use: " + allowed.join(", ")});
}

async function health(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  sendJson(res, 200, {ok: true, service: "routeless-api", mode: "server", time: new Date().toISOString()});
}

async function students(req, res) {
  if (handleOptions(req, res)) return;
  const st = store.getState();
  if (req.method === "GET") {
    const id = query(req).get("id");
    if (id) {
      const s = store.studentById(st, id);
      if (!s) return sendError(res, 404, "Student not found: " + id);
      return sendJson(res, 200, {ok: true, student: s});
    }
    return sendJson(res, 200, {ok: true, total: st.students.length, students: st.students});
  }
  if (req.method === "POST") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendError(res, e.status || 400, e.message); }
    if (!body || typeof body.name !== "string" || body.name.trim().length < 2)
      return sendError(res, 400, "name is required (min 2 characters)");
    if (!body.village || store.VILLAGES.indexOf(body.village) < 0)
      return sendError(res, 400, "village must be one of: " + store.VILLAGES.join(", "));
    if (body.college && !store.COLLEGES.find(c => c.id === body.college))
      return sendError(res, 400, "college must be one of: " + store.COLLEGES.map(c => c.id).join(", "));
    const s = store.addStudent(st, body);
    return sendJson(res, 201, {ok: true, student: s});
  }
  return methodNotAllowed(req, res, ["GET", "POST"]);
}

async function bookings(req, res) {
  if (handleOptions(req, res)) return;
  const st = store.getState();
  if (req.method === "GET") {
    const list = store.activeJourneys(st);
    const summary = store.planSummary(st);
    return sendJson(res, 200, {ok: true, total: list.length, allocated: summary.allocated, waiting: summary.waiting, bookings: list});
  }
  if (req.method === "POST") {
    let body;
    try { body = await readBody(req); } catch (e) { return sendError(res, e.status || 400, e.message); }
    if (!body || !body.studentId || !store.studentById(st, body.studentId))
      return sendError(res, 400, "studentId is required and must match a registered student");
    if (body.village && store.VILLAGES.indexOf(body.village) < 0)
      return sendError(res, 400, "village must be one of: " + store.VILLAGES.join(", "));
    if (body.dest && !store.COLLEGES.find(c => c.id === body.dest))
      return sendError(res, 400, "dest must be one of: " + store.COLLEGES.map(c => c.id).join(", "));
    const j = store.addJourney(st, body);
    return sendJson(res, 201, {ok: true, booking: j, summary: store.planSummary(st)});
  }
  if (req.method === "DELETE") {
    let id = query(req).get("id");
    if (!id) {
      try { const body = await readBody(req); id = body && body.id; } catch (e) { /* fall through */ }
    }
    if (!id) return sendError(res, 400, "id is required (?id=J-2001 or JSON {id})");
    const j = store.cancelJourney(st, id);
    if (!j) return sendError(res, 404, "Booking not found: " + id);
    return sendJson(res, 200, {ok: true, booking: j, summary: store.planSummary(st)});
  }
  return methodNotAllowed(req, res, ["GET", "POST", "DELETE"]);
}

async function vehicles(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const st = store.getState();
  const list = st.vehicles.map(v => {
    const load = store.vehicleLoad(st, v.id);
    return {...v, load: load, free: Math.max(0, v.seats - load)};
  });
  return sendJson(res, 200, {ok: true, total: list.length,
    available: list.filter(v => v.status === "available" && v.verified).length,
    capacity: store.totalCapacity(st), vehicles: list});
}

async function demand(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const st = store.getState();
  return sendJson(res, 200, {ok: true, demand: store.demandSummary(st)});
}

async function allocate(req, res) {
  if (handleOptions(req, res)) return;
  const st = store.getState();
  if (req.method === "GET") {
    return sendJson(res, 200, {ok: true, summary: store.planSummary(st)});
  }
  if (req.method === "POST") {
    try { await readBody(req); } catch (e) { return sendError(res, e.status || 400, e.message); }
    const summary = store.runAllocation(st);
    const waiting = store.activeJourneys(st).filter(j => !j.vehicleId).map(j => ({
      id: j.id, name: j.name, village: j.village, destName: j.destName, type: j.type, examSoon: !!j.examSoon
    }));
    const overbooked = st.vehicles.filter(v => store.vehicleLoad(st, v.id) > v.seats).map(v => v.id);
    return sendJson(res, 200, {ok: true, summary: summary, waiting: waiting, overbooked: overbooked});
  }
  return methodNotAllowed(req, res, ["GET", "POST"]);
}

async function crisis(req, res) {
  if (handleOptions(req, res)) return;
  const st = store.getState();
  if (req.method === "GET") {
    return sendJson(res, 200, {ok: true, crisisActive: st.crisisActive, roadClosed: st.roadClosed,
      meta: st.crisisMeta, before: st.beforePlan, after: st.afterPlan, summary: store.planSummary(st)});
  }
  if (req.method === "POST") {
    let body = {};
    try { body = await readBody(req); } catch (e) { return sendError(res, e.status || 400, e.message); }
    const action = body.action || query(req).get("action");
    if (action === "reset") {
      const r = store.resetCrisis(st);
      if (!r.ok) return sendError(res, 400, r.error);
      return sendJson(res, 200, {ok: true, reset: true, plan: r.plan, crisisActive: false});
    }
    const r = store.simulateCrisis(st);
    if (!r.ok) return sendJson(res, 409, {ok: false, error: r.error, crisisActive: st.crisisActive, after: st.afterPlan});
    return sendJson(res, 200, {ok: true, crisisActive: true, meta: r.meta, before: r.before, after: r.after,
      unavailableBuses: r.unavailableBuses, roadClosed: r.roadClosed, floodedRoad: r.floodedRoad, alternateRoute: r.alternateRoute});
  }
  return methodNotAllowed(req, res, ["GET", "POST"]);
}

async function notifications(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const st = store.getState();
  const unread = st.notifications.filter(n => n.unread).length;
  return sendJson(res, 200, {ok: true, total: st.notifications.length, unread: unread, notifications: st.notifications});
}

async function notFound(req, res) {
  sendError(res, 404, "Unknown API route: " + req.url);
}

module.exports = {health, students, bookings, vehicles, demand, allocate, crisis, notifications, notFound};
