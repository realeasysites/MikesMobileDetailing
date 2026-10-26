# Mike's Mobile Detailing website

Built on the Real Easy Sites **Workbench** template. Node 20 / Express / SQLite.
Booking form ("detail ticket"), bookings dashboard at `/admin`, cookieless traffic stats.

## Run locally
```
npm install
ADMIN_PASSWORD=choose-something-long npm start
```
Open http://localhost:3000 and http://localhost:3000/admin

## Deploy on Render
1. Upload this folder to a GitHub repo (node_modules and .env are ignored).
2. Render: New > Web Service > connect the repo. Build: `npm install`. Start: `npm start`.
3. Add a Disk (1 GB) mounted at `/var/data`, then set `DB_PATH=/var/data/mikes.sqlite` so requests survive deploys.
4. Environment variables (see `.env.example`): `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_URL`, `NOTIFY_EMAIL`, and the `SMTP_*` Gmail app-password settings.
5. Point Mike's own domain at the service and update `SITE_URL`, `robots.txt` and `sitemap.xml` if it isn't mikesmobiledetailingny.com.

## Notes
- Without SMTP settings the form still saves every request to the dashboard; emails are skipped.
- `/admin` is password-only. Every request can be status-tracked (new, contacted, booked, done, not a lead), noted, mapped and deleted.
- Traffic panel counts visitors, call taps, text taps and booking requests, with no cookies. Mike's own signed-in visits aren't counted.
- Photos are Mike's own (Facebook). The hero reel is his "Who's next" foam-to-finish clip with the audio removed.
