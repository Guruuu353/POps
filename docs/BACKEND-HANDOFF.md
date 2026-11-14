# POps: from demo to real backend

The demo is the specification you can click. Its data shapes, roles, forms and screens carry over. Its code does not copy over unchanged: it uses plain script files with in-browser templates and sample data held in memory.

## What carries over as it is
- **Roles and permissions**: the role-by-module matrix in `src/data.js` (`ROLES`). Rebuild it on the server and enforce it in the API and the database. The screens only hide things.
- **Form layouts**: Form 1A, BMU Patrol Report, Seizure Form DF/SZ, MCS sheet, Vessel Log (`src/forms.js`, `src/vessel.js`). Reuse as the print and PDF layouts.
- **Rules**: infringement codes, maker-checker on finance, project isolation for officers, masked fisher ID and phone, service-due logic (`engSt`), MCS roll-up (`mcsRows`).
- **Map engine, offline queue, service worker, install, language switch**: keep. Swap the public tile servers for a licensed or self-hosted source.

## What to replace
- In-memory state in `src/app.js` (`useState(PATROLS0)` and so on) becomes API calls with a cache.
- Sample data in `src/data.js`, `src/forms.js`, `src/vessel.js` becomes database seed files.
- Move to a normal project: Vite, React and TypeScript. The conversion is mechanical (templates to JSX, globals to imports).

## Suggested stack
PostgreSQL with PostGIS, a REST API (Node with TypeScript, or Python with FastAPI), file storage for photos and signatures, daily backups, HTTPS.

## Main tables (from the demo)
- `user`, `role`, `staff`, `bmu`, `partner`
- `patrol` (ref, objective, date, start/end, leader, boat, bmu, county, jcma, vessel info, areas, challenges, fuel, prepared-by, signature, status, review)
- `patrol_participant` (patrol, agency, count)
- `encounter` (patrol, n, time, fisher name, id no, phone, gear, gear id, quantity, ground, bmu origin, infringement code, details, action, point)
- `seizure` and `seizure_item` (linked to an encounter; officer, station, place, time, signatures)
- `mcs_followup` (patrol, infringement code, convicts, fines, prosecution, times appearing)
- `incident`, `incident_event`, `evidence_file`, `track_point`
- `boat`, `engine` (hour meter, service interval hours and months, alert hours and days), `vessel_log_entry` (date, times, from, to, notes, one meter reading per engine, refuel, initials), `service_record`
- `lmma_boundary_version`, `lmma_point`, `zone`, `project`, `project_assignment`
- `booking`, `payment`, `receipt`, `finance_entry`, `approval`
- `audit_log` (who, what, which record, when)

## API sketch
- `POST /auth/login`, `GET /me`
- `GET/POST /patrols`, `GET /patrols/{id}`, `POST /patrols/{id}/encounters`, `POST /patrols/{id}/complete`, `GET /patrols/{id}/forms/{capture|report|seizure|mcs}.pdf`
- `GET/POST /boats/{id}/log`, `POST /boats/{id}/engines/{eid}/service`, `PATCH /boats/{id}/engines/{eid}/settings`
- `GET /alerts`, `GET /reports/infringements`, `GET /audit`
- `POST /sync` for the phone queue

## Phone sync
The phone makes a client-side UUID for every record and sends it with the record. The server stores each UUID once, so a retry never makes a duplicate. Photos upload separately and attach to the record. Conflicts: the server keeps the phone's field data and flags any edit made on the web after submission.

## Service alerts
Check on every log save and again every night. Send to the boat's Coxswain and the Super Admin by in-app notice, then SMS or email. Do not repeat the same alert more than once a day.

## Order of work
1. Accounts, roles, audit, database.
2. Patrols, encounters, seizures, offline sync, forms as PDF.
3. Boats, vessel log, engine service and alerts.
4. Incidents, LMMA boundary versions, projects.
5. Tourism, finance, approvals, reports.
6. M-Pesa, push notifications, website feed.

## Open questions that change the build
See "Open questions for Patte" on the Solution Overview page.
