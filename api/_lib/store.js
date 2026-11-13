"use strict";
/* ROUTELESS — shared demo store + engine (Node.js, zero dependencies).
   SAME dataset and SAME allocation/crisis logic as the frontend
   (index.html inline script). Single source of truth for server.js
   and the Vercel functions in api/. Demo data only, held in memory. */

const VILLAGES = ["Hulikatti", "Belavadi", "Kadur", "Sakleshpur", "Holenarasipura", "Arsikere"];
const PICKUPS = {"Hulikatti": "Hulikatti Katte", "Belavadi": "Belavadi Bus Stop", "Kadur": "Kadur Main Road", "Sakleshpur": "Sakleshpur Circle", "Holenarasipura": "Holenarasipura Gate", "Arsikere": "Arsikere Town Stop"};
const COLLEGES = [
  {id: "C1", name: "Government Degree College, Hassan", short: "GDC Hassan", place: "Hassan"},
  {id: "C2", name: "Sri Channakeshava PU College, Belur", short: "SCPU Belur", place: "Belur"},
  {id: "C3", name: "Karnataka Rural Polytechnic, Arsikere", short: "KRP Arsikere", place: "Arsikere"}
];
const FIRST = ["Anu", "Arjun", "Bhavana", "Chandan", "Deepa", "Farhan", "Gowri", "Harish", "Ishita", "Kiran", "Lakshmi", "Manoj", "Nandini", "Pavan", "Priya", "Rahul", "Sana", "Tejas", "Uma", "Vinay", "Asha", "Dinesh", "Meera", "Nikhil", "Rekha", "Suresh", "Divya", "Kavya", "Ravi", "Shreya"];
const LAST = ["Gowda", "Shetty", "Rai", "Hegde", "Patil", "Naik", "Kumar", "Reddy", "Sharma", "Iyer", "Nair", "Jain", "Kulkarni", "Desai", "Bhat", "Rao", "Murthy", "Pillai", "Verma", "Singh"];
const COURSES = ["BSc I Year", "BSc II Year", "BCom I Year", "BCom II Year", "BA II Year", "Diploma II Year", "PUC II Science", "PUC I Commerce"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "English", "Kannada", "Computer Science", "Commerce", "Biology"];

