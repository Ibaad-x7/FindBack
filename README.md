# FindBack — Smart Lost and Found Platform
# FindBack – Smart Lost & Found Platform

**STEP 5: Smart Matching Engine.** Building on Step 1 (scaffold), Step 2
(Prisma schema), Step 3 (JWT auth), and Step 4 (item CRUD), this step adds
a weighted scoring engine that compares LOST items against FOUND items and
stores qualifying pairs in the existing `Match` model, plus endpoints to
run matching, list/view matches, and accept or reject them. No Prisma
schema changes were needed — the `Match` model from Step 2 already covers
everything this step requires.
**FindBack** is a modern, full-stack, privacy-preserving Lost and Found web platform designed for university campuses, organizations, and public communities. Powered by an automated multi-attribute matching engine, FindBack helps reunite individuals with their lost belongings through intelligent scoring, secure contact requests, real-time in-app notifications, and comprehensive administrative oversight.

## Stack
---

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Router + Lucide React
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL + Prisma
## College Project Information

## Architecture
| Student Name | Register Number | Role |
| :--- | :--- | :--- |
| **MOHAMMED IBAAD D** | **24BCS0077** | Full-Stack Engineering, Matching Algorithms & Database Architecture |
| **MOHAMMED HAMDAAN M** | **24BCS0069** | Frontend Engineering, UI/UX Design & System Integration |

```
FindBack/
├── frontend/             # React + Vite + TS + Tailwind app
│   ├── src/
│   │   ├── components/   # Navbar, Footer, HealthBadge (uses lucide-react)
│   │   ├── pages/        # Home, Search, Login, Register (placeholders)
│   │   ├── lib/api.ts    # fetch helper
│   │   ├── App.tsx, main.tsx, index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts    # proxies /api -> :5000, reads root .env
├── backend/              # Express + TS API
│   ├── src/
│   │   ├── config/env.ts        # loads root .env (incl. JWT_SECRET)
│   │   ├── controllers/
│   │   │   ├── authController.ts   # register, login, me
│   │   │   ├── itemController.ts   # create/list/get/my/update/status/delete
│   │   │   └── matchController.ts  # run/list/get/status for matches
│   │   ├── services/
│   │   │   └── matchingService.ts  # scoring + DB orchestration
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts   # requireAuth (JWT verification)
│   │   │   └── adminMiddleware.ts  # requireAdmin (role check)
│   │   ├── utils/
│   │   │   ├── jwt.ts             # sign/verify, fails safely if no secret
│   │   │   ├── password.ts        # bcryptjs hash/compare
│   │   │   ├── validators.ts      # register/login input validation
│   │   │   ├── itemValidators.ts  # item create/update/status validation
│   │   │   ├── matchingUtils.ts   # pure text/date similarity helpers
│   │   │   ├── pagination.ts      # page/limit parsing + pagination meta
│   │   │   ├── apiResponse.ts     # { success, message, data } helpers
│   │   │   └── safeUser.ts        # strips passwordHash from responses
│   │   ├── types/express.d.ts     # augments Request with req.user
│   │   ├── lib/prisma.ts          # PrismaClient singleton
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── auth.ts            # POST /register, /login, GET /me
│   │   │   ├── items.ts           # item CRUD routes
│   │   │   └── matches.ts         # matching engine routes
│   │   ├── app.ts
│   │   └── index.ts
│   ├── test-auth.sh      # curl smoke test: register → login → me
│   ├── test-items.sh     # curl smoke test: full item CRUD lifecycle
│   ├── test-matches.sh   # curl smoke test: run/list/get/accept/reject
│   ├── requests.http     # manual requests for REST Client / JetBrains
│   └── package.json
├── prisma/
│   └── schema.prisma     # User, Item, Match, ContactRequest, Notification models
├── uploads/               # for item images later; empty for now (.gitkeep)
├── .env.example           # single source of truth for both apps
├── .gitignore
├── package.json           # npm workspaces root (frontend + backend)
└── README.md
```
---

This is an **npm workspaces monorepo**: one `npm install` at the root
installs both `frontend/` and `backend/` and hoists shared deps
(`@prisma/client`, `prisma`) so Prisma commands can be run once from the
root against `prisma/schema.prisma`.
## 1. Project Overview

Both apps read from a **single root `.env`** — the backend loads it via an
explicit path in `config/env.ts`, and the frontend's `vite.config.ts` sets
`envDir` to point at the repo root instead of `frontend/.env`.
On college campuses and community premises, traditional lost-and-found operations suffer from fragmentation, manual bulletin boards, unorganized social media posts, and public disclosure of sensitive personal contact details. 

## Prerequisites
**FindBack** addresses these shortcomings through a centralized, intelligent platform:
- **Intelligent Recovery**: Automates item correlation via a multi-attribute Jaccard similarity scoring engine.
- **Privacy-Preserving Contact Exchange**: Never exposes a reporter's email or phone number publicly until a mutual contact request is explicitly accepted.
- **Role-Based Access Control**: Distinguishes regular platform users from campus administrators who oversee community safety and item moderation.
- **End-to-End Responsive Experience**: Fast, reactive React application styled with Tailwind CSS, optimized with Vite chunk splitting and mobile-ready drawers.

- Node.js 18+ and npm
- A running PostgreSQL server (local install, Docker, or a hosted instance
  such as Supabase/Neon/Railway) — **required for this step**, since real
  models and migrations now exist.
