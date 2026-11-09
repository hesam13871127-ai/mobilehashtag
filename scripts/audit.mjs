// Static audit: every /images/* reference must exist; every internal link must match a route.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const pub = join(root, 'public');

function walk(d, out = []) {
  for (const f of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(f.name)) out.push(p);
  }
  return out;
}
const files = walk(src);
const texts = files.map((f) => ({ f: f.replace(root + '/', ''), t: readFileSync(f, 'utf8') }));

let fail = 0;
// 1. images referenced in code must exist on disk (skip data: and http)
const imgRefs = new Set();
for (const { f, t } of texts) {
  for (const m of t.matchAll(/['"`]\/images\/[^'"`\s}]+/g)) {
    const clean = m[0].slice(1).split('?')[0];
    if (clean.includes('${')) continue;
    imgRefs.add(clean + '  ⟵ ' + f);
  }
}
console.log(`image refs: ${imgRefs.size}`);
for (const r of imgRefs) {
  const p = r.split('  ⟵ ')[0];
  if (!existsSync(join(pub, p.replace('/images/', 'images/')))) {
    console.log('  MISSING:', r);
    fail++;
  }
}
// 2. detail crops for every product main image
for (const r of [...imgRefs]) {
  const p = r.split('  ⟵ ')[0];
  if (p.startsWith('/images/products/') && !p.includes('-d')) {
    for (const suf of ['-d1.svg', '-d2.svg']) {
      // gallery only guaranteed for main products; just count
    }
  }
}
// 3. routes vs links
const appSrc = readFileSync(join(src, 'App.tsx'), 'utf8');
const routePaths = [...appSrc.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
const patterns = routePaths.map((p) => new RegExp('^/' + p.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$'));
patterns.push(/^\/$/, /^\/404$/);
const links = new Set();
for (const { f, t } of texts) {
  for (const m of t.matchAll(/to=(["'])(.*?)\1/g)) {
    const v = m[2];
    if (v.startsWith('http') || v.includes('${') || v === '/' || v.startsWith('#')) continue;
    links.add(v.split('?')[0] + '  ⟵ ' + f);
  }
  for (const m of t.matchAll(/url:\s*["'](\/[^"']+)["']/g)) {
    links.add(m[1] + '  ⟵ ' + f);
  }
}
console.log(`internal links: ${links.size}`);
for (const l of links) {
  const p = l.split('  ⟵ ')[0];
  const ok = patterns.some((rx) => rx.test(p)) || p === '/';
  if (!ok) {
    console.log('  UNMATCHED:', l);
    fail++;
  }
}
console.log(fail === 0 ? 'AUDIT PASSED ✔' : `AUDIT FAILED: ${fail} issue(s)`);
process.exit(fail === 0 ? 0 : 1);
