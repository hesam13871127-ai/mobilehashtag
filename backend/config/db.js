import 'dotenv/config';
import { DatabaseSync as Database } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../../', import.meta.url));
const filename = process.env.DATABASE_PATH || 'database/store.sqlite';
const resolved = path.resolve(root, filename);
fs.mkdirSync(path.dirname(resolved), { recursive: true });
export const db = new Database(resolved);
db.pragma = (sql) => db.exec('PRAGMA ' + sql);
db.transaction =
  (fn) =>
  (...args) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.exec(fs.readFileSync(path.join(root, 'database/schema.sql'), 'utf8'));
