# ROUTELESS — No student misses class because transport failed

**Prompt Battle, Aerophilia 2K26 · Challenge: ROUTELESS — The Last Mile**

An intelligent rural student mobility + digital campus platform. Full-stack demo:
a simple, calm frontend (one HTML file, works offline) + a real zero-dependency
Node.js backend (local server + Vercel serverless functions, one shared engine).
All data is clearly labelled **demo data**. No secrets, no paid services.

## What it is

ROUTELESS connects students, colleges, government buses, approved private
providers, teachers and parents into one system:

**Travel**
1. **Command Center** — live demand, capacity, fleet, alerts, exams, activity (all computed from the data model)
2. **Book My Ride** — student profiles + next-day journey booking with validation, confirmation, cancel
3. **Seat Allocation** — real seat allocation respecting capacity, route compatibility, arrival time, exam priority, accessibility; honest shortfall display
4. **Vehicles & Providers** — provider registration + admin verification, accept/reject requests, breakdown reporting
5. **My Journey** — status timeline, SOS, opt-in location only (simulated positions labelled SIMULATED)

**Campus**
6. **Digital Campus** — college profiles, student academic dashboard, teacher publishing (class/material/announcement/assignment), absence-risk list
7. **Attendance** — teacher sessions + codes, student check-in, optional permission-based location/photo, manual verification, audit trail
8. **Live Classes** — class schedule, demo meeting room with a clear integration point for a real video provider, materials, assignments
9. **Exams** — create/take exams, timer, explicit consent for camera/mic/screen-share, visible monitoring indicator, session event log

**Crisis**
10. **Crisis Control Center** — the surprise-hurdle simulation (see below)

## Folder structure

```
routeless-final/
├── index.html            # The whole frontend (works on its own, even offline)
├── server.js             # Local full-stack server (plain Node http, no deps)
├── package.json          # { "start": "node server.js" } — zero dependencies
├── vercel.json           # Minimal Vercel config (static root + /api functions)
├── .gitignore
├── README.md             # This file
├── AGENT_LOG.md          # Prompt log for the judges
└── api/
    ├── _lib/
    │   ├── store.js      # Shared source of truth: demo dataset + allocation
    │   │                 # engine + crisis logic (same as the frontend)
    │   ├── handlers.js   # API handlers — used by BOTH server.js and Vercel
    │   └── http.js       # CORS / JSON / error helpers
    ├── health.js  students.js  bookings.js  vehicles.js
    ├── demand.js  allocate.js  crisis.js  notifications.js
    └── (each is a thin Vercel function re-exporting its shared handler)
```

## How to run

**Option A — frontend only (30 seconds, works offline):**
Just open `index.html` in a browser. The app shows "Demo mode — works offline"
and everything runs locally. This is the safe showcase mode.

**Option B — full-stack (recommended for the demo):**
```bash
cd routeless-final
node server.js
# then open http://localhost:3000
```
The top bar shows "● Connected to ROUTELESS server". Allocation and crisis
runs are mirrored to the API; the local engine stays the source of truth, so
the showcase never depends on the network.

No install step anywhere: `npm install` is not needed (zero dependencies).
Node 18+ is enough. For the exam camera/mic demo, use the server (Option B),
not `file://`.

## How to deploy (~5 minutes)

1. Create a **public** GitHub repo (e.g. `routeless`), push this folder:
   `git init && git add . && git commit -m "ROUTELESS - Prompt Battle final"`,
   then add the remote and `git push -u origin main`.
2. Go to **vercel.com → Add New → Project → Import** the repo. No build
   command needed; Vercel auto-detects the `api/` functions.
3. Deploy. You get a public URL like `https://routeless.vercel.app`.
4. Open the URL on your phone + laptop. Check the top bar shows
   "● Connected to ROUTELESS server", then press SIMULATE EXAM DAY CRISIS
   once to confirm the live demo works.
5. Submit **both** links (deployed URL + public GitHub repo URL) via the
   organisers' form. Check both links work before submitting.

