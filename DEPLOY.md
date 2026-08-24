# Deploying VEYZA — Vercel (frontend) + Render (backend + Postgres)

This app is a monorepo: `client/` (static React SPA) and `server/` (Express API + Postgres).
The recommended topology is:

```
Browser → Vercel (client/dist, static)
              │  rewrites /api/* and /uploads/* →  Render (server, Node + Postgres)
              └───────────────────────────────────►
```

Vercel transparently proxies `/api/*` and `/uploads/*` to the Render service, so from the
browser's point of view everything is same-origin. That means the session cookie stays
`SameSite=Lax` and no cross-site cookie/CORS workarounds are needed — the app's existing auth
code works unchanged.

## 1. Deploy the backend on Render

`render.yaml` is set to the **free** plan for both the web service and the Postgres database —
$0 to deploy. See the free-tier tradeoffs below before you start.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the Render dashboard: **New → Blueprint**, point it at this repo (branch
   `claude/veyza-v1-complete-9lhf8k`). Render reads `render.yaml` at the repo root and proposes:
   - a **Postgres database** (`veyza-db`, free)
   - a **web service** (`veyza-api`, free)
3. Render auto-generates `JWT_SECRET` and wires `DATABASE_URL` from the Postgres instance.
   **You still need to set `CLIENT_URL` manually** once you know your Vercel URL (step 2) — the
   blueprint leaves it blank (`sync: false`) on purpose. Until then the API will reject
   cross-origin requests from the frontend.
4. Deploy. The build command runs `prisma migrate deploy` automatically, so the schema is
   created on first deploy. Note the resulting service URL, e.g.
   `https://veyza-api-xxxx.onrender.com`.
5. Seed demo data **once**, after the first successful deploy: open a Render Shell for the
   `veyza-api` service (Dashboard → Shell) and run:
   ```bash
   npm run seed
   ```
   Re-running it later is safe — professionals/categories/users are upserted, and
   bookings/posts/notifications/prospects are only inserted if those tables are still empty.

### Free-tier tradeoffs

- **The web service spins down after 15 minutes of inactivity** and takes ~30-60s to wake back
  up on the next request. Fine for a demo/portfolio link, not for something you want always-on
  without a cold start.
- **Uploaded images are ephemeral.** Free services can't attach a persistent disk, so anything
  uploaded through `/pro/profil`, `/pro/galerie`, `/pro/publications`, etc. is wiped on every
  redeploy (and possibly on a spin-down/restart). Seed data is unaffected since it points at
  external picsum.photos URLs, not local files. If this becomes a real problem, either upgrade
  `veyza-api`'s plan to `starter` and add back a `disk:` block (see git history for the exact
  block — it mounts `/var/data/uploads` and needs `UPLOAD_DIR=/var/data/uploads` in envVars), or
  swap `upload.ts` for an S3-compatible object store later.
- **Render's free Postgres is deleted after 90 days.** Fine to start with; if you want to keep
  this running long-term, you'll need to upgrade the database before then (Render emails a
  warning ahead of time).

## 2. Deploy the frontend on Vercel

1. In `vercel.json` (repo root), replace both occurrences of
   `https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com` with the actual Render URL from step 1.5,
   then commit and push.
2. In the Vercel dashboard: **New Project**, import this repo. Vercel reads `vercel.json` for
   the build command (`cd client && npm install && npm run build`) and output directory
   (`client/dist`) automatically — no manual framework configuration needed.
3. Deploy. Note the resulting URL, e.g. `https://veyza.vercel.app`.

## 3. Close the loop

Go back to the Render dashboard → `veyza-api` → Environment, and set:

```
CLIENT_URL=https://veyza.vercel.app
```

(your actual Vercel URL, no trailing slash). Render redeploys automatically on env var changes.

## 4. Verify

Open the Vercel URL and confirm:
- `/api/health` proxies correctly: visiting `https://<your-vercel-url>/api/health` should
  return `{"ok":true,"name":"VEYZA API"}`.
- You can log in with a seeded demo account (see README for credentials) and stay logged in
  across a page refresh (confirms the cookie is being set correctly through the proxy).
- First request after a period of inactivity is slow (~30-60s) — that's the free web service
  waking up, not a bug.

## Notes

- **Vercel Preview Deployments** get a unique URL per branch/PR, which won't match whatever
  single `CLIENT_URL` is set on Render, so preview deployments' API calls will be rejected by
  CORS. This setup targets the Production deployment only; if you need working previews, either
  loosen `CORS` to allow `*.vercel.app` in `server/src/index.ts`, or accept that only the
  production URL talks to the API.
- **Custom domain**: if you attach a custom domain in Vercel, update `CLIENT_URL` on Render to
  match it — the cookie/CORS setup is tied to whatever origin the browser actually loads.
- **Local development** does not need Postgres installed manually — `docker-compose.yml` at the
  repo root runs it: `docker compose up -d` (see README).