---

## Database schema (from Step 2 — unchanged)
## 2. Problem Statement

`prisma/schema.prisma` defines:
1. **Information Fragmentation**: Lost and found notices are scattered across social channels, physical notice boards, and departmental desks, making item discovery accidental rather than systematic.
2. **Privacy Vulnerabilities**: Traditional posts display phone numbers or email addresses openly on public boards, exposing reporters to spam, harassment, or illegitimate claims.
3. **Manual Matching Overhead**: Campus staff manually sift through logbooks to pair reported losses with found items, causing delays that reduce recovery probability.
4. **Lack of Lifecycle Tracking**: Once reported, items rarely have verifiable status states (`ACTIVE`, `MATCHED`, `RECOVERED`, `CLOSED`), resulting in outdated databases.

- **User** — `id`, `name`, `email` (unique), `passwordHash`, `phone`,
  `profileImage`, `role` (`USER` | `ADMIN`), timestamps
- **Item** — `id`, `userId` (FK → User), `type` (`LOST` | `FOUND`), `name`,
  `category` (enum), `description`, `imageUrl`, `location`, `city`, `date`,
  `additionalDetails`, `identifyingCharacteristics`, `status` (enum),
  timestamps
- **Match** — `id`, `lostItemId` / `foundItemId` (both FK → Item), `score`,
  `status` (enum), timestamps; unique on `(lostItemId, foundItemId)` so the
  same pair can't be matched twice
- **ContactRequest** — `id`, `senderId` / `receiverId` (FK → User), `itemId`
  (FK → Item), `message`, `status` (enum), timestamps
- **Notification** — `id`, `userId` (FK → User), `title`, `message`, `read`,
  `createdAt`
---

Step 3, Step 4, and Step 5 all use this schema as-is — **no migrations
were added** beyond the original Step 2 one. The `Match` model already had
everything the Step 5 matching engine needed.
## 3. Project Objectives

## Authentication (Step 3)
- Design and implement a robust relational data model using **PostgreSQL** and **Prisma ORM**.
- Implement secure, stateless **JWT authentication** with **bcryptjs** password hashing.
- Build a **Smart Matching Engine** comparing textual, categorical, spatial, and temporal attributes with configurable threshold filtering ($\ge 50\%$).
- Protect user privacy with a two-way **Contact Request workflow** that reveals contact information only upon explicit consent.
- Deliver a modern, accessible, responsive **React + Vite** frontend with live system status monitoring, debounced search, image upload management, and zero bundle warnings.
- Build an **Admin Dashboard** providing community-wide analytics, user role promotion/demotion safeguards, and item moderation.
- Provide a repeatable, idempotent synthetic **Seed System** for demonstration and academic evaluation.

### Endpoints
---

| Method | Path                | Auth required | Description                          |
|--------|---------------------|---------------|---------------------------------------|
| POST   | `/api/auth/register`| No            | Create a `USER` account, returns JWT |
| POST   | `/api/auth/login`   | No            | Verify credentials, returns JWT      |
| GET    | `/api/auth/me`      | Yes (Bearer)  | Return the authenticated user        |
## 4. Key Features

### Request/response shapes
### Authentication & Authorization
- Secure account registration and login with JWT issuance (7-day default expiry).
- Passwords hashed with bcryptjs (10 salt rounds); `passwordHash` is strictly excluded from all client API responses.
- Protected client routes with loading states and role-restricted admin guards.

Register/Login request body:
```json
{ "name": "John Doe", "email": "john@example.com", "password": "password123" }
```
(`name` is only required for `/register`.)
### Item Management & Reporting
- Comprehensive reporting for both `LOST` and `FOUND` items across standard campus categories (`ELECTRONICS`, `WALLET`, `KEYS`, `BAGS`, `DOCUMENTS`, `BOOKS`, `JEWELRY`, `ACCESSORIES`, `CLOTHING`, `OTHER`).
- Multi-attribute metadata: location, city, date, description, and identifying characteristics.
- Full CRUD operations with strict ownership enforcement (only the reporting user or an `ADMIN` can edit or delete an item).

