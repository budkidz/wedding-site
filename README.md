# Dingani & Gloria — Wedding Site

A single-page wedding invitation with RSVP, personalized downloadable e-vites,
separate downloadable check-in QR codes, and a staff gate scanner. React + Vite
frontend, FastAPI + PostgreSQL backend.

```text
wedding-site/
├── frontend/           React site (guest-facing, admin dashboard + staff scanner)
│   └── src/
│       ├── config.js   ← edit date, venue, timeline, capacity here
│       ├── components/
│       └── pages/
└── backend/             FastAPI API + PostgreSQL models
    └── app/
        ├── models.py
        └── routers/
```

## 1. Local setup

Open the `wedding-site` folder in VS Code (`code .`).

### Backend

Install PostgreSQL and make sure its server is running. Then open a terminal
from the project root and run:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` and set `DATABASE_URL` to your local PostgreSQL connection
string and `ADMIN_API_KEY` to a long, unique secret. Create an empty database
named `wedding` (or use a different database and update the URL):

```bash
createdb wedding
```

Generate a strong admin key with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start the API from the `backend` directory:

```powershell
uvicorn app.main:app --reload
```

Tables are created automatically on first run. The API is available at
`http://127.0.0.1:8000`; interactive docs are at
`http://127.0.0.1:8000/docs`.

### Frontend

Open a second terminal at the project root and run:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies local `/api/*` requests to the
backend. In production, `VITE_API_BASE_URL` points directly to the deployed API.
For a local end-to-end check, keep both terminals running, submit a test RSVP,
open `/admin`, approve it using the configured admin key, and verify that its
ticket page unlocks.

## 2. What to edit

- **`frontend/src/config.js`** — wedding date, venue name and maps link,
  timeline, and guest capacity.
- **`frontend/public/images/`** — replace the reference photos with your own,
  preserving filenames or updating the corresponding paths in the frontend.
- **Background music** — add `frontend/public/audio/preview.mp3` for the hero
  music toggle.

## 3. How the pieces fit together

- Each RSVP is for one person and is saved in PostgreSQL via `POST /rsvp`.
  New attending RSVPs stay pending until an admin approves them. Approval
  creates the unique `ticket_code` and unlocks the guest's `/ticket/:id` page;
  no SMS or email is sent. Each accompanying guest must submit their own RSVP.
- Admins can open `/admin`, enter the backend `ADMIN_API_KEY`, browse and search
  RSVP records, filter by response status, and approve pending invitations.
  The key is kept in the current browser tab's session storage and is never
  included in the frontend build.
- Optionally, set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` on the backend to
  get a Telegram message whenever a guest RSVPs "yes" and awaits approval.
  Create a bot with @BotFather, send it a message, then find your chat ID in
  `https://api.telegram.org/bot<TOKEN>/getUpdates`. Failures never affect the RSVP.
- Pending RSVPs also have a **Reject** button (with a confirmation prompt) that
  permanently deletes the request and frees the phone number.
- Approved guests get a **Send on WhatsApp** button in the dashboard. It opens
  WhatsApp with a pre-filled message containing the guest's ticket link; you
  press send from your own WhatsApp.
- After approval, `/ticket/:id` displays the personalized e-vite and unique
  check-in QR code separately. Guests can download the e-vite and QR code as
  separate images; the QR can be scanned at `/staff/check-in`.
- Declined RSVPs are saved but do not receive an attendance ticket.
- Existing RSVP records are marked approved on startup migration so previously
  issued tickets remain valid.
- Phone numbers are unique after removing spaces and punctuation and converting
  Zambian `+260` / `00260` prefixes to local `0` format.
- Staff can scan the guest QR code at `/staff/check-in`. This page is not linked
  publicly, but is not access-controlled; protect it before the event. If the
  camera cannot read a QR displayed on a screen, staff can upload the guest's
  downloaded QR image instead.
- The RSVP section and check-in page display counts from the API.

## 4. Free hosting: Netlify + Render + Supabase

The React site is hosted on Netlify, the FastAPI backend on Render, and RSVP
data in a Supabase PostgreSQL database. Free-tier quotas, availability, and
provider terms can change; confirm current limits and backup/retention policies
before relying on free services for an event.

### A. Put the project in a GitHub repository

Netlify and Render deploy from a Git provider.

1. Create a GitHub repository for this project, or use its existing repository.
2. Make sure the latest project changes are pushed to the branch you intend to
   deploy.
3. Confirm `backend/.env`, service-account keys, and other credentials are not
   committed. They are private local files; enter production secrets only in
   the hosting provider's environment-variable settings.

### B. Create the Supabase PostgreSQL database

