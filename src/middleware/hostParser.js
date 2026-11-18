/**
 * Edge Host Header Interception Middleware
 * 
 * Intercepts incoming HTTP Host headers, extracts the tenant subdomain,
 * and attaches tenant context to the request pipeline.
 * Measures resolution latency to demonstrate sub-5ms edge overhead.
 */

const RESERVED_SUBDOMAINS = new Set([
  'app',
  'admin',
  'api',
  'www',
  'static',
  'cdn',
  'mail',
  'dashboard',
  'localhost',
]);

const hostParserMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  // 1. Resolve host from headers
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // 2. Allow query override (?tenant=slug) or header override (x-tenant-subdomain) for development/embeds
  let tenantSubdomain = req.query.tenant || req.headers['x-tenant-subdomain'] || null;

  let isPlatformHost = true;

  if (!tenantSubdomain && hostname) {
    const baseParentDomain = (process.env.BASE_PARENT_DOMAIN || '').toLowerCase().trim();
    const parts = hostname.split('.');

    // Detect custom configured parent domain (e.g. *.domain.in)
    if (baseParentDomain && hostname.endsWith(`.${baseParentDomain}`)) {
      const sub = hostname.replace(`.${baseParentDomain}`, '');
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        tenantSubdomain = sub;
        isPlatformHost = false;
      }
    }
    // Detect *.localhost (e.g. nike.localhost -> parts: ['nike', 'localhost'])
    else if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        tenantSubdomain = sub;
        isPlatformHost = false;
      }
    } 
    // Detect general wildcard subdomains (e.g. nike.domain.in or nike.platform.com)
    else if (parts.length >= 3 && !hostname.endsWith('.onrender.com') && !hostname.endsWith('.vercel.app')) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub) && sub !== 'www') {
        tenantSubdomain = sub;
        isPlatformHost = false;
      }
    }
  }

  // Calculate resolution latency in milliseconds
  const end = process.hrtime.bigint();
  const resolutionMs = Number(end - start) / 1e6;

  req.tenantSubdomain = tenantSubdomain ? tenantSubdomain.trim().toLowerCase() : null;
  req.isPlatformHost = isPlatformHost;
  req.edgeResolutionMs = resolutionMs;

  // Set diagnostic edge response headers
  res.setHeader('X-Edge-Resolution-Ms', resolutionMs.toFixed(3));
  if (req.tenantSubdomain) {
    res.setHeader('X-Tenant-Subdomain', req.tenantSubdomain);
    res.setHeader('X-Routing-Mode', 'DYNAMIC_TENANT_VIRTUALIZATION');
  } else {
    res.setHeader('X-Routing-Mode', 'CENTRAL_PLATFORM_INGRESS');
  }

  next();
};

module.exports = hostParserMiddleware;