Success response (register/login):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "USER", "...": "..." },
    "token": "eyJhbGciOi..."
  }
}
```
### Image Upload & Automated Storage Cleanup
- Single-photo attachment via Multer with validation for MIME types (`image/jpeg`, `image/png`, `image/webp`), extensions, and a 5MB size limit.
- Cryptographically random filenames (`crypto.randomBytes(16)`) to prevent filename collisions.
- Path traversal protection ensuring all file operations remain within the managed uploads directory.
- Disk cleanup: Replaced or deleted item images are unlinked from disk to prevent storage leaks.

Error response (any endpoint):
```json
{ "success": false, "message": "Invalid email or password." }
```
### Search & Faceted Filtering
- Debounced text search (300ms) matching across title, description, location, and characteristics without request flooding.
- Multi-filter toolbar: item type (`LOST` / `FOUND`), category, city, and status.
- URL query synchronization enabling direct shareable search links (e.g., `/search?category=ELECTRONICS`).

`passwordHash` is never included in any response — `/register`, `/login`,
and `/me` all return a hand-picked safe subset of the `User` fields.
### Smart Matching Engine
- Automated comparison between active `LOST` and `FOUND` items.
- Weighted scoring algorithm (0–100) combining:
  - **Category Match**: 25 points (exact match required)
  - **Item Name Similarity**: 20 points (order-independent Jaccard word set similarity)
  - **Description Similarity**: 20 points (stop-word filtered word set overlap)
  - **Location & City**: 15 points (city match + location text similarity)
  - **Date Proximity**: 10 points (tiered penalty based on days elapsed)
  - **Identifying Characteristics**: 10 points (distinguishing feature overlap)
- Items scoring $\ge 50\%$ generate a `Match` record with status `PENDING`.
- Idempotent upserting: Rerunning matching refreshes scores without overriding decided matches.

### How authentication works
### Privacy-Preserving Contact Requests
- Users contact item reporters through an in-app request modal without public contact details.
- Reporters review received requests and choose to `ACCEPT` or `REJECT`.
- Upon mutual acceptance, verified email and phone numbers are securely revealed.

- Passwords are hashed with **bcryptjs** (10 salt rounds) before being
  stored; plaintext passwords are never persisted.
- On success, `/register` and `/login` sign a **JWT** (`{ userId, role }`)
  using `JWT_SECRET`, expiring after `JWT_EXPIRES_IN` (default `7d`).
- `requireAuth` middleware (`middleware/authMiddleware.ts`) reads the
  `Authorization: Bearer <token>` header, verifies the JWT, and attaches
  `req.user = { id, role }` for downstream handlers. Any missing/malformed/
  invalid/expired token → `401` with a generic message.
- `requireAdmin` middleware (`middleware/adminMiddleware.ts`) runs after
  `requireAuth` and rejects non-`ADMIN` users with `403`. Not wired to any
  route yet — no admin endpoints exist until a later step — but ready to
  use, e.g. `router.get("/admin-only", requireAuth, requireAdmin, handler)`.
- If `JWT_SECRET` is missing, `/register` and `/login` fail immediately
  with a `500` and a generic message **before** touching the database or
  hashing anything — the server does not fall back to an insecure default
  secret, and won't create a user it can't hand a token back for.
### Notifications System
- In-app notification center with a dynamic unread counter badge in the navigation bar.
- Background polling (25-second intervals) checking for match alerts and contact request updates.
- One-click actions to mark individual notifications as read, mark all read, or delete.

## Items API (Step 4)
### User Dashboard & Profile
- Unified dashboard displaying KPI metric cards: Total Reported, Active Listings, Resolved / Recovered, and Action Required.
- Profile settings allowing users to update their display name, phone number, avatar image, and password.
- Strict metric compliance: `recoveredItems` strictly tallies `ItemStatus.RECOVERED` listings; `MATCHED` items remain segregated.

Full CRUD for the `Item` model from Step 2 — no schema changes were needed.
### Admin Moderation Dashboard
- Comprehensive platform KPI analytics: recovery rates, user distribution, and request counts.
- User management table with search, role promotion (`USER` $\rightarrow$ `ADMIN`), role demotion, and account deletion.
- Self-action safeguards: Admins cannot demote or delete their own accounts.
- Item moderation table with full search, status transitions, and item deletion.

### Endpoints
### Synthetic Demo / Seed Data
- Idempotent seed script (`npm run db:seed`) creating 5 presentation accounts, 12 items across all lifecycle states, pre-configured matches, contact requests, and notifications.

| Method | Path                     | Auth required      | Description                              |
|--------|--------------------------|---------------------|-------------------------------------------|
| POST   | `/api/items`             | Yes (Bearer)        | Create a LOST or FOUND item               |
| GET    | `/api/items`             | No                  | List items (filters, search, pagination)  |
| GET    | `/api/items/my`          | Yes (Bearer)        | List the authenticated user's own items   |
| GET    | `/api/items/:id`         | No                  | Get one item (with safe owner info)       |
| PUT    | `/api/items/:id`         | Yes, owner or ADMIN | Update an item's fields                   |
| PATCH  | `/api/items/:id/status`  | Yes, owner or ADMIN | Change only an item's status              |
| DELETE | `/api/items/:id`         | Yes, owner or ADMIN | Delete an item                            |
---

### Creating an item
## 5. Technology Stack

```json
POST /api/items
Authorization: Bearer <token>
### Frontend
- **Framework:** React 18 (TypeScript)
- **Tooling & Build:** Vite 5 with Rollup vendor chunking
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **Icons:** Lucide React
- **State Management:** React Context API (`AuthContext`)

{
  "type": "LOST",
  "name": "Black Wallet",
  "category": "WALLET",
  "description": "Black leather wallet with three cards inside",
  "location": "College Library",
  "city": "Chennai",
  "date": "2026-09-05",
  "additionalDetails": "Small black leather wallet",
  "identifyingCharacteristics": "Scratch on the front"
}
```
### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (TypeScript)
- **Database Client / ORM:** Prisma Client v5
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`
- **File Uploads:** Multer (with disk storage & security sanitization)
- **CORS & Middleware:** `cors`, `dotenv`

- `type` must be `LOST` or `FOUND`; `category` must match the Prisma
  `ItemCategory` enum. Both are validated before touching the database.
- `userId` is **always** taken from the authenticated JWT (`req.user.id`) —
  any `userId` sent in the request body is ignored, never read.
- `status` always starts as `ACTIVE` regardless of what's in the request.
### Database
- **Database Engine:** PostgreSQL
- **Schema Management:** Prisma Schema (`prisma/schema.prisma`)
- **Seeding:** `ts-node` + `@prisma/client`

### Listing items
---

## 6. System Architecture

