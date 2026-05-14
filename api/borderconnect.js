export default async function handler(req, res) {
  const { path } = req.query;
  const key = req.headers['x-bc-key'] || process.env.BORDERCONNECT_API_KEY;

  if (!path) return res.status(400).json({ error: 'Missing path' });
  if (!key) return res.status(401).json({ error: 'BorderConnect API key not configured' });

  const url = 'https://www.borderconnect.com/api/' + path;
  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        'X-API-Key': key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Proxy error' });
  }
}
