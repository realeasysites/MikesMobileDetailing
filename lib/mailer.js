const nodemailer = require('nodemailer');

let transporter = null;

function getTransport() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendLeadAlert(lead) {
  const t = getTransport();
  const to = process.env.NOTIFY_EMAIL;
  if (!t || !to) return false;
  const site = (process.env.SITE_URL || '').replace(/\/$/, '');
  const ph = String(lead.phone).replace(/[^\d+]/g, '');
  const rows = [
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['Best way to reach', lead.contact_pref],
    ['Vehicle', [lead.vehicle, lead.vehicle_size].filter(Boolean).join(' · ')],
    ['Condition', lead.vehicle_condition],
    ['Services', lead.services],
    ['Where', [lead.service_spot, lead.address].filter(Boolean).join(' · ')],
    ['Best day', lead.preferred_day],
    ['Notes', lead.details],
    ['Came from', lead.source],
  ].filter((r) => r[1]);
  const btn = (href, label, bg, fg) =>
    `<a href="${href}" style="background:${bg};color:${fg};padding:10px 16px;text-decoration:none;font-weight:bold;border-radius:6px;margin-right:8px;display:inline-block">${label}</a>`;
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:560px">` +
    `<div style="background:#0d0f12;color:#fff;padding:14px 18px;font-weight:bold;font-size:17px;border-bottom:3px solid #1f6fff">Mike's Mobile Detailing · New booking request</div>` +
    `<table cellpadding="6" style="border-collapse:collapse;font-size:15px;margin-top:10px">` +
    rows.map((r) => `<tr><td style="color:#666;vertical-align:top"><b>${esc(r[0])}</b></td><td style="white-space:pre-wrap">${esc(r[1])}</td></tr>`).join('') +
    `</table>` +
    `<p style="margin:18px 0 6px">${btn('sms:' + esc(ph), 'Text ' + esc(lead.name), '#1f6fff', '#fff')}${btn('tel:' + esc(ph), 'Call', '#0d0f12', '#fff')}</p>` +
    (site ? `<p><a href="${esc(site)}/admin">Open the dashboard</a></p>` : '') +
    `</div>`;
  const text = rows.map((r) => `${r[0]}: ${r[1]}`).join('\n') + (site ? `\n\nDashboard: ${site}/admin` : '');
  await t.sendMail({
    from: `"Mike's Mobile Detailing Website" <${process.env.SMTP_USER}>`,
    to,
    replyTo: lead.email || undefined,
    subject: `New detail request: ${lead.name}${lead.services ? ' (' + lead.services + ')' : ''}`,
    text,
    html,
  });
  return true;
}

async function sendAutoReply(lead) {
  const t = getTransport();
  if (!t || !lead.email) return false;
  const phone = process.env.PUBLIC_PHONE || '(585) 280-6693';
  await t.sendMail({
    from: `"Mike's Mobile Detailing" <${process.env.SMTP_USER}>`,
    to: lead.email,
    replyTo: process.env.NOTIFY_EMAIL || undefined,
    subject: "Got your detail request · Mike's Mobile Detailing",
    text:
      `Hi ${lead.name},\n\nThanks for reaching out. I got your request and I'll get back to you shortly with a price and a time that works.\n\n` +
      `Need me sooner? Call or text ${phone}.\n\n` +
      `Michael Howard\nMike's Mobile Detailing · Rochester, NY`,
  });
  return true;
}

module.exports = { sendLeadAlert, sendAutoReply };