```
GET /api/items
GET /api/items?type=LOST
GET /api/items?type=FOUND&category=WALLET
GET /api/items?city=Chennai
GET /api/items?search=black wallet
GET /api/items?page=1&limit=10
┌──────────────────────────────────────────────────────────────┐
│                   FindBack Web Application                   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │               React + Vite Frontend                  │   │
│   │  (Pages: Home, Search, Details, Dashboard, Admin)    │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                 HTTP / REST  │  Bearer JWT                   │
│                              ▼                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │               Express.js REST API                    │   │
│   │  ├── Controllers (Auth, Items, Matches, Admin, etc.) │   │
│   │  ├── Middleware (requireAuth, requireAdmin, upload)  │   │
│   │  └── Services (Smart Matching Engine, Notifications) │   │
│   └──────────────────────────┬───────────────────────────┘   │
│                              │                               │
│                Prisma Client │  Parameterized SQL            │
│                              ▼                               │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              PostgreSQL Database                     │   │
│   │  (Users, Items, Matches, ContactRequests, Notifs)    │   │
│   └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- Defaults to `status=ACTIVE` unless `?status=` overrides it (e.g.
  `?status=RECOVERED` to browse recovered items).
- `search` does a case-insensitive match across `name`, `description`,
  `location`, `city`, `additionalDetails`, and `identifyingCharacteristics`.
- `city` filtering is case-insensitive.
- `limit` is capped at 50 per page regardless of what's requested.
- Response shape:
  ```json
  {
    "success": true,
    "message": "Items fetched successfully.",
    "data": {
      "items": [ /* ... */ ],
      "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
    }
  }
  ```
---

### Ownership & authorization
## 7. Project Folder Structure

- `POST /api/items` — any authenticated user.
- `GET /api/items`, `GET /api/items/:id` — public, no auth required.
- `GET /api/items/my` — authenticated, always scoped to `req.user.id`.
- `PUT`, `PATCH .../status`, `DELETE` — the request handler fetches the
  item first, then checks `item.userId === req.user.id || req.user.role
  === "ADMIN"` before allowing the change; otherwise `403`. A non-existent
  item id returns `404` before the ownership check even runs.
- Updates only ever apply an explicit whitelist of fields (`name`,
  `category`, `description`, `location`, `city`, `date`,
  `additionalDetails`, `identifyingCharacteristics`, `status`, `imageUrl`)
  — `userId`, `id`, `createdAt`, `updatedAt`, or any other field in the
  request body is silently ignored, never applied.

### Response shapes

Success:
```json
{ "success": true, "message": "Item created successfully.", "data": { "item": {} } }
```
Error:
```json
{ "success": false, "message": "Item not found." }
FindBack/
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions (node_modules, .env, dist, *.tsbuildinfo)
├── package.json              # Monorepo root with npm workspaces
├── tsconfig.json             # Root TypeScript config for seed transpilation
├── README.md                 # Project documentation
│
├── prisma/
│   ├── schema.prisma         # Relational database models, enums & indexes
│   └── seed.ts               # Idempotent demo data generator
│
├── uploads/                  # Local directory for uploaded item photos
│   └── items/                # Sanitized user uploaded images
│
├── frontend/                 # Client React application
│   ├── index.html            # Vite HTML entry point
│   ├── package.json          # Frontend dependencies & scripts
│   ├── tailwind.config.js    # Tailwind configuration & brand palette
│   ├── vite.config.ts        # Vite configuration with proxy & Rollup manualChunks
│   └── src/
│       ├── App.tsx           # Route registration & protected route wrappers
│       ├── main.tsx          # React DOM render root
│       ├── index.css         # Global Tailwind styles
│       ├── components/       # Reusable components (Navbar, Footer, ItemCard, etc.)
│       ├── context/          # AuthContext for session management
│       ├── lib/api.ts        # Centralized typed API client
│       └── pages/            # Application views (Home, Search, MyItems, Admin, etc.)
│
└── backend/                  # Server Express application
    ├── package.json          # Backend dependencies & scripts
    ├── tsconfig.json         # Backend TypeScript compiler configuration
    ├── requests.http         # Manual REST API request collection
    └── src/
        ├── app.ts            # Express application setup & middleware
        ├── index.ts          # Server entry point & listener
        ├── config/           # Environment configuration (env.ts)
        ├── controllers/      # Route controllers (auth, items, matches, admin, etc.)
        ├── middleware/       # JWT auth, admin authorization & upload middleware
        ├── routes/           # Express router endpoints
        ├── services/         # Smart matching engine & notification dispatchers
        └── utils/            # Hashing, JWT, validation, pagination & safe user helpers
