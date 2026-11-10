import session from 'express-session';
import { db } from '../config/db.js';
export class SQLiteSessionStore extends session.Store {
  get(sid, cb) {
    try {
      const row = db
        .prepare('SELECT data FROM sessions WHERE sid=? AND expires>?')
        .get(sid, Date.now());
      cb(null, row ? JSON.parse(row.data) : null);
    } catch (e) {
      cb(e);
    }
  }
  set(sid, value, cb = () => {}) {
    try {
      db.prepare('INSERT OR REPLACE INTO sessions(sid,data,expires) VALUES(?,?,?)').run(
        sid,
        JSON.stringify(value),
        Date.now() + (value.cookie?.originalMaxAge || 604800000)
      );
      cb();
    } catch (e) {
      cb(e);
    }
  }
  destroy(sid, cb = () => {}) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid=?').run(sid);
      cb();
    } catch (e) {
      cb(e);
    }
  }
  touch(sid, value, cb = () => {}) {
    this.set(sid, value, cb);
  }
}
const timer = setInterval(
  () => db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now()),
  3600000
);
timer.unref();
