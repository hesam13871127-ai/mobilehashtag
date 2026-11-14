// Development-only screenshot comparison: original static site vs WordPress conversion.
import { chromium as pwChromium } from 'playwright';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs';

const executablePath = await chromium.executablePath();
const browser = await pwChromium.launch({ executablePath, args: [...chromium.args, '--no-sandbox'], headless: true });
const pages = process.argv.slice(2);
const outDir = '/tmp/shots';
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['orig', 'http://localhost:3000', { '/': 'index.html', '/shop.html': 'shop.html', '/about.html': 'about.html', '/contact.html': 'contact.html' }],
  ['wp', 'http://localhost:9500', { '/': '/', '/shop': '/shop/', '/about': '/about/', '/contact': '/contact/' }],
];

for (const [name, base, routes] of targets) {
  for (const [key, route] of Object.entries(routes)) {
    for (const viewport of [{ w: 1440, h: 1000, tag: 'desktop' }, { w: 390, h: 844, tag: 'mobile' }]) {
      const page = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h }, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', (e) => errors.push('JS: ' + e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
      try {
        const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(1500);
        const file = `${outDir}/${name}-${key}-${viewport.tag}.png`;
        await page.screenshot({ path: file, fullPage: true });
        console.log(JSON.stringify({ name, key, tag: viewport.tag, status: response.status(), file, errors: errors.slice(0, 8) }));
      } catch (e) {
        console.log(JSON.stringify({ name, key, tag: viewport.tag, error: e.message, errors: errors.slice(0, 5) }));
      }
      await page.close();
    }
  }
}
await browser.close();