```
As with auth, `passwordHash` is never returned — the owner info embedded
in item responses (as `owner`) is always projected through the same
`SAFE_USER_SELECT` used by `/api/auth/me`.

## Smart Matching Engine (Step 5)
---

Compares every **ACTIVE** `LOST` item against every **ACTIVE** `FOUND`
item and stores a `Match` record (score 0–100) for any pair that scores
**50 or higher**. Never compares LOST-with-LOST or FOUND-with-FOUND, and
never matches an item with itself (the two loops only ever run over
disjoint LOST/FOUND sets).
## 8. Database Schema Overview

### Scoring (`backend/src/services/matchingService.ts`)
The database schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma) and maps the following core models:

Weights sum to 100:
- **User**: Stores registered accounts (`id`, `name`, `email`, `passwordHash`, `phone`, `profileImage`, `role`, timestamps).
- **Item**: Stores reports (`id`, `userId`, `type` [LOST/FOUND], `name`, `category`, `description`, `imageUrl`, `location`, `city`, `date`, `identifyingCharacteristics`, `status` [ACTIVE/MATCHED/RECOVERED/CLOSED], timestamps).
- **Match**: Stores algorithmic pairings between a lost item and a found item (`lostItemId`, `foundItemId`, `score`, `status` [PENDING/ACCEPTED/REJECTED]). Enforces compound unique constraint `@@unique([lostItemId, foundItemId])`.
- **ContactRequest**: Manages communication (`senderId`, `receiverId`, `itemId`, `message`, `status` [PENDING/ACCEPTED/REJECTED]).
- **Notification**: User in-app notifications (`userId`, `title`, `message`, `read`, `createdAt`).

| Signal                      | Points | How it's computed                                                                 |
|------------------------------|-------:|-------------------------------------------------------------------------------------|
| Category                     | 25     | Full points if `category` matches exactly, otherwise 0                              |
| Item name                    | 20     | Jaccard similarity of normalized word sets (order-independent)                      |
| Description                  | 20     | Jaccard similarity of word sets, common stop words removed                          |
| Location                     | 15     | 60% weight for same `city` (case-insensitive); +40% for `location` text similarity, only counted when the city already matches |
| Date                         | 10     | Tiered by how many days apart: 0d→100%, ≤1d→90%, ≤3d→80%, ≤7d→60%, ≤14d→40%, ≤30d→20%, else 0% of the 10 points |
| Identifying characteristics   | 10     | Jaccard similarity of `identifyingCharacteristics` + `additionalDetails` combined per item; 0 if either side has neither field filled in |
---

"Jaccard similarity of word sets" is what makes `"black wallet"` and
`"wallet black"` score identically, and lets `"black leather wallet"`
still score well against `"black wallet"` (2 shared words / 3 total = 0.67
similarity) — see `backend/src/utils/matchingUtils.ts`.
## 9. Installation & Setup

The final score is the sum of all six components, rounded to the nearest
integer and capped at 100.
### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: A local PostgreSQL instance or a managed cloud database (e.g., Supabase, Neon, Railway).

### Endpoints
### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd FindBack

| Method | Path                     | Auth required                          | Description                              |
|--------|--------------------------|------------------------------------------|-------------------------------------------|
| POST   | `/api/matches/run`       | Yes (any authenticated user)             | Recompute scores, store qualifying matches |
| GET    | `/api/matches`           | Yes                                       | List matches involving the caller's items |
| GET    | `/api/matches/:id`       | Yes, must own the lost or found item, or ADMIN | Get one match                        |
| PATCH  | `/api/matches/:id/status`| Yes, must own the lost or found item, or ADMIN | Accept or reject a PENDING match     |
# Install dependencies across root and both workspaces (frontend & backend)
npm install
```

### Running matching

```json
POST /api/matches/run
Authorization: Bearer <token>
### 2. Configure Environment Variables
Copy the `.env.example` file to create your local `.env`:
```bash
cp .env.example .env
```
Any authenticated user can trigger a run — it's a system-wide rescan, not
scoped to the caller's own items, since the whole point is finding matches
between *different* people's reports. Response:
```json
{
  "success": true,
  "message": "Matching run completed.",
  "data": {
    "summary": { "consideredPairs": 42, "created": 3, "updated": 1, "threshold": 50 },
    "matches": [ /* every Match record that currently qualifies, highest score first */ ]
  }
}
```

**Behavior on rerun:**
- A LOST/FOUND pair that scores ≥ 50 for the first time → a new `Match`
  row is created with `status: PENDING`.
- A pair that already has a `Match` row → its `score` is refreshed (in
  case either item was edited since the last run), but its `status` is
  **left untouched**. Rerunning matching never silently flips an already
  `ACCEPTED`/`REJECTED` match back to `PENDING`.
- A pair that scores below 50 and has no existing `Match` row is simply
  not stored — there's no "reject automatically" behavior.
- The whole batch of creates/updates for a single run happens inside one
  `prisma.$transaction(...)` — either all qualifying pairs are persisted,
  or (if something fails) none are, so the `Match` table never ends up
  half-updated from a broken run.
- The unique constraint on `(lostItemId, foundItemId)` from Step 2 is what
  makes "avoid duplicate Match records" enforceable at the database level,
  not just in application code — `prisma.match.upsert` targets that exact
  compound key.
Edit `.env` and fill in safe local configuration values:
```env
# Backend Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

### Listing and viewing matches
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/findback?schema=public"

`GET /api/matches` returns matches where the authenticated user owns
*either* the lost item or the found item, ordered by score descending,
with both items and their (safe) owners included:
```json
{
  "success": true,
  "message": "Matches fetched successfully.",
  "data": {
    "matches": [
      {
        "id": "...",
        "score": 87,
        "status": "PENDING",
        "lostItem": { "id": "...", "name": "Black Wallet", "owner": { "...": "safe fields only" } },
        "foundItem": { "id": "...", "name": "Wallet Black", "owner": { "...": "safe fields only" } }
      }
    ]
  }
}
# Authentication
JWT_SECRET="your_strong_random_jwt_secret_key_here"
JWT_EXPIRES_IN=7d

# Frontend API URL (leave empty for local dev; Vite proxies /api to port 5000)
VITE_API_URL=
```
`GET /api/matches/:id` returns the same shape for one match, but only to
someone who owns the lost item, owns the found item, or is an `ADMIN` —
anyone else gets `403`. A nonexistent id returns `404`.

