export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    checked: new Date().toISOString(),
    note: 'BC API is write-only — status refresh via API not available. Blob sync active.',
  });
}