function hashRand(seed) { let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function pick(arr, i) { return arr[Math.floor(hashRand(i * 3 + 7) * arr.length) % arr.length]; }
function pad(n) { return String(n).padStart(2, "0"); }
function tomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function todayISO() { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function timePlus(t, mins) { const [h, m] = t.split(":").map(Number); const d = new Date(); d.setHours(h, m + mins, 0, 0); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

/* ---------- Seed data (identical to frontend) ---------- */
function seedStudents() {
  const out = [];
  for (let i = 0; i < 120; i++) {
    const v = VILLAGES[i % 6];
    const c = COLLEGES[i % 3];
    const examSoon = (i % 9 === 0);
    const examToday = !examSoon && (i % 7 === 0);
    out.push({
      id: "STU-" + String(1001 + i), name: FIRST[i % 30] + " " + LAST[(i * 7) % 20],
      college: c.id, collegeName: c.short, course: COURSES[i % 8], village: v, pickup: PICKUPS[v],
      phone: "+91 98" + String(10000000 + ((i * 7919) % 89999999)).slice(0, 8),
      parent: "+91 99" + String(10000000 + ((i * 104729) % 89999999)).slice(0, 8),
      access: (i % 17 === 0) ? "wheelchair" : ((i % 23 === 0) ? "visual" : "none"),
      examSoon: examSoon, examToday: examToday,
      examTime: examSoon ? "14:00" : (examToday ? "15:30" : ""),
      examSubject: examSoon || examToday ? SUBJECTS[i % 8] : ""
    });
  }
  return out;
}
function seedVehicles() {
  return [
    {id: "BUS-G01", name: "Govt Bus KA-13-101", type: "Government bus", operator: "KSRTC (Govt)", seats: 40, driver: "Ramesh Kumar", phone: "+91 98450 11101", coverage: ["Hulikatti", "Belavadi", "Kadur"], destinations: ["C1", "C2"], status: "available", verified: true, route: "Hulikatti → Belavadi → Kadur → Hassan", usesFloodedRoad: true, reg: "KA-13-101"},
    {id: "BUS-G02", name: "Govt Bus KA-13-102", type: "Government bus", operator: "KSRTC (Govt)", seats: 40, driver: "Suresh Naik", phone: "+91 98450 11102", coverage: ["Sakleshpur", "Holenarasipura", "Arsikere"], destinations: ["C1", "C3"], status: "available", verified: true, route: "Sakleshpur → Holenarasipura → Arsikere", usesFloodedRoad: false, reg: "KA-13-102"},
    {id: "BUS-G03", name: "Govt Bus KA-13-103", type: "Government bus", operator: "KSRTC (Govt)", seats: 40, driver: "Manjunath G", phone: "+91 98450 11103", coverage: ["Hulikatti", "Belavadi", "Sakleshpur"], destinations: ["C1", "C2", "C3"], status: "available", verified: true, route: "Hulikatti → Belavadi → Sakleshpur → Belur", usesFloodedRoad: true, reg: "KA-13-103"},
    {id: "BUS-G04", name: "Govt Bus KA-13-104", type: "Government bus", operator: "KSRTC (Govt)", seats: 40, driver: "Anitha R", phone: "+91 98450 11104", coverage: ["Kadur", "Holenarasipura", "Arsikere"], destinations: ["C1", "C3"], status: "available", verified: true, route: "Kadur → Holenarasipura → Arsikere", usesFloodedRoad: false, reg: "KA-13-104"},
    {id: "PVT-M01", name: "Minibus — Gowda Travels", type: "Private minibus", operator: "Gowda Travels (approved)", seats: 25, driver: "Pavan Gowda", phone: "+91 98450 22201", coverage: ["Hulikatti", "Kadur", "Arsikere"], destinations: ["C1", "C2", "C3"], status: "available", verified: true, route: "Hulikatti → Kadur → Arsikere", usesFloodedRoad: false, reg: "KA-14-M-2210"},
    {id: "PVT-T01", name: "Tempo — Belur Cabs", type: "Private tempo", operator: "Belur Cabs (approved)", seats: 15, driver: "Imran Khan", phone: "+91 98450 22202", coverage: ["Belavadi", "Sakleshpur"], destinations: ["C2", "C1"], status: "available", verified: true, route: "Belavadi → Sakleshpur → Belur", usesFloodedRoad: true, reg: "KA-14-T-3301"},
    {id: "PVT-A01", name: "Auto — Ravi Auto", type: "Private auto", operator: "Ravi Auto (approved)", seats: 6, driver: "Ravi K", phone: "+91 98450 22203", coverage: ["Hulikatti", "Belavadi"], destinations: ["C1", "C2"], status: "available", verified: true, route: "Hulikatti ↔ Belavadi shuttle", usesFloodedRoad: true, reg: "KA-14-A-4410"},
    {id: "PVT-A02", name: "Auto — Lakshmi Auto", type: "Private auto", operator: "Lakshmi Auto (approved)", seats: 6, driver: "Lakshmi S", phone: "+91 98450 22204", coverage: ["Kadur", "Holenarasipura"], destinations: ["C1", "C3"], status: "available", verified: true, route: "Kadur ↔ Holenarasipura shuttle", usesFloodedRoad: false, reg: "KA-14-A-4411"}
  ];
}
function seedJourneys(students) {
  const out = []; const d = tomorrowISO();
  students.forEach((s, i) => {
    if (i >= 118) return; // 118 of 120 registered for tomorrow
    const type = s.examSoon || s.examToday ? "exam" : "class";
    out.push({id: "J-" + String(2001 + i), studentId: s.id, name: s.name, village: s.village, pickup: s.pickup,
      dest: s.college, destName: s.collegeName, date: d, arrival: "08:30", type: type, examTime: s.examTime || "",
      examSubject: s.examSubject || "", access: s.access, status: "registered", vehicleId: null, pickupTime: "", eta: "", altRoute: false, surge: false});
  });
  return out;
}
function seedState() {
  const students = seedStudents();
  const vehicles = seedVehicles();
  const journeys = seedJourneys(students);
  return {
    students: students, vehicles: vehicles, journeys: journeys,
    roadClosed: false, crisisActive: false, preCrisis: null, beforePlan: null, afterPlan: null, crisisMeta: null,
    notifications: [
      {t: "System", msg: "Welcome to ROUTELESS demo. 118 journeys registered for tomorrow.", time: "09:00", unread: true},
      {t: "Transport", msg: "All 8 vehicles available. Total capacity 212 seats.", time: "09:05", unread: true}
    ],
    activity: [{time: "09:05", text: "Allocation engine ran — 118 journeys assigned."}, {time: "08:40", text: "118 students registered for tomorrow."}, {time: "08:15", text: "Provider Gowda Travels verified."}],
    requests: [
      {id: "RQ-1", org: "Belur Cabs", detail: "Tempo requested for Belavadi → Belur, 12 seats, tomorrow", status: "pending"},
      {id: "RQ-2", org: "Gowda Travels", detail: "Minibus requested for Kadur → Hassan, 20 seats, tomorrow", status: "pending"},
      {id: "RQ-3", org: "Ravi Auto", detail: "Auto shuttle Hulikatti ↔ Belavadi, 6 seats, tomorrow", status: "accepted"}
    ],
    exams: [
      {id: "EX-1", title: "Physics — Mid Semester", subject: "Physics", datetime: "2026-11-14T10:00", duration: 60, marks: 50, inst: "Answer all questions. No notes.", status: "published"},
      {id: "EX-2", title: "Mathematics — Unit Test", subject: "Mathematics", datetime: "2026-11-14T14:00", duration: 45, marks: 30, inst: "Show working for all problems.", status: "published"}
    ]
  };
}

/* ---------- Helpers (pure, take state) ---------- */
function vehicleById(st, id) { return st.vehicles.find(v => v.id === id) || null; }
function studentById(st, id) { return st.students.find(s => s.id === id) || null; }
function journeyById(st, id) { return st.journeys.find(j => j.id === id) || null; }
function activeJourneys(st) { return st.journeys.filter(j => j.status !== "cancelled"); }
function availableVehicles(st) { return st.vehicles.filter(v => v.status === "available" && v.verified); }
function totalCapacity(st) { return availableVehicles(st).reduce((a, v) => a + v.seats, 0); }
function vehicleLoad(st, vid) { return activeJourneys(st).filter(j => j.vehicleId === vid).length; }
function travelMins(j) { const base = {"Hulikatti": 55, "Belavadi": 45, "Kadur": 40, "Sakleshpur": 60, "Holenarasipura": 50, "Arsikere": 35}; let m = base[j.village] || 45; if (j.altRoute) m += 25; return m; }
function notify(st, title, msg) { st.notifications.unshift({t: title, msg: msg, time: new Date().toTimeString().slice(0, 5), unread: true}); }

/* ---------- ALLOCATION ENGINE (identical logic to frontend) ---------- */
function priorityScore(j) {
  if (j.type === "exam" && j.examSoon) return 0;
  if (j.type === "exam") return 1;
  if (j.access && j.access !== "none") return 2;
  if (j.arrival <= "08:30") return 3;
  return 4;
}
function compatible(v, j) { return v.coverage.indexOf(j.village) >= 0 && v.destinations.indexOf(j.dest) >= 0; }
function runAllocation(st) {
  const avail = availableVehicles(st);
  const remaining = {}; avail.forEach(v => remaining[v.id] = v.seats);
  const list = activeJourneys(st).slice().sort((a, b) => {
    const d = priorityScore(a) - priorityScore(b); if (d !== 0) return d;
    if (a.arrival !== b.arrival) return a.arrival < b.arrival ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  list.forEach(j => {
    j.vehicleId = null; j.pickupTime = ""; j.eta = ""; j.altRoute = false;
    if (j.status === "arrived" || j.status === "started" || j.status === "pickup") return;
    j.status = "registered";
  });
  activeJourneys(st).forEach(j => {
    if ((j.status === "arrived" || j.status === "started" || j.status === "pickup") && j.vehicleId && remaining[j.vehicleId] > 0) { remaining[j.vehicleId]--; }
    else if (j.status === "arrived" || j.status === "started" || j.status === "pickup") { j.vehicleId = null; j.status = "waiting"; }
  });
  list.forEach(j => {
    if (j.status === "arrived" || j.status === "started" || j.status === "pickup") return;
    if (st.roadClosed && (j.village === "Hulikatti" || j.village === "Belavadi")) j.altRoute = true;
    const cands = avail.filter(v => compatible(v, j) && remaining[v.id] > 0)
      .sort((a, b) => remaining[a.id] - remaining[b.id]); // best-fit: fill smallest suitable vehicle first
    if (cands.length) {
      const v = cands[0]; j.vehicleId = v.id; remaining[v.id]--;
      j.pickupTime = timePlus(j.arrival, -travelMins(j)); j.eta = j.arrival; j.status = "allocated";
    } else {
      j.vehicleId = null; j.status = "waiting";
    }
  });
  return planSummary(st);
}
function planSummary(st) {
  const js = activeJourneys(st);
  const allocated = js.filter(j => j.vehicleId).length;
  const waiting = js.length - allocated;
  const cap = totalCapacity(st);
  const perVehicle = {}; st.vehicles.forEach(v => perVehicle[v.id] = vehicleLoad(st, v.id));
  const examJs = js.filter(j => j.type === "exam");
  return {total: js.length, allocated: allocated, waiting: waiting, capacity: cap, used: allocated,
    seatsShort: Math.max(0, js.length - cap), examTotal: examJs.length,
    examAllocated: examJs.filter(j => j.vehicleId).length,
    examSoonTotal: js.filter(j => j.type === "exam" && j.examSoon).length,
    examSoonAllocated: js.filter(j => j.type === "exam" && j.examSoon && j.vehicleId).length,
    perVehicle: perVehicle,
    arrived: js.filter(j => j.status === "arrived").length};
}
function demandSummary(st) {
  const js = activeJourneys(st);
  const byVillage = {}; const byDest = {};
  js.forEach(j => { byVillage[j.village] = (byVillage[j.village] || 0) + 1; byDest[j.destName] = (byDest[j.destName] || 0) + 1; });
  const cap = totalCapacity(st);
  return {total: js.length, byVillage: byVillage, byDestination: byDest,
    requiredSeats: js.length, capacity: cap, seatsShort: Math.max(0, js.length - cap),
    vehiclesAvailable: availableVehicles(st).length, vehiclesTotal: st.vehicles.length,
    examTotal: js.filter(j => j.type === "exam").length,
    examSoonTotal: js.filter(j => j.type === "exam" && j.examSoon).length,
    roadClosed: st.roadClosed, crisisActive: st.crisisActive, date: tomorrowISO()};
}

/* ---------- CRISIS SIMULATION (identical logic to frontend) ---------- */
function simulateCrisis(st) {
  if (st.crisisActive) return {ok: false, error: "Crisis is already active. Reset it first to run again."};
  st.preCrisis = JSON.parse(JSON.stringify({students: st.students, vehicles: st.vehicles, journeys: st.journeys, roadClosed: st.roadClosed}));
  st.beforePlan = planSummary(st);
  ["BUS-G01", "BUS-G02"].forEach(id => { const v = vehicleById(st, id); if (v) { v.status = "unavailable"; v.statusNote = "Technical issue — crisis"; } });
  st.roadClosed = true;
  const base = st.journeys.length;
  const surgeN = Math.round(base * 0.40);
  for (let i = 0; i < surgeN; i++) {
    const v = VILLAGES[(i + 2) % 6];
    const c = COLLEGES[(i + 1) % 3];
    const examSoon = (i % 6 === 0);
    const sid = "STU-9" + String(100 + i);
    if (!studentById(st, sid)) {
      st.students.push({id: sid, name: pick(FIRST, i + 50) + " " + pick(LAST, i + 31), college: c.id, collegeName: c.short,
        course: COURSES[(i + 2) % 8], village: v, pickup: PICKUPS[v], phone: "+91 98XXX XXXXX", parent: "+91 99XXX XXXXX",
        access: (i % 15 === 0) ? "wheelchair" : "none", examSoon: examSoon, examToday: examSoon || (i % 5 === 0),
        examTime: examSoon ? "14:00" : "15:30", examSubject: SUBJECTS[i % 8]});
    }
    st.journeys.push({id: "J-S" + String(3001 + i), studentId: sid, name: studentById(st, sid).name, village: v, pickup: PICKUPS[v],
      dest: c.id, destName: c.short, date: tomorrowISO(), arrival: "08:30", type: (examSoon || i % 5 === 0) ? "exam" : "class",
      examTime: examSoon ? "14:00" : "", examSubject: SUBJECTS[i % 8], access: (i % 15 === 0) ? "wheelchair" : "none",
      status: "registered", vehicleId: null, pickupTime: "", eta: "", altRoute: false, surge: true, examSoon: examSoon});
  }
  st.journeys.forEach(j => { if (j.examSoon === undefined) { const s = studentById(st, j.studentId); j.examSoon = s ? s.examSoon : false; } });
  runAllocation(st);
  st.afterPlan = planSummary(st);
  st.crisisActive = true;
  const beforeMap = {}; st.preCrisis.journeys.forEach(j => beforeMap[j.id] = j.vehicleId);
  let affected = 0, reallocated = 0;
  activeJourneys(st).forEach(j => {
    const changed = j.surge || j.altRoute || beforeMap[j.id] !== j.vehicleId;
    if (changed) { affected++; if (j.vehicleId) reallocated++; }
  });
  st.crisisMeta = {affected: affected, reallocated: reallocated, surgeAdded: surgeN};
  notify(st, "🚨 CRISIS", "2 govt buses unavailable, demand +40% (" + surgeN + " extra journeys), Hulikatti–Belavadi road flooded. Re-allocation complete.");
  notify(st, "🎓 Exams", "Exam students prioritised: " + st.afterPlan.examSoonAllocated + " of " + st.afterPlan.examSoonTotal + " exam-within-2h students have a vehicle.");
  notify(st, "🚌 Operators", "Providers notified: " + availableVehicles(st).length + " vehicles in service, " + st.afterPlan.waiting + " students still awaiting transport.");
  notify(st, "🏫 Colleges", "Expected exam arrivals updated. " + st.afterPlan.waiting + " students may be late — online exam/class link offered.");
  return {ok: true, meta: st.crisisMeta, before: st.beforePlan, after: st.afterPlan,
    unavailableBuses: ["BUS-G01", "BUS-G02"], roadClosed: true, floodedRoad: "Hulikatti–Belavadi main road",
    alternateRoute: "Kadur bypass (+25 min, pickups moved earlier)"};
}
function resetCrisis(st) {
  if (!st.crisisActive && !st.preCrisis) return {ok: false, error: "No crisis is active."};
  if (st.preCrisis) {
    st.students = st.preCrisis.students; st.vehicles = st.preCrisis.vehicles; st.journeys = st.preCrisis.journeys; st.roadClosed = st.preCrisis.roadClosed;
  }
  st.crisisActive = false; st.preCrisis = null; st.beforePlan = null; st.afterPlan = null; st.crisisMeta = null;
  st.vehicles.forEach(v => { if (v.statusNote) delete v.statusNote; });
  notify(st, "✅ Crisis reset", "Normal operations restored. Original plan re-applied.");
  const plan = runAllocation(st);
  return {ok: true, plan: plan};
}

/* ---------- Mutations for the API ---------- */
function addStudent(st, data) {
  const id = "STU-" + (3000 + st.students.length);
  const college = COLLEGES.find(c => c.id === data.college) || COLLEGES[0];
  const s = {id: id, name: data.name, college: college.id, collegeName: college.short,
    course: data.course || COURSES[0], village: data.village, pickup: PICKUPS[data.village] || data.pickup || "",
    phone: data.phone || "", parent: data.parent || "", access: data.access || "none",
    examSoon: false, examToday: false, examTime: "", examSubject: ""};
  st.students.push(s);
  return s;
}
function addJourney(st, data) {
  const s = studentById(st, data.studentId);
  const college = COLLEGES.find(c => c.id === (data.dest || s.college)) || COLLEGES[0];
  const id = "J-" + (9000 + st.journeys.length);
  const j = {id: id, studentId: s.id, name: s.name, village: data.village || s.village,
    pickup: data.pickup || PICKUPS[data.village || s.village] || s.pickup,
    dest: college.id, destName: college.short, date: data.date || tomorrowISO(),
    arrival: data.arrival || "08:30", type: data.type === "exam" ? "exam" : "class",
    examTime: data.examTime || "", examSubject: data.examSubject || "", access: s.access,
    status: "registered", vehicleId: null, pickupTime: "", eta: "", altRoute: false, surge: false,
    examSoon: !!(data.examSoon || s.examSoon)};
  st.journeys.push(j);
  runAllocation(st);
  return j;
}
function cancelJourney(st, id) {
  const j = journeyById(st, id);
  if (!j) return null;
  j.status = "cancelled"; j.vehicleId = null; j.pickupTime = ""; j.eta = "";
  runAllocation(st);
  return j;
}

/* ---------- State: fresh state mirrors frontend init exactly ---------- */
function createState() {
  const st = seedState();
  // Backfill examSoon on journeys from students (as frontend init does)
  st.journeys.forEach(j => { if (j.examSoon === undefined) { const s = studentById(st, j.studentId); j.examSoon = s ? !!s.examSoon : false; } });
  // Fleet compatibility fix (as frontend init does)
  const g4 = vehicleById(st, "BUS-G04"); if (g4 && g4.destinations.indexOf("C2") < 0) g4.destinations.push("C2");
  const a2 = vehicleById(st, "PVT-A02"); if (a2 && a2.destinations.indexOf("C2") < 0) a2.destinations.push("C2");
  runAllocation(st);
  return st;
}
let _state = null;
function getState() { if (!_state) _state = createState(); return _state; }
function resetState() { _state = createState(); return _state; }

module.exports = {
  VILLAGES, PICKUPS, COLLEGES, COURSES, SUBJECTS,
  tomorrowISO, todayISO,
  createState, getState, resetState,
  vehicleById, studentById, journeyById, activeJourneys, availableVehicles,
  totalCapacity, vehicleLoad, runAllocation, planSummary, demandSummary,
  simulateCrisis, resetCrisis, addStudent, addJourney, cancelJourney
};
