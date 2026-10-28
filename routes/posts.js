// Dashboard API for the "Latest job" section (mounted under /admin/api, behind the password).
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const posts = require('../lib/posts');

const TYPES = {
  'image/jpeg': ['.jpg', 'image'],
  'image/png': ['.png', 'image'],
  'image/webp': ['.webp', 'image'],
  'video/mp4': ['.mp4', 'video'],
  'video/quicktime': ['.mov', 'video'],
  'video/webm': ['.webm', 'video'],
};

const upload = multer({
  storage: multer.diskStorage({
    destination: posts.UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, Date.now().toString(36) + '-' + crypto.randomBytes(6).toString('hex') + TYPES[file.mimetype][0]),
  }),
  limits: { files: 10, fileSize: 80 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(TYPES[file.mimetype])),
});

const router = express.Router();

router.get('/posts', (req, res) => res.json({ posts: posts.all() }));

router.post('/posts', (req, res) => {
  upload.array('media', 10)(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'One of those files is over 80 MB. Try a shorter video.' : err.code === 'LIMIT_FILE_COUNT' ? 'Up to 10 photos or videos per post.' : 'Upload failed. Try again.';
      return res.status(400).json({ ok: false, error: msg });
    }
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ ok: false, error: 'Add at least one photo or video (JPG, PNG, MP4 or MOV).' });
    const dims = (() => { try { return JSON.parse(req.body.dims || '[]'); } catch (e) { return []; } })();
    const media = files.map((f, i) => ({
      url: '/uploads/' + path.basename(f.filename),
      type: TYPES[f.mimetype][1],
      w: Number(dims[i] && dims[i][0]) || undefined,
      h: Number(dims[i] && dims[i][1]) || undefined,
    }));
    let fb = String(req.body.fb_url || '').trim().slice(0, 500);
    if (fb && !/^https:\/\/(www\.|m\.)?facebook\.com\//i.test(fb)) fb = '';
    const post = posts.create({ caption: String(req.body.caption || '').trim().slice(0, 2000), fb_url: fb, media });
    res.json({ ok: true, post });
  });
});

router.delete('/posts/:id', (req, res) => res.json({ ok: posts.remove(Number(req.params.id)) }));

module.exports = router;
