import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { otp, sig, expiry, phone } = req.body;
  if (!otp || !sig || !expiry || !phone) return res.status(400).json({ ok: false, error: 'Missing fields' });

  if (Date.now() > Number(expiry)) return res.status(400).json({ ok: false, error: 'Code expired — request a new one' });

  const secret   = process.env.OTP_SECRET;
  if (!secret)   return res.status(500).json({ ok: false, error: 'OTP not configured' });

  const expected = crypto.createHmac('sha256', secret).update(`${otp}:${expiry}:${phone}`).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
    return res.status(400).json({ ok: false, error: 'Incorrect code' });
  }

  res.json({ ok: true });
}
