import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const envPath = path.join(root, '.env');
let env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
  : fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const match = env.match(/^SESSION_SECRET=(.*)$/m);
if (!match || match[1].includes('replace-with') || match[1].length < 32) {
  const setting = 'SESSION_SECRET=' + crypto.randomBytes(48).toString('hex');
  env = match ? env.replace(/^SESSION_SECRET=.*$/m, setting) : env + '\n' + setting + '\n';
  fs.writeFileSync(envPath, env, { mode: 0o600 });
} else if (!fs.existsSync(envPath)) fs.writeFileSync(envPath, env, { mode: 0o600 });
await import('../database/seed.js');
console.log('Setup complete. Environment secret and persistent SQLite database are ready.');
console.log('Run npm start, then open http://localhost:3000');
