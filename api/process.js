export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

    const commonSubdomains = [
      'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
      'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'ns3', 'm', 'imap',
      'test', 'ns', 'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news',
      'vpn', 'ns4', 'www1', 'mail2', 'new', 'mobile', 'mysql', 'old', 'lists',
      'support', 'mobile', 'mail1', 'www3', 'web1', 'portal', 'dns', 'irc',
      'host', 'api', 'staging', 'www4', 'www5', 'beta', 'shop', 'forum',
      'cdn', 'ssh', 'demo', 'web2', 'wiki', 'web', 'root', 'mail3', 'www6'
    ];

    const discovered = [];
    const promises = commonSubdomains.map(async (sub) => {
      const subdomain = `${sub}.${cleanDomain}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`https://dns.google/resolve?name=${subdomain}&type=A`, {
          signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          const ips = data.Answer.map(a => a.data);
          discovered.push({
            subdomain,
            ips,
            status: 'resolved'
          });
        }
      } catch (e) {
        // Subdomain not found or timeout
      }
    });

    await Promise.all(promises);

    discovered.sort((a, b) => a.subdomain.localeCompare(b.subdomain));

    res.json({
      domain: cleanDomain,
      discovered: discovered.length,
      subdomains: discovered,
      scanType: 'dns-enumeration',
      wordlistSize: commonSubdomains.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to scan subdomains', message: error.message });
  }
}