1. Sign in to Supabase and select **New project**.
2. Choose an organization, enter a project name, create a strong database
   password, and select a region near the backend host. Save the password in a
   password manager; do not put it in the repository.
3. Wait until the project is ready, then open **Connect** in the project
   dashboard.
4. Select the PostgreSQL **Session pooler** connection string and copy the
   complete URI. Use the URI exactly as provided (including SSL parameters, if
   present); do not share it or commit it. The pooler is useful when the backend
   host cannot connect to Supabase's direct database host over IPv6.

The app creates its tables and normalized-phone uniqueness index when the API
starts for the first time.

### C. Deploy the FastAPI backend to Render

1. Sign in to Render and choose **New → Blueprint** (or the current option to
   deploy a Blueprint).
2. Connect GitHub and grant Render access to the repository from step A.
3. Select this repository. Render reads the root `render.yaml` file, which sets
   the backend root directory, install/start commands, health check, and free
   web-service plan.
4. When asked for Blueprint environment values, paste the Supabase Session
   pooler URI into `DATABASE_URL`. Set `ADMIN_API_KEY` to a long, unique secret
   and `CORS_ORIGINS` temporarily to `https://example.netlify.app`; replace it
   with the real Netlify URL after step D.
5. Create/deploy the service and wait for it to finish. Copy the Render service
   origin, for example `https://your-api.onrender.com` (no trailing slash).
6. Open `https://your-api.onrender.com/health` in a browser. A successful
   service responds with `{"status":"ok"}`.

If Render did not prompt for environment values, open the service's
**Environment** settings, add `DATABASE_URL`, `ADMIN_API_KEY`, and
`CORS_ORIGINS`, save, and redeploy. Never put the database URL or admin key in
frontend variables.

### D. Deploy the React frontend to Netlify

1. Sign in to Netlify and choose **Add new site / Import an existing project**.
2. Connect GitHub and select the same repository.
3. Netlify reads `netlify.toml` for the `frontend` base directory, build
   command, publish directory, and Node version.
4. Add `VITE_API_BASE_URL` as an environment variable. Set its value to the
   Render API origin copied in step C (for example,
   `https://your-api.onrender.com`), without a trailing slash or `/api` suffix.
   This value is required in production; local development uses Vite's `/api`
   proxy automatically.
5. Deploy the site. Netlify assigns a URL like `https://your-site.netlify.app`.
   The `frontend/public/_redirects` file is included to make direct links and
   refreshes on routes such as `/ticket/<id>` work.

### E. Allow the Netlify site to call the API

1. Copy the exact Netlify site origin (scheme and host only, no path or trailing
   slash), for example `https://your-site.netlify.app`.
2. In Render, open the backend service's **Environment** settings and set
   `CORS_ORIGINS` to that origin.
3. If using more than one trusted origin, separate them with commas. Include a
   custom domain's origin if you configure one. Do not use `*` for this value.
4. Save the change and wait for Render to restart/redeploy the API.

### F. Test the deployed setup before inviting guests

1. Open the Netlify URL and confirm the homepage and **Open in maps** link work.
2. Submit one attending RSVP using a test phone number. Each person must submit
   their own RSVP; an attending RSVP counts as one guest.
3. Confirm the ticket page shows the awaiting-approval message. Open `/admin`,
   sign in with `ADMIN_API_KEY`, and approve the test RSVP.
4. Reload its ticket page and confirm the e-vite plus **Download E-vite** and
   **Download QR Code** work.
5. On `/staff/check-in`, test the camera and the **Upload QR image** fallback
   with the downloaded QR. Confirm the guest name is displayed and the checked
   in total changes.
6. Test a declined RSVP and the duplicate-phone validation. Use only test
   details; an accepted RSVP occupies a place in the database.
7. In Supabase **Table Editor**, inspect the `rsvps` table and confirm the test
   record exists. Remove test records through the dashboard before launch if
   desired, taking care not to delete real RSVPs.

The Render free web service may spin down after inactivity, so the first
request can be delayed. Staff need internet access at the venue. Camera access
requires a secure context such as the HTTPS Netlify URL and browser permission.
Keep a separate guest-list export/backup; free services may not provide
production-level uptime or permanent data retention.

## 5. Before the wedding

- **Protect `/staff/check-in`.** Anyone who knows the URL can currently use the
  scanner. Add authentication or otherwise restrict access.
- **Keep `ADMIN_API_KEY` private.** Set it only on the backend, use a unique
  random value, and rotate it if it is exposed.
- **Swap the photos.** Replace the watermarked reference images in
  `frontend/public/images/`.
- **Migrations.** `Base.metadata.create_all()` is used for startup convenience;
  for long-term production use Alembic so schema changes do not require
  dropping data.
