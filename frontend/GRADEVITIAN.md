# gradeVITian — deployment & layout notes

gradeVITian is the ported student-tools app (GPA / CGPA / Grade Predictor / CGPA
Estimator / Attendance) served at **`gradevitian.jayaremala.com`**. It lives inside this
Next.js app under the `app/gradevitian/**` route segment and reuses the portfolio's
design system, so it ships in the same build.

## How routing works

The site builds with `output: "export"` (fully static). That means **middleware/proxy
does not run in production** — subdomain routing is the web server's job.

- Pages export to `out/gradevitian/<page>/index.html`; shared chunks to `out/_next/`.
- All internal links are **clean** (`/gpa`, `/login`, …) — no `/gradevitian` prefix.

### Production topology

The portfolio frontend is on **GitHub Pages** (single custom domain `jayaremala.com`),
so it can't host the subdomain. Instead the **Lightsail** box (which already runs the
backend behind nginx) serves `gradevitian.jayaremala.com`:

1. CI builds `frontend/out/` (for Pages) and **rsyncs the whole export to
   `/var/www/gv-site` on Lightsail** — see the "Sync gradeVITian static export" step in
   `.github/workflows/deploy.yml` (uses `LIGHTSAIL_SSH_KEY` / `LIGHTSAIL_HOST`).
2. nginx vhost `infra/nginx/gradevitian.conf` serves that export: clean URLs map into the
   `gradevitian/` subtree, while `/_next/` and `/gradevitian/` assets resolve from the
   export root. (Why the whole export and not just `out/gradevitian`? The pages reference
   shared `/_next/...` chunks that live outside the subfolder.)

DNS: a Namecheap **A record** `gradevitian` → the Lightsail static IP. TLS via
`certbot --nginx -d gradevitian.jayaremala.com`.

CORS: ensure `https://gradevitian.jayaremala.com` is in `FRONTEND_ORIGIN` in the box's
`/home/ubuntu/itsjaya.env` (the code default already includes it).

## Local development

`next dev` **does** run `src/proxy.ts`, which emulates the subdomain:

- Clean URLs: visit `http://gradevitian.localhost:3000/`
- Or browse the segment directly: `http://localhost:3000/gradevitian/`

## Backend env

- `GV_JWT_SECRET` — required in production (signs auth tokens). Unset = ephemeral dev secret.
- `GV_DB_PATH` — **set to `/data/gradevitian.db`** on Lightsail so it lives on the mounted
  `/data` volume (the default `./chroma_db/...` is inside the container and is lost on
  redeploy). `deploy.sh` restores it from S3 and `backup.sh` backs it up nightly.
- Password-reset / welcome emails reuse the connected Gmail account (admin OAuth). If
  Gmail isn't connected, signup/reset still succeed; the email is skipped.
