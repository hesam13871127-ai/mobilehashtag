import fs from 'node:fs';
process.env.DATABASE_PATH = 'test-results/ui-test.sqlite';
process.env.SESSION_SECRET = 'ui-test-only-secret-at-least-32-characters';
fs.mkdirSync('test-results', { recursive: true });
for (const suffix of ['', '-wal', '-shm'])
  fs.rmSync(process.env.DATABASE_PATH + suffix, { force: true });
const { app } = await import('../backend/server.js');
app.listen(3100, '0.0.0.0', () => console.log('UI test server on 3100'));