### Accepting / rejecting a match
> [!CAUTION]
> Never commit your real `.env` file or disclose passwords in version control. `.env` is ignored by `.gitignore`.

```json
PATCH /api/matches/:id/status
Authorization: Bearer <token>
### 3. Database Migration & Client Generation
```bash
# Generate Prisma Client
npm run prisma:generate

{ "status": "ACCEPTED" }
# Apply migrations for development
npm run prisma:migrate
```
- Only `ACCEPTED` or `REJECTED` are valid request values (`400` otherwise).
- Only the lost item's owner, the found item's owner, or an `ADMIN` can
  decide a match (`403` for anyone else).
- Only works while the match is still `PENDING` — trying to change an
  already-decided match returns `409 "This match has already been
  decided."` rather than silently overwriting a prior decision.

### Security notes specific to matching
### 4. Seed Demo Data (Development / Demo Environments)
To populate the database with synthetic demonstration accounts, realistic items, smart matches, and sample contact requests:
```bash
npm run db:seed
```

- `userId`/ownership is never taken from the request body anywhere in
  this feature — authorization always compares `req.user.id` (from the
  verified JWT) against the `lostItem.userId`/`foundItem.userId` already
  stored in the database.
- Item ids that don't exist, or match ids that don't exist, return `404`
  rather than a raw Prisma error.
- `passwordHash` is never returned — the `lostItem.owner`/`foundItem.owner`
  fields are always projected through `SAFE_USER_SELECT`.
---

## Setup
## 10. Running the Application

### Development Mode
Open two separate terminal windows (or run concurrently):

**Terminal 1 — Backend API:**
```bash
# 1. Install dependencies (root + both workspaces)
npm install
npm run dev:backend
# Starts Express API with ts-node-dev on http://localhost:5000
```

# 2. Configure environment
cp .env.example .env
# Edit .env:
# - DATABASE_URL: your PostgreSQL credentials (see Step 2 above)
# - JWT_SECRET: any strong random string, e.g. `openssl rand -base64 32`
#   (do NOT reuse a demo/example value in anything real)
**Terminal 2 — Frontend Application:**
```bash
npm run dev:frontend
# Starts Vite development server on http://localhost:5173
```

# 3. Generate the Prisma Client
npm run prisma:generate
Visit **`http://localhost:5173`** in your browser.

# 4. Create and apply the migration if you haven't already (Step 2)
#    Steps 4 and 5 required NO schema changes, so skip this if it's
#    already done.
npm run prisma:migrate
---

# 5. (Optional) Open Prisma Studio to browse the database visually
npm run prisma:studio
## 11. Production Build & Deployment

# 6. Type-check and build
### Compilation & Typechecking
```bash
# Run TypeScript compiler checks
npm run typecheck:backend
npm run typecheck:frontend

# Build production bundles
npm run build:backend

# 7. Run the backend
npm run dev:backend
# → 🚀 FindBack API listening on http://localhost:5000
npm run build:frontend
```

### Testing register / login / me

**Option A — smoke test script** (registers a throwaway user, logs in,
calls `/me`, and checks a few error cases):
### Starting the Production Backend
```bash
bash backend/test-auth.sh
npm run start --workspace=backend
```

**Option B — curl by hand:**
### Database Deployment Workflow
For production environments, apply migrations using the deploy command:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
npx prisma migrate deploy
```
*(Note: Do not use `prisma db push` or run demo seed scripts against production databases containing real user data.)*

# Login (copy the "token" from the response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
### Deployment Architecture Considerations
- **Frontend Hosting:** Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront. When hosted separately from the backend, set `VITE_API_URL` to your production backend URL.
- **Backend Hosting:** Render, Railway, Fly.io, AWS ECS, or DigitalOcean App Platform. Set `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` to match your frontend domain.
- **Uploaded Image Storage:** The current implementation persists uploaded images to the local filesystem under `uploads/items/`. For deployments on ephemeral cloud containers (e.g., Render free tier), container restarts reset local storage. For permanent cloud production, mount a persistent disk volume or configure cloud storage (e.g., AWS S3 or Supabase Storage).

# Me (replace TOKEN with the value from login/register)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```
---

**Option C — `backend/requests.http`** if your editor supports the
VS Code "REST Client" extension or JetBrains' built-in HTTP client.
## 12. Synthetic Presentation Demo Accounts

### Testing the item APIs
The demo database seed provides 5 synthetic presentation accounts for academic demonstration and testing.

**Option A — smoke test script** (creates a user, creates an item,
exercises list/search/get/my/update/status/delete, and checks 401/404):
```bash
bash backend/test-items.sh
```
| Account Name | Email | Role | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Campus Admin** | `admin@findback.test` | `ADMIN` | `DemoPassword123!` | Administrative account with moderation access |
| **Alice Johnson** | `alice@findback.test` | `USER` | `DemoPassword123!` | Student account with lost MacBook & wallet reports |
| **Bob Smith** | `bob@findback.test` | `USER` | `DemoPassword123!` | Student account with found MacBook & gym headphones |
| **Carol Martinez** | `carol@findback.test` | `USER` | `DemoPassword123!` | Student account with lost Honda key (recovered) |
| **David Chen** | `david@findback.test` | `USER` | `DemoPassword123!` | Student account with found Honda key (recovered) |

