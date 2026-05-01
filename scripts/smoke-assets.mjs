/**
 * Loads theme bundles like the storefront does. If ASSETS_URL is unset,
 * serves ./public on 127.0.0.1 (random port) so `npm run smoke` works
 * without `salla theme preview`.
 *
 * ASSETS_URL=http://127.0.0.1:8001 npm run smoke   — use live preview server
 * SMOKE_HEADED=1 npm run smoke                      — headed Chromium (visual)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.html': 'text/html; charset=utf-8',
};

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

function safePublicPath(urlPathname) {
  const rel = path.normalize(decodeURIComponent(urlPathname)).replace(/^(\/+|\\+)/, '');
  const pubResolved = path.resolve(publicDir);
  const resolved = path.resolve(pubResolved, rel);
  const relToPub = path.relative(pubResolved, resolved);
  if (relToPub.startsWith('..') || path.isAbsolute(relToPub)) return null;
  return resolved;
}

function startPublicServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
        const filePath = safePublicPath(pathname.slice(1) || '');
        if (!filePath) {
          res.writeHead(403).end();
          return;
        }
        fs.readFile(filePath, (err, buf) => {
          if (err) {
            res.writeHead(404).end();
            return;
          }
          res.writeHead(200, { 'Content-Type': mimeFor(filePath) });
          res.end(buf);
        });
      } catch {
        res.writeHead(500).end();
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

function noiseWarning(text) {
  return (
    text.includes('parser-blocking') ||
    text.includes('document.write') ||
    text.includes('cross site')
  );
}

async function runSmoke(base) {
  const errors = [];
  const warnings = [];

  const headed = process.env.SMOKE_HEADED === '1';
  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 100 : 0,
  });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const t = msg.type();
    const text = msg.text();
    if (t === 'error') errors.push(text);
    if (t === 'warning' && !noiseWarning(text)) warnings.push(text);
  });
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
  page.on('requestfailed', (req) => {
    const f = req.failure();
    const u = req.url();
    if (u.includes('favicon')) return;
    errors.push(`requestfailed: ${u} ${f?.errorText || ''}`);
  });

  await page.setContent(
    `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
<link rel="stylesheet" href="${base}/app.css">
</head><body id="printer-theme" class="theme-printer rtl">
<div class="navbar"><div class="quantity"><input type="number" value="1"/></div></div>
<script defer src="${base}/product-card.js"></script>
<script defer src="${base}/app.js"></script>
</body></html>`,
    { waitUntil: 'networkidle', url: 'http://printertheme.smoke/' }
  );

  await new Promise((r) => setTimeout(r, 800));
  await browser.close();

  if (warnings.length) console.warn('warnings:\n', warnings.join('\n'));
  if (errors.length) {
    console.error('errors:\n', errors.join('\n'));
    process.exit(1);
  }
  console.log('smoke-assets: OK', base);
}

async function main() {
  const required = ['app.js', 'app.css', 'product-card.js'];
  for (const f of required) {
    const p = path.join(publicDir, f);
    if (!fs.existsSync(p)) {
      console.error(`Missing ${path.relative(process.cwd(), p)} — run: npm run production`);
      process.exit(1);
    }
  }

  let base = process.env.ASSETS_URL?.trim();
  let server = null;

  if (!base) {
    const started = await startPublicServer();
    server = started.server;
    base = started.base;
    console.log('smoke-assets: ephemeral server', base, '→', publicDir);
  }

  try {
    await runSmoke(base);
  } finally {
    server?.close();
  }
}

await main();