## Demo logins

No passwords — use the **"View as:"** switcher (top-right, or on the landing
page): Super Admin, Transport Admin, College Admin, Teacher, Student
(Anu Gowda), Parent / Guardian, Transport Provider, Driver. All windows stay
visible in all roles so judges can see everything.

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/health` | Server alive check → `{ok:true, mode:"server"}` |
| GET / POST | `/api/students` | List students / register a student |
| GET / POST / DELETE | `/api/bookings` | List / create / cancel journey bookings |
| GET | `/api/vehicles` | Vehicles with live load + free seats |
| GET | `/api/demand` | Demand summary (total, by village, by destination, shortfall) |
| GET / POST | `/api/allocate` | Current plan / re-run the allocation engine |
| GET / POST | `/api/crisis` | Crisis status / simulate (`{}`) or reset (`{action:"reset"}`) |
| GET | `/api/notifications` | In-app notifications |

All endpoints handle CORS + OPTIONS and return JSON with proper status codes
(400 validation, 404 not found, 409 crisis already active, 405 wrong method).

## 2-minute judge demo

1. **Landing** — 3 big actions. Press **"Crisis Control (demo)"**… or start
   at the Command Center: **118 journeys, 212 seats, 0 waiting**.
2. **Crisis Control** — read the scenario, press **SIMULATE EXAM DAY CRISIS**:
   2 govt buses gone, demand +40% (165 journeys), Hulikatti–Belavadi road
   flooded. Watch the 4 stats: students affected, exam students prioritised,
   reallocated, still awaiting.
3. **Point at the honest part:** 33 students are still waiting with the exact
   seats short — the system never invents vehicles. All 22 exam-within-2h
   students keep a vehicle.
4. **Seat Allocation** — show the waiting list; **My Journey** — show one exam
   student's new vehicle, earlier pickup, alternate route.
5. **Reset + re-run** to prove the simulation is repeatable, then
   **Digital Campus** — unallocated students get an online-class link instead
   of a lost day.
6. Close on the line: **"Transportation should never decide a student's future."**

## The crisis simulation (surprise hurdle)

Exact scenario: 2 government buses unavailable (technical issues), demand
+40%, Hulikatti–Belavadi main road flooded and inaccessible, exams within
2 hours. The simulation **really changes** the data — vehicles, journeys,
assignments, statuses, notifications — in both the frontend engine and the
backend engine (same code logic). Reset restores the exact original plan.

Verified numbers: base day 118/118 allocated, 0 waiting, 0 overbooked;
crisis 165 journeys → 132 allocated (100% of remaining capacity), 33 waiting,
22/22 exam-within-2h students placed, 55 journeys on the Kadur-bypass
alternate route (+25 min, earlier pickups).

## Completed vs incomplete

**Complete:** all 10 windows; registration + booking + cancel; real allocation
engine (never overbooks); crisis simulation + reset (frontend + backend);
provider verification + requests; journey timeline + SOS; campus + teacher
publishing; attendance sessions + check-in + audit; live-class + assignment
UI; exam create/take + consent flow + event log; notifications; 8 demo roles;
Node.js API (8 endpoints) + local server + Vercel functions.

**Demo-only (labelled in-app, integration points noted):** no real GPS
tracking, video provider, proctoring backend, or SMS. Travel times are
per-village estimates, not real road-network routing. Exam uses a 5-question
sample set.

## Honest limitations

- **In-memory demo store:** the backend keeps state in memory per server
  instance. On Vercel, each serverless function instance has its own copy and
  state resets on cold start. The frontend's localStorage is the showcase
  source of truth — that is why the demo never depends on the backend.
- **Auth is demo-only:** the role switcher is for judging, not real
  authentication. A production version needs real login + role enforcement.
- **No real GPS / video / SMS / proctoring** — all labelled demo-only in-app.
- Reset the demo (sidebar → "Reset demo data") before each showcase run so
  the numbers start clean.
