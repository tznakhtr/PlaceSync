PlaceSync
PlaceSync is a campus placement portal (website) that replaces scattered notices, paper forms and manual shortlisting with one system.
The placement cell creates drives with eligibility rules, students apply only for drives they qualify for, and results are published to everyone at once.

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

1. Clone the repository
```bash
git clone https://github.com/tznakhtr/PlaceSync.git
cd PlaceSync
```

2. Backend setup
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
3. Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env         
```
`frontend/.env` should contain:
```
VITE_API_URL=http://localhost:3000
```
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


Testing
```bash
# backend unit tests
cd backend
npm test

# frontend type check and build
cd ../frontend
npx tsc -b
npm run build