**Option B — curl by hand:**
```bash
TOKEN="<paste a token from register/login>"
---

# Create
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"LOST","name":"Black Wallet","category":"WALLET","description":"Black leather wallet with three cards inside","location":"College Library","city":"Chennai","date":"2026-09-05"}'
## 13. REST API Specification

# List (public)
curl "http://localhost:5000/api/items?type=LOST&city=Chennai"
### Health Check
- `GET /api/health` — System status, uptime, and timestamp.

# Get one (public)
curl http://localhost:5000/api/items/ITEM_ID
### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`).
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Get current user profile (requires Bearer token).
- `PUT /api/auth/profile` — Update name, phone, or avatar image.
- `PUT /api/auth/password` — Change password.
- `GET /api/auth/stats` — User activity KPIs (total, active, recovered items).

# My items
curl http://localhost:5000/api/items/my -H "Authorization: Bearer $TOKEN"
### Items (`/api/items`)
- `GET /api/items` — Public listing with search, category, type, city, and status filters.
- `GET /api/items/:id` — Get item details and sanitized owner profile.
- `GET /api/items/my` — Get items reported by the authenticated caller.
- `POST /api/items` — Create a new lost or found item report.
- `PUT /api/items/:id` — Update item fields (owner or admin only; cleans up replaced images).
- `PATCH /api/items/:id/status` — Update item lifecycle status.
- `DELETE /api/items/:id` — Delete item report and associated disk image.

# Update
curl -X PUT http://localhost:5000/api/items/ITEM_ID \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"description":"Updated description"}'
### Smart Matching (`/api/matches`)
- `POST /api/matches/run` — Execute matching algorithm across all active items.
- `GET /api/matches` — List qualifying matches involving caller's items.
- `GET /api/matches/:id` — View specific match score and item pair.
- `PATCH /api/matches/:id/status` — Accept or reject a pending match.

# Change status
curl -X PATCH http://localhost:5000/api/items/ITEM_ID/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"RECOVERED"}'
### Image Upload (`/api/upload`)
- `POST /api/upload/image` — Upload item photograph (multipart/form-data, 5MB limit, JPEG/PNG/WebP).

# Delete
curl -X DELETE http://localhost:5000/api/items/ITEM_ID -H "Authorization: Bearer $TOKEN"
```
### Contact Requests (`/api/contact-requests`)
- `POST /api/contact-requests` — Send inquiry to item reporter.
- `GET /api/contact-requests/received` — List inquiries received for caller's items.
- `GET /api/contact-requests/sent` — List inquiries sent by caller.
- `PATCH /api/contact-requests/:id/status` — Accept or decline request (reveals contact details on accept).

**Option C — `backend/requests.http`**, which now includes an Items
section below the auth requests.
### Notifications (`/api/notifications`)
- `GET /api/notifications` — List notifications for authenticated user.
- `GET /api/notifications/unread-count` — Count of unread notifications.
- `PATCH /api/notifications/:id/read` — Mark notification as read.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.
- `DELETE /api/notifications/:id` — Delete notification.

### Testing the matching engine
### Admin Dashboard (`/api/admin`)
- `GET /api/admin/stats` — Platform-wide metrics and KPIs (requires `ADMIN` role).
- `GET /api/admin/users` — Paginated user listing with search and role filters.
- `PATCH /api/admin/users/:id/role` — Promote or demote user roles (`USER` $\leftrightarrow$ `ADMIN`).
- `DELETE /api/admin/users/:id` — Delete user account and all associated items/images.
- `GET /api/admin/items` — Paginated moderation listing of all items across the platform.

**Option A — smoke test script** (registers three users, creates a
matching LOST/FOUND pair, runs matching, and walks through list/get/
accept/reject plus 401/403/404/409 and duplicate-prevention checks):
```bash
bash backend/test-matches.sh
```
---

**Option B — curl by hand:**
```bash
TOKEN="<paste a token from register/login>"
## 14. Security & Privacy Architecture

# Run the matching engine
curl -X POST http://localhost:5000/api/matches/run \
  -H "Authorization: Bearer $TOKEN"
- **Password Protection:** Plaintext passwords are never persisted. Encrypted with bcryptjs using a work factor of 10.
- **Zero Sensitive Data Exposure:** Database queries utilize `SAFE_USER_SELECT` projecting only safe fields (`id`, `name`, `email`, `phone`, `profileImage`, `role`, `createdAt`). `passwordHash` is excluded from all network responses.
- **Contact Details Privacy:** Reporter phone and email are never shown on public item cards. Only when a reporter explicitly accepts a `ContactRequest` are verified contact details revealed to that specific claimant.
- **Strict Authorization:** Route handlers verify `item.userId === req.user.id || req.user.role === "ADMIN"` before permitting modifications or deletions.
- **Admin Self-Protection:** Admins are programmatically barred from demoting or deleting their own account to prevent administrative lockout.
- **File Upload Security:** Multer enforces a 5MB size limit, whitelists image MIME types and extensions, and generates random hex filenames.
- **Path Traversal Guard:** `deleteUploadedFile` validates that the resolved file path strictly begins within `UPLOADS_ROOT` before executing filesystem deletions.
- **SQL Injection Prevention:** All database interactions utilize Prisma ORM with parameterized queries.

