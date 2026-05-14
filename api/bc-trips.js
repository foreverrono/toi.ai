import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (req.method === 'GET') return res.status(200).json({ manifests: [], source: 'unconfigured' });
    if (req.method === 'POST') return res.status(200).json({ ok: true, note: 'blob-not-configured' });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'bc-manifests', token });
      if (!blobs.length) return res.status(200).json({ manifests: [], source: 'empty' });
      const r = await fetch(blobs[0].url);
      const manifests = await r.json();
      return res.status(200).json({ manifests, source: 'blob' });
    } catch (err) {
      return res.status(200).json({ manifests: [], error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { manifests } = req.body;
      if (!Array.isArray(manifests)) return res.status(400).json({ error: 'manifests must be an array' });
      await put('bc-manifests.json', JSON.stringify(manifests), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        token,
      });
      return res.status(200).json({ ok: true, count: manifests.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
