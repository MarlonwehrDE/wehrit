export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const rateMap = new Map<string, number[]>();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const MIN_SUBMIT_TIME = 3000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) ?? []).filter(t => now - t < RATE_WINDOW);
  rateMap.set(ip, timestamps);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECT_LABELS: Record<string, string> = {
  webdesign: 'Webdesign',
  software: 'Softwareentwicklung',
  'e-rechnung': 'E-Rechnung',
  sonstiges: 'Sonstiges',
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const json = (data: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const form = await request.formData();

    // Honeypot
    if (form.get('website')) {
      return json({ ok: true });
    }

    // Time check
    const loadedAt = Number(form.get('_t'));
    if (!loadedAt || Date.now() - loadedAt < MIN_SUBMIT_TIME) {
      return json({ ok: true });
    }

    // Rate limiting
    const ip = clientAddress ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    if (isRateLimited(ip)) {
      return json({ error: 'Zu viele Anfragen. Bitte versuche es später erneut.' }, 429);
    }

    const name = (form.get('name') as string)?.trim();
    const email = (form.get('email') as string)?.trim();
    const subject = (form.get('subject') as string)?.trim();
    const message = (form.get('message') as string)?.trim();

    if (!name || !email || !message) {
      return json({ error: 'Bitte fülle alle Pflichtfelder aus.' }, 400);
    }

    if (!EMAIL_RE.test(email)) {
      return json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }, 400);
    }

    const subjectLabel = SUBJECT_LABELS[subject ?? ''] ?? subject ?? 'Kontaktanfrage';

    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: Number(import.meta.env.SMTP_PORT) || 465,
      secure: (Number(import.meta.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"WehrIT Kontaktformular" <${import.meta.env.SMTP_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to: import.meta.env.CONTACT_TO,
      subject: `[WehrIT] ${subjectLabel} — ${name}`,
      text: [
        `Name: ${name}`,
        `E-Mail: ${email}`,
        `Betreff: ${subjectLabel}`,
        '',
        message,
      ].join('\n'),
    });

    return json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' }, 500);
  }
};