# List my matches
curl http://localhost:5000/api/matches -H "Authorization: Bearer $TOKEN"
---

# Get one match
curl http://localhost:5000/api/matches/MATCH_ID -H "Authorization: Bearer $TOKEN"
## 15. Verified Automated Test Suites

# Accept a match
curl -X PATCH http://localhost:5000/api/matches/MATCH_ID/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"ACCEPTED"}'
FindBack includes comprehensive automated test suites verifying full system functionality across all phases:

# Reject a match
curl -X PATCH http://localhost:5000/api/matches/MATCH_ID/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"REJECTED"}'
```
| Suite | Focus Area | Tests Run | Result |
| :--- | :--- | :--- | :--- |
| **Step 11 Suite** | Admin Dashboard, Role Protection, Moderation, Self-Action Guards | 46 Tests | **46 Passed, 0 Failed** |
| **Step 12 Suite** | Demo Seed System, Idempotency, Non-Demo Data Protection | 22 Tests | **22 Passed, 0 Failed** |
| **Step 13 Suite** | Metric Segregation (`recoveredItems`), Image Cleanup, Vite Proxy | 21 Tests | **21 Passed, 0 Failed** |
| **Total Verified** | **End-to-End Regression Test Suite** | **89 Tests** | **89 Passed (100%)** |

**Option C — `backend/requests.http`**, which now includes a Matches
section below the items requests.
All tests execute successfully without errors or regressions.

## Step 3 sign-off checklist
---

- [ ] `.env` has a real `JWT_SECRET` set (in addition to `DATABASE_URL`
      from Step 2)
- [ ] `npm run typecheck:backend` passes with no errors
- [ ] `npm run build:backend` succeeds
- [ ] `POST /api/auth/register` creates a user and returns a token (no
      `passwordHash` in the response)
- [ ] `POST /api/auth/register` with an existing email returns `409`
- [ ] `POST /api/auth/login` with correct credentials returns a token
- [ ] `POST /api/auth/login` with wrong credentials returns `401`
- [ ] `GET /api/auth/me` with a valid token returns the user
- [ ] `GET /api/auth/me` with no/invalid/expired token returns `401`
## 16. Future Enhancements

## Step 4 sign-off checklist
The following extensions are planned as future improvements:
- **Interactive Campus Map View:** Integrate OpenStreetMap / Mapbox to display lost and found markers geographically across university campuses.
- **Cloud Object Storage Adapter:** Abstract file storage to support AWS S3 or Google Cloud Storage buckets for cloud-native image persistence.
- **Push & Email Notifications:** Implement Web Push API and transactional email notifications (via SendGrid or Resend) for instant match alerts.
- **QR Code Generation:** Allow users to print claim cards with unique item QR codes for placement at campus lost-and-found desks.

- [ ] `npm run typecheck:backend` passes with no errors
- [ ] `npm run build:backend` succeeds
- [ ] `POST /api/items` creates an item owned by the authenticated user
      (verify `userId` in the DB matches the token, not anything sent in
      the body)
- [ ] `POST /api/items` without a token returns `401`
- [ ] `GET /api/items` returns only `ACTIVE` items by default
- [ ] `GET /api/items?type=&category=&city=&search=&page=&limit=` all work
      and pagination totals are correct
- [ ] `GET /api/items/:id` returns full details with safe owner info, no
      `passwordHash`
- [ ] `GET /api/items/my` returns only the authenticated user's items
- [ ] `PUT /api/items/:id` succeeds for the owner, fails `403` for a
      different non-admin user, and ignores any `userId` in the body
- [ ] `PATCH /api/items/:id/status` updates status and rejects invalid
      enum values with `400`
- [ ] `DELETE /api/items/:id` succeeds for the owner/admin, `403` for
      others, and the item is gone afterward (`404` on re-fetch)
- [ ] Step 1 (`/api/health`), Step 2 (Prisma schema/migrations), and Step 3
      (`/api/auth/*`) all still work unchanged
---

## Step 5 sign-off checklist
## 17. License

- [ ] `npm run typecheck:backend` passes with no errors
- [ ] `npm run build:backend` succeeds
- [ ] `POST /api/matches/run` requires auth (`401` without a token) and
      returns a summary + the current qualifying matches
- [ ] Creating a LOST item and a similar FOUND item (same category, city,
      close dates, overlapping name/description words), then running
      matching, produces a `Match` with `score >= 50`
- [ ] `GET /api/matches` only returns matches involving the caller's own
      items, ordered by score descending
- [ ] `GET /api/matches/:id` works for the lost item's owner and the found
      item's owner, returns `403` for an unrelated user, and `404` for a
      nonexistent id
- [ ] `PATCH /api/matches/:id/status` accepts `ACCEPTED`/`REJECTED` only
      (`400` for anything else), enforces the same ownership/`403` rule,
      and returns `409` if the match was already decided
- [ ] Running `/api/matches/run` a second time does **not** create a
      duplicate `Match` row for the same lost/found pair, and does not
      reset an already-`ACCEPTED`/`REJECTED` match back to `PENDING`
- [ ] No `passwordHash` appears anywhere in any match response
- [ ] Steps 1–4 (`/api/health`, Prisma schema/migrations, `/api/auth/*`,
      `/api/items/*`) all still work unchanged

Once all boxes are checked in your own environment, we move to **Step 6**.
This project was developed for academic demonstration and campus community utility. All rights reserved.
