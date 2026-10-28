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

## Latest job section (under the hero)
- Shows Mike's newest post: caption plus every photo/video in it (photos open full-screen).
- Mike adds posts himself at `/admin` > **Post your latest job**: pick photos/videos from his phone, paste his Facebook caption, optional Facebook post link. Photos are resized on the phone before upload. Up to 10 items, 80 MB per video.
- Why not automatic: Mike's Facebook is a personal profile, and Facebook only lets websites pull posts from business Pages. If he moves to a business Page, this can switch to pulling automatically.
- Uploads are saved next to the database (`/var/data/uploads` on Render, same disk), or set `UPLOAD_DIR`. Deleting a post deletes its files.
- First boot seeds his real Oct 28 golf-cart post so the section isn't empty; delete it any time.

## Notes
- Without SMTP settings the form still saves every request to the dashboard; emails are skipped.
- `/admin` is password-only. Every request can be status-tracked (new, contacted, booked, done, not a lead), noted, mapped and deleted.
- Traffic panel counts visitors, call taps, text taps and booking requests, with no cookies. Mike's own signed-in visits aren't counted.
- Photos are Mike's own (Facebook). The hero reel is his "Who's next" foam-to-finish clip with the audio removed.
