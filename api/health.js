export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'healthy', service: 'Subdomain Finder', timestamp: new Date().toISOString() });
}
