import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = ['backend', 'database', 'frontend', 'docs', 'scripts', 'tests'];
const files = {};
function add(relative) {
  const full = path.join(root, relative);
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(full)) add(path.join(relative, f));
    return;
  }
  if (/\.sqlite(?:-wal|-shm)?$|\.log$/.test(relative)) return;
  files['mobile-hashtag/' + relative.replaceAll('\\', '/')] = new Uint8Array(fs.readFileSync(full));
}
for (const dir of allowed) add(dir);
for (const file of [
  'README.md',
  '.env.example',
  '.gitignore',
  '.prettierrc.json',
  'package.json',
  'package-lock.json',
  'playwright.config.js',
])
  add(file);
const archive = zipSync(files, { level: 6 });
const out = path.join(root, 'deliverables');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'mobile-hashtag.zip'), archive);
const hash = crypto.createHash('sha256').update(archive).digest('hex');
fs.writeFileSync(path.join(out, 'SHA256.txt'), hash + '  mobile-hashtag.zip\n');
console.log(
  `Created deliverables/mobile-hashtag.zip: ${Object.keys(files).length} files, ${(archive.length / 1024 / 1024).toFixed(2)} MiB`
);
console.log(
  'Secrets, databases, test accounts, dependencies and generated screenshots are excluded.'
);
