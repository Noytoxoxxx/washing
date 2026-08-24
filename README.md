# VEYZA — The car care network.

VEYZA is a marketplace and social network connecting car owners with car-care
professionals (wash, detailing, ceramic coating, PPF, tinting, and more). This
repository contains the full V1: a REST API backend, a React frontend, and a
Postgres database with a realistic seed dataset.

Deploying to production? See [DEPLOY.md](./DEPLOY.md) (Vercel + Render).

## Architecture

```
/server            Express + TypeScript + Prisma API
  /prisma           schema.prisma, migrations, seed.ts
  /src
    /routes          REST endpoints (auth, professionals, bookings, posts, pro/*, admin/*, ...)
    /middleware       auth (JWT cookie), error handling
    /lib              prisma client, jwt, uploads, notifications, commission engine, admin logs
    config.ts         centralized app config (name, plans defaults, statuses)
  /uploads           user-uploaded images (gitignored)

/client             React + Vite + TypeScript + Tailwind SPA
  /src
    /pages           public / client / pro / admin pages
    /components       design system (ui/*) + feature components (map, booking, social)
    /api              typed fetch wrappers per resource
    /context          Auth + Toast providers
```

Frontend and backend are fully decoupled and talk over `/api/*` (proxied by
Vite in dev). Sessions are httpOnly JWT cookies — there is no separate
"sessions" table needed. All money-relevant values (commission rates, plan
prices) live in the `CommissionSetting` DB table, editable from
`/admin/parametres` — nothing is hardcoded in multiple places.

## Requirements

- Node.js 20+
- npm
- Docker (for a local Postgres instance) — or any Postgres 14+ you already have running

## Installation

```bash
# Postgres (skip if you already have one running — just point DATABASE_URL at it)
docker compose up -d

# Backend
cd server
cp .env.example .env   # defaults match docker-compose.yml; edit JWT_SECRET for anything beyond local dev
npm install
npx prisma migrate dev   # creates the schema
npm run seed              # populates categories, demo accounts, professionals, bookings...

# Frontend
cd ../client
npm install
```

## Running locally

In two terminals:

```bash
# Terminal 1
cd server && npm run dev      # http://localhost:4000

# Terminal 2
cd client && npm run dev      # http://localhost:5173
```

Open http://localhost:5173.

## Demo accounts

All seeded accounts share the password below (local development only — never
use this in production):

```
Password: Veyza2026!

Admin              admin@veyza.test
Founding Partner   founder@veyza.test   (PRO plan, free forever, verified)
Standard pro       pro@veyza.test       (free plan, verified)
Client             client@veyza.test
```

8 other fictional professionals are seeded across France (Lyon, Marseille,
Bordeaux, Lille, Toulouse, Nantes, Nice, Strasbourg) in various states
(pending, suspended, unverified) so every admin/professional status is
represented. 9 other fictional clients are seeded as well.

## Database

Postgres, both locally (via `docker-compose.yml`) and in production (a managed
Render Postgres instance — see [DEPLOY.md](./DEPLOY.md)). Status/role/type
fields are typed `String` rather than native enums (documented per-field,
validated with `zod` at the API boundary) — not a Postgres limitation, just
keeps the schema trivially portable if you ever need a different SQL
provider.

Re-seeding is idempotent for users, categories, and professionals (`upsert`),
so `npm run seed` can be re-run safely; bookings/posts/notifications skip
insertion if the tables are already non-empty.

## Founding Partner & commissions

- `ProfessionalProfile.isFounder` grants a permanent, free PRO plan
  (`subscriptionPlan = "founder"`, price always 0 — enforced server-side in
  `PUT /api/admin/settings/plans/founder`).
- The commission rate applied to a transaction is **snapshotted** onto the
  `Transaction` row at creation time (`commission.ts`). Changing a plan's
  rate in `/admin/parametres` never retroactively changes past transactions.
- Admins grant/revoke Founder status and per-professional commission
  overrides from `/admin/professionnels/:id`.

## Key workflows implemented end-to-end

- Admin creates a prospect → converts it into a Founding Partner professional
  account (`/admin/prospects`) → professional logs in at `/pro/connexion` →
  completes onboarding (`/pro/onboarding`) → adds services/photos/hours →
  admin verifies the profile → it becomes public in Explorer.
- Client registers → discovers professionals via `/explorer` (map + filters)
  or `/decouvrir` (social feed) → favorites/follows a professional → adds a
  vehicle to their garage → books a service → professional confirms it from
  their calendar → marks it completed → a `Transaction` is created with the
  commission snapshotted → client leaves a review.
- Notifications, likes, comments, saves, and admin moderation are all backed
  by the database — nothing in the running app is mocked.

## Uploads

Images (logos, covers, gallery, posts, avatars, vehicle photos) are uploaded
via `POST /api/upload` (multipart, 8 MB max, JPEG/PNG/WEBP/GIF only) and
served from `/uploads`. Seed data uses external placeholder images
(picsum.photos) so the app looks populated without needing real photos.

In production, point `UPLOAD_DIR` at a persistent disk (Render's filesystem is
otherwise ephemeral and wipes uploaded files on every deploy) — see
[DEPLOY.md](./DEPLOY.md).

## Known V1 scope boundaries

Documented explicitly rather than faked in the UI:

- **Payments**: `Transaction.status` supports `payment_pending / paid /
  refunded / failed / cancelled`, but no payment provider is wired up yet
  (see spec §90). No fake "Pay now" button exists anywhere.
- **Email delivery**: password-reset tokens and transactional notifications
  are logged server-side and stored in-app (notification center) rather than
  emailed, since no mail provider is configured. The reset flow is fully
  functional end-to-end via the logged token.
- **Geocoding**: professional addresses store `latitude`/`longitude` directly
  (set manually by admins); no third-party geocoding API is called.
