import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const secret = process.env.OTP_SECRET;
  const sid    = process.env.TWILIO_ACCOUNT_SID;
  const token  = process.env.TWILIO_AUTH_TOKEN;
  const from   = process.env.TWILIO_PHONE_NUMBER;

  if (!secret) return res.status(500).json({ error: 'OTP not configured' });

  const otp    = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + 5 * 60 * 1000;
  const sig    = crypto.createHmac('sha256', secret).update(`${otp}:${expiry}:${phone}`).digest('hex');

  if (sid && token && from) {
    try {
      const body = new URLSearchParams({ To: phone, From: from, Body: `Your PackFastTMS code is ${otp}. Valid 5 min.` });
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      if (!r.ok) {
        const err = await r.json();
        return res.status(500).json({ error: err.message || 'SMS failed' });
      }
    } catch (e) {
      return res.status(500).json({ error: e.message || 'SMS error' });
    }
  } else {
    /* Dev mode — no Twilio configured, log OTP to console only */
    console.log(`[PackFastTMS 2FA] OTP for ${phone}: ${otp}`);
  }

  res.json({ sig, expiry });
}
