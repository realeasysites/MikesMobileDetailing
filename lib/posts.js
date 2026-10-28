// "Latest job" posts: Mike adds the photos/videos + caption from his dashboard
// (his Facebook is a personal profile, which Facebook doesn't let sites pull from).
const fs = require('fs');
const path = require('path');
const db = require('../db/init');

// Uploads live next to the database, so on Render they sit on the same persistent disk.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.DB_PATH ? path.join(path.dirname(path.resolve(process.env.DB_PATH)), 'uploads') : path.join(__dirname, '..', 'uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    caption TEXT,
    fb_url TEXT,
    media TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`);

// First boot only: start with Mike's real latest Facebook post so the section isn't empty.
// (Recorded in meta, so deleting it from the dashboard doesn't bring it back.)
if (!db.prepare("SELECT 1 FROM meta WHERE key = 'posts_seeded'").get()) {
  db.prepare('INSERT INTO posts (caption, fb_url, media) VALUES (?, ?, ?)').run(
    'Just finished up 4 golf carts today.\nCleaned them up and got them looking sharp again. Quick turnaround, solid results.\nIf you’ve got golf carts, work vehicles, or a fleet that needs attention, I can come to you.',
    'https://www.facebook.com/people/Mack-Liyce/61564307484554/',
    JSON.stringify([{ url: '/img/posts/golf-cart-blue.jpg', type: 'image', w: 1050, h: 1400 }])
  );
  db.prepare("INSERT INTO meta (key, value) VALUES ('posts_seeded', '1')").run();
}

const parse = (row) => (row ? { ...row, media: JSON.parse(row.media || '[]') } : null);
const latest = () => parse(db.prepare('SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 1').get());
const all = () => db.prepare('SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 200').all().map(parse);

function create({ caption, fb_url, media }) {
  const id = db.prepare('INSERT INTO posts (caption, fb_url, media) VALUES (?, ?, ?)').run(caption || null, fb_url || null, JSON.stringify(media)).lastInsertRowid;
  return parse(db.prepare('SELECT * FROM posts WHERE id = ?').get(id));
}

function remove(id) {
  const row = parse(db.prepare('SELECT * FROM posts WHERE id = ?').get(id));
  if (!row) return false;
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  // only ever delete files we uploaded (never the shipped seed photo)
  row.media.forEach((m) => {
    if (m.url && m.url.startsWith('/uploads/')) {
      const f = path.join(UPLOAD_DIR, path.basename(m.url));
      fs.promises.unlink(f).catch(() => {});
    }
  });
  return true;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PROFILE = 'https://www.facebook.com/people/Mack-Liyce/61564307484554/';

function when(created) {
  const d = new Date(String(created).replace(' ', 'T') + 'Z');
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + ' days ago';
  return d.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' });
}

// Server-rendered section for the home page (no flash, and search engines see it).
function renderLatest() {
  const p = latest();
  if (!p || !p.media.length) return '';
  const media = p.media.slice(0, 10);
  const shown = media.slice(0, 5);
  const extra = media.length - shown.length;
  const cap = esc(p.caption || '').replace(/\n/g, '<br>');
  const items = shown
    .map((m, i) => {
      const more = extra > 0 && i === shown.length - 1 ? `<span class="lp-more">+${extra}</span>` : '';
      if (m.type === 'video') {
        return `<div class="lp-item lp-vid"><video src="${esc(m.url)}" muted loop playsinline controls preload="metadata"></video></div>`;
      }
      return `<button class="lp-item" type="button" data-lb data-src="${esc(m.url)}" data-cap="Latest job · photo ${i + 1} of ${media.length}"><img src="${esc(m.url)}" alt="Photo ${i + 1} from Mike's latest job" width="${m.w || 1200}" height="${m.h || 1200}" loading="lazy">${more}</button>`;
    })
    .join('');
  // photos past the 5th still open in the lightbox
  const hidden = media
    .slice(5)
    .filter((m) => m.type !== 'video')
    .map((m, i) => `<button class="lp-hidden" type="button" data-lb data-src="${esc(m.url)}" data-cap="Latest job · photo ${i + 6} of ${media.length}" tabindex="-1" aria-hidden="true"></button>`)
    .join('');
  return `
<section class="latest" id="latest" aria-labelledby="latest-h">
  <div class="shell latest-in">
    <div class="lp-card">
      <p class="lp-kicker"><span class="lp-dot" aria-hidden="true"></span>Latest job</p>
      <h2 id="latest-h">Fresh from Mike's feed.</h2>
      <div class="lp-by">
        <img src="/img/favicon.png" alt="" width="44" height="44">
        <div><b>Michael Howard</b><span>${esc(when(p.created_at))} · Mike's Mobile Detailing</span></div>
      </div>
      ${cap ? `<p class="lp-cap">${cap}</p>` : ''}
      <div class="lp-btns">
        <a class="btn btn-ink" href="#book" data-quote>Book yours</a>
        <a class="btn btn-line" href="${esc(p.fb_url || PROFILE)}" target="_blank" rel="noopener" data-social="facebook">See it on Facebook</a>
      </div>
    </div>
    <div class="lp-media n${Math.min(shown.length, 5)}">${items}${hidden}</div>
  </div>
</section>`;
}

module.exports = { UPLOAD_DIR, latest, all, create, remove, renderLatest };
