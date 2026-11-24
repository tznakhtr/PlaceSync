PlaceSync
PlaceSync is a campus placement portal (website) that replaces scattered notices, paper forms and manual shortlisting with one system.
The placement cell creates drives with eligibility rules, students apply only for drives they qualify for, and results are published to everyone at once.
> College mini project. Two roles only: **Student** and **Placement Cell**.
---
Table of contents
Features
Tech stack
Project structure
Getting started
Environment variables
Running the project
How the app works
API overview
Testing
Team workflow (Git)
Troubleshooting
Security notes
Known limitations and future scope
---
Features
Student
Register, log in, and manage an academic profile (roll number, branch, CGPA, backlogs, graduation year, skills, phone)
Upload, replace and delete a resume (PDF only, max 2 MB)
Browse drives with live eligibility badges and the exact reasons when not eligible
Apply to eligible drives, track applications, and withdraw before shortlisting
Notifications (bell with unread count) and a dashboard with next steps
Results stay hidden (shown as "Under review") until the placement cell publishes them
Placement Cell
Create, edit, close/reopen and delete drives (eligibility rules and deadline per drive)
Review applicants with filters, sorting, resume links and a skills-match view
Update statuses one by one or in bulk (all-or-nothing)
Publish results (irreversible), export selected students to CSV
Dashboard showing what needs attention
Smart parts
One eligibility engine decides who can apply (CGPA, branch, backlogs, batch, deadline, drive status) and returns every reason that fails
The server re-checks eligibility when a student applies, so the rules cannot be bypassed
A status state machine prevents invalid changes (for example, jumping from Applied straight to Selected)
---
Tech stack
Layer	Technology
Frontend	React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Axios
Backend	NestJS (TypeScript), Passport JWT, class-validator, Multer
Database	PostgreSQL (Neon) with Prisma ORM
File storage	Cloudinary (resume PDFs)
Auth	JWT with bcrypt password hashing and role-based guards
Tests	Jest (backend unit tests)
Theme: navy blue, emerald green, soft white and cool grey.
---
Project structure
```
PlaceSync/
├── backend/                NestJS API
│   ├── prisma/             schema.prisma, migrations, seed.ts
│   └── src/
│       ├── auth/           register, login, JWT
│       ├── students/       profile and resume
│       ├── drives/         drives and eligibility display
│       ├── eligibility/    eligibility engine (single source of truth)
│       ├── applications/   apply, review, status updates, results
│       ├── notifications/  in-app notifications
│       ├── cloudinary/     file upload service
│       └── common/         guards, decorators, constants
├── frontend/               React website
│   └── src/
│       ├── api/            Axios instance and API functions
│       ├── context/        auth and toast context
│       ├── routes/         protected routes by role
│       ├── layouts/        student and cell layouts
│       ├── pages/          auth, student, cell pages
│       ├── components/     shared UI components
│       └── utils/          formatters and helpers
└── docs/                   Postman collection and screenshots (if added)
```
---
Getting started
Prerequisites
Node.js 20 or newer and npm
Git
A free Neon account (PostgreSQL database): https://neon.tech
A free Cloudinary account (resume storage): https://cloudinary.com
Postman (optional, for testing the API)
1. Clone the repository
```bash
git clone https://github.com/tznakhtr/PlaceSync.git
cd PlaceSync
```
2. Set up the database (Neon)
Create a Neon project and copy its connection string.
Use the direct connection string (host without `-pooler`), ending in `?sslmode=require`.
The pooled host can make migrations time out.
Every teammate should use their own Neon database or branch for development, so test data and migrations never collide.
3. Set up Cloudinary
Sign in to the Cloudinary Console and copy the Cloud name, API Key and API Secret from the Dashboard.
Open Settings -> Security and enable "Allow delivery of PDF and ZIP files".
Without it, uploads work but resume links return a 401 error.
4. Backend setup
```bash
cd backend
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```
Open `backend/.env` and fill in your own values (see Environment variables). Then:
```bash
npx prisma migrate deploy     # applies all migrations to your database
npx prisma generate           # generates the Prisma client
npx prisma db seed            # creates the placement cell account
```
5. Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```
`frontend/.env` should contain:
```
VITE_API_URL=http://localhost:3000
```
---
Environment variables
Real values go only in `.env` files, which are git-ignored. Never commit secrets and never paste them into chats or screenshots.
`backend/.env`
Variable	Description
`DATABASE_URL`	Neon PostgreSQL connection string (direct host, `?sslmode=require`)
`JWT_SECRET`	Long random string used to sign tokens
`JWT_EXPIRES_IN`	Token lifetime, for example `7d`
`PORT`	Backend port, default `3000`
`FRONTEND_URL`	Allowed frontend origin for CORS, for example `http://localhost:5173` (no trailing slash)
`SEED_CELL_EMAIL`	Email of the placement cell account created by the seed
`SEED_CELL_PASSWORD`	Password of that account (choose your own)
`CLOUDINARY_CLOUD_NAME`	Cloudinary cloud name
`CLOUDINARY_API_KEY`	Cloudinary API key
`CLOUDINARY_API_SECRET`	Cloudinary API secret (keep private)
Generate a JWT secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
`frontend/.env`
Variable	Description
`VITE_API_URL`	Backend base URL, for example `http://localhost:3000`
Restart the frontend after changing `.env`, because Vite reads it only at startup.
---
Running the project
You need two terminals running at the same time.
Terminal 1: backend (http://localhost:3000)
```bash
cd backend
npm run start:dev
```
Check it with http://localhost:3000/health, which should return `{"status":"ok"}`.
Terminal 2: frontend (http://localhost:5173)
```bash
cd frontend
npm run dev
```
Test accounts
Placement cell: log in with the `SEED_CELL_EMAIL` and `SEED_CELL_PASSWORD` you set in `backend/.env`.
Student: register from the website (registration always creates students; admins can only come from the seed).
Useful commands
Where	Command	Purpose
`backend/`	`npm run start:dev`	Run the API with reload
`backend/`	`npm test`	Run unit tests
`backend/`	`npx prisma studio`	Browse the database in the browser
`backend/`	`npx prisma migrate dev --name <name>`	Create a new migration after changing `schema.prisma`
`backend/`	`npx prisma migrate deploy`	Apply existing migrations (use after pulling)
`frontend/`	`npm run dev`	Run the website
`frontend/`	`npx tsc -b`	Type-check
`frontend/`	`npm run build`	Production build
> Run **all Prisma commands inside `backend/`**. If `npx` asks to download Prisma, you are in the wrong folder.
After every `git pull`
```bash
cd backend && npm install && npx prisma migrate deploy && npx prisma generate
cd ../frontend && npm install
```
Skipping the migration step causes errors such as "column ... does not exist".
---
How the app works
Eligibility (one rule set, one service)
A student can apply to a drive only when all of these are true:
Rule	Check
Profile exists	The student has completed the profile
Drive is open	Drive status is `OPEN`
Before the deadline	Current time is earlier than the deadline
CGPA	Student CGPA is at least the drive minimum
Branch	Student branch is in the drive's allowed branches
Backlogs	Active backlogs do not exceed the drive maximum
Batch	Graduation year matches the drive's batch
The backend returns `eligible` and the full list of `reasons`. The frontend only displays them. The apply endpoint checks again on the server.
Allowed branches: `CSE`, `IT`, `ECE`, `EE`, `ME`, `CE`.
Application status flow
```
APPLIED -> SHORTLISTED -> INTERVIEW -> SELECTED
   |            |             |
   +------------+-------------+--> REJECTED
```
`SELECTED` and `REJECTED` are final. Students see Shortlisted and Interview immediately. Selected / Rejected stay hidden ("Under review") until the cell publishes the results.
Publishing results
Publishing is irreversible. In one transaction it applies the final statuses (optionally rejecting pending applicants), notifies every applicant, and sets the drive to `COMPLETED`. A completed drive is locked: no edits, status changes or new applications.
Notifications
Type	When
`NEW_DRIVE`	A drive the student is eligible for is created
`APPLICATION_SUBMITTED`	The student applies
`STATUS_UPDATE`	The student is shortlisted or moved to interview
`RESULT_PUBLISHED`	Results are published
The website checks for new notifications every 30 seconds.
---
API overview
Base URL: `http://localhost:3000`. Protected routes need the header `Authorization: Bearer <accessToken>`.
Area	Method and path	Access
Health	`GET /health`	Public
Auth	`POST /auth/register`, `POST /auth/login`	Public
Auth	`GET /auth/me`	Logged in
Student profile	`GET /students/me`, `PUT /students/me`	Student
Student profile	`GET /students/branches`	Logged in
Resume	`POST /students/me/resume` (form-data field `resume`), `DELETE /students/me/resume`	Student
Drives	`GET /drives`, `GET /drives/:id`	Logged in (students also get `eligibility`, cell gets `applicationsCount`)
Drives	`POST /drives`, `PUT /drives/:id`, `PATCH /drives/:id/status`, `DELETE /drives/:id`	Cell
Apply	`POST /drives/:id/apply`	Student
My applications	`GET /applications/me`, `GET /applications/:id`, `DELETE /applications/:id` (withdraw)	Student
Review	`GET /drives/:id/applications`, `GET /drives/:id/applications/summary`	Cell
Review	`PATCH /applications/:id/status`, `PATCH /drives/:id/applications/status` (bulk)	Cell
Results	`POST /drives/:id/publish-results`, `GET /drives/:id/results`	Cell
Notifications	`GET /notifications`, `GET /notifications/unread-count`	Logged in
Notifications	`PATCH /notifications/:id/read`, `PATCH /notifications/read-all`	Logged in
Typical error codes: `400` validation or invalid action, `401` not logged in or token expired, `403` wrong role or not eligible, `404` not found, `409` conflict (duplicate application, duplicate roll number, results already published).
If a Postman collection is present in `docs/`, import it and set `baseUrl` to `http://localhost:3000`.
---
Testing
```bash
# backend unit tests
cd backend
npm test

# frontend type check and build
cd ../frontend
npx tsc -b
npm run build
```
Manual end-to-end check (run before every demo or release):
As the cell, create a drive with eligibility rules and a future deadline.
As a student, complete the profile, upload a PDF resume and open the drive.
Confirm the eligibility badge is correct, then apply.
As the cell, shortlist and select the student.
As the student, confirm the status shows Under review, not Selected.
As the cell, publish the results.
As the student, confirm the final status and the notification.
Try to break it: apply twice, open `/cell` as a student, use a wrong password.
---
Team workflow (Git)
`main` always holds working code. Do not push directly to `main`.
Create one branch per feature: `feature/<short-name>` (for example `feature/fe-notifications`).
Commit small and often with clear messages, for example `feat: add drive filters` or `fix: resume link extension`.
Open a Pull Request into `main`, let a teammate review it, then merge.
Pull before you start work: `git switch main && git pull`.
Check `git status` before every commit. A `.env` file must never appear in it.
Push your branch before merging its pull request, so the latest commit is included.
---
Troubleshooting
Problem	Cause and fix
Registration shows "Cannot reach the backend server"	The backend is not running. Start it in `backend/` and check http://localhost:3000/health
`Cannot POST /auth/register` (404)	Another project's server is using port 3000. Find it with `netstat -ano | findstr :3000`, stop it, or change `PORT` and `VITE_API_URL`
CORS error in the browser console	`FRONTEND_URL` in `backend/.env` must be exactly your frontend address (for example `http://localhost:5173`), no trailing slash. Restart the backend
`The column ... does not exist` or Prisma 500 errors	A migration is missing. Run `npx prisma migrate deploy` and `npx prisma generate` in `backend/`
Migration hangs or `P1002` timeout	Neon is waking up or you used the `-pooler` host. Wait a minute and use the direct connection string
Backend refuses to start and mentions Cloudinary	Add the three `CLOUDINARY_*` values to `backend/.env`
Resume link returns `401 deny or ACL failure`	Enable "Allow delivery of PDF and ZIP files" in Cloudinary Settings -> Security, then re-upload the resume
Resume opens as code or text	The file was stored without `.pdf`. Replace the resume (current code stores it correctly)
Student sees "no drives"	Profile is incomplete, filters are active (clear them), or the status filter is on "Open" while the drive is closed
`.env` changes have no effect	Restart the server. Vite reads `.env` only at startup
Prisma command asks to install packages	You are not inside `backend/`. Answer no and change folder
Page stays on a spinner	Check the Network tab (F12) for a pending or red request, and the backend terminal for the error
---
Security notes
Passwords are hashed with bcrypt and never returned by any endpoint.
Registration creates students only. The role is never read from the request body.
Every protected route checks the JWT, and role checks run on the server (the frontend only hides things for convenience).
Students can only read and change their own profile, applications, notifications and resume.
Resume uploads are limited to real PDF files (content check) up to 2 MB.
The API secret, database URL and JWT secret live only in `.env` files, which are git-ignored.
Resume links are long random URLs but are publicly readable by anyone who has the link.
---
Known limitations and future scope
Resume links are not private. Signed or backend-served links would be safer.
Notifications use polling (every 30 seconds). WebSockets would make them instant.
Email notifications, scheduled reminders and automatic closing of drives after the deadline are not built.
Placement analytics and Excel export, a skill-match score, and making the resume mandatory for applying are planned extras.
Students enter their own CGPA and backlogs. A verification step by the placement cell would improve trust.
Free hosting tiers (for example Render) can sleep after inactivity, so the first request may be slow.
---
PlaceSync, a campus placement and recruitment platform.
