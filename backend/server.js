import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './config/db.js';
import { seed } from '../database/seed.js';
import { SQLiteSessionStore } from './services/session-store.js';
import { api } from './routes/api.js';
seed();
export const app = express();
const production = process.env.NODE_ENV === 'production';
if (
  production &&
  (!process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32 ||
    process.env.SESSION_SECRET.includes('replace-with'))
)
  throw Error('Set a unique SESSION_SECRET of at least 32 characters.');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: production ? ["'self'"] : ['*'],
        upgradeInsecureRequests: production ? [] : null,
      },
    },
    frameguard: production ? { action: 'sameorigin' } : false,
    strictTransportSecurity: production ? undefined : false,
  })
);
app.use(express.json({ limit: '32kb' }));
app.use(
  '/api',
  session({
    name: 'mh.sid',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex'),
    store: new SQLiteSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 7 * 24 * 3600000 },
  }),
  api
);
app.get('/health', (req, res) => res.json({ status: 'ok', payment: 'demo' }));
app.use(express.static(path.join(root, 'frontend'), { maxAge: production ? '1h' : 0 }));
app.use((req, res) => res.status(404).sendFile(path.join(root, 'frontend/404.html')));
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'خطایی در سرور رخ داد. دوباره تلاش کنید.' });
});
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () =>
    console.log(`Mobile Hashtag listening on port ${server.address().port} · DEMO payments only`)
  );
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
