export default async function handler(req, res) {
  const { path } = req.query;
  const key = req.headers['x-samsara-key'] || process.env.SAMSARA_API_KEY;

  if (!path) return res.status(400).json({ error: 'Missing path' });
  if (!key) return res.status(401).json({ error: 'Samsara API key not configured' });

  const url = 'https://api.samsara.com' + path;
  try {
    const upstream = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + key,
        'Accept': 'application/json',
      },
    });
    const text = await upstream.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Proxy error' });
  }
}
