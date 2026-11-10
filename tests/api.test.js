import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
process.env.DATABASE_PATH = 'test-results/api-test.sqlite';
process.env.SESSION_SECRET = 'test-only-session-secret-at-least-32-characters';
fs.mkdirSync('test-results', { recursive: true });
for (const suffix of ['', '-wal', '-shm'])
  fs.rmSync(process.env.DATABASE_PATH + suffix, { force: true });
const { app } = await import('../backend/server.js');
const { db } = await import('../backend/config/db.js');
let server, base, order;
function client() {
  return {
    cookie: '',
    csrf: '',
    async request(route, method = 'GET', body, token = true) {
      const headers = {};
      if (this.cookie) headers.Cookie = this.cookie;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (token && method !== 'GET') headers['X-CSRF-Token'] = this.csrf;
      const res = await fetch(base + '/api' + route, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const cookie of res.headers.getSetCookie()) this.cookie = cookie.split(';')[0];
      const json = await res.json();
      if (json.csrf) this.csrf = json.csrf;
      return { status: res.status, data: json, headers: res.headers };
    },
  };
}
const guest = client(),
  other = client();
const address = {
  recipient: 'کاربر آزمایشی',
  phone: '09123456789',
  province: 'تهران',
  city: 'تهران',
  address: 'خیابان آزمایش، کوچه تست، پلاک ۱۲',
  postal_code: '1234567890',
};
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
});
test('01 server, database and health check', async () => {
  const r = await fetch(base + '/health');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).payment, 'demo');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM products').get().n, 28);
});
test('02 all 21 HTML routes, assets and 404', async () => {
  for (const f of fs.readdirSync('frontend').filter((f) => f.endsWith('.html'))) {
    const r = await fetch(base + '/' + f);
    assert.equal(r.status, 200, f);
    assert.match(await r.text(), /lang="fa" dir="rtl"/);
  }
  assert.equal((await fetch(base + '/missing-page')).status, 404);
  for (const dir of ['products', 'banners', 'categories', 'brand', 'blog'])
    for (const file of fs.readdirSync('frontend/assets/images/' + dir)) {
      assert.equal((await fetch(`${base}/assets/images/${dir}/${file}`)).status, 200, file);
    }
  assert.equal((await fetch(base + '/.env')).status, 404);
});
test('03 session cookies and CSRF', async () => {
  const r = await guest.request('/session');
  assert.equal(r.status, 200);
  assert.equal(r.data.csrf.length, 64);
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  assert.match(r.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(
    (await guest.request('/newsletter', 'POST', { email: 'x@example.com' }, false)).status,
    403
  );
  const old = guest.csrf;
  guest.csrf = 'é'.repeat(64);
  assert.equal(
    (await guest.request('/newsletter', 'POST', { email: 'x@example.com' })).status,
    403
  );
  guest.csrf = old;
});
test('04 categories have hierarchy, unique pages and relevant products', async () => {
  const r = await guest.request('/categories');
  assert.equal(r.data.length, 47);
  assert.equal(r.data.filter((c) => !c.parent_id).length, 4);
  for (const c of r.data) {
    assert.ok(c.product_count > 0, c.slug);
    const p = await guest.request('/products?category=' + c.slug);
    assert.ok(p.data.total > 0, c.slug);
  }
});
test('05 search and parameterized injection safety', async () => {
  const r = await guest.request('/products?q=' + encodeURIComponent('آیفون'));
  assert.ok(r.data.total >= 1);
  assert.equal(
    (await guest.request('/products?q=' + encodeURIComponent("' OR 1=1 --"))).data.total,
    0
  );
  assert.equal(
    (await guest.request('/products?category=' + encodeURIComponent("';DROP TABLE products;--")))
      .data.total,
    0
  );
});
test('06 brand, price, availability and sale filters combine', async () => {
  const r = await guest.request('/products?brand=Anker&min=1000000&max=2600000&instock=1&sale=1');
  assert.ok(r.data.total >= 2);
  assert.ok(
    r.data.products.every(
      (p) =>
        p.brand === 'Anker' &&
        p.price >= 1000000 &&
        p.price <= 2600000 &&
        p.stock > 0 &&
        p.old_price > p.price
    )
  );
  assert.equal((await guest.request('/products?min=abc')).status, 400);
});
test('07 all sort options and pagination', async () => {
  for (const [sort, key, asc] of [
    ['price_asc', 'price', true],
    ['price_desc', 'price', false],
    ['newest', 'id', false],
    ['bestselling', 'sales', false],
    ['popular', 'rating', false],
  ]) {
    const r = await guest.request('/products?sort=' + sort + '&limit=24');
    assert.ok(
      r.data.products.every(
        (p, i, a) => i === 0 || (asc ? p[key] >= a[i - 1][key] : p[key] <= a[i - 1][key])
      )
    );
  }
  const a = await guest.request('/products?limit=5&page=1'),
    b = await guest.request('/products?limit=5&page=2');
  assert.equal(a.data.products.length, 5);
  assert.ok(!a.data.products.some((p) => b.data.products.some((x) => x.id === p.id)));
});
test('08 product details include structured fields, gallery and recent history', async () => {
  const r = await guest.request('/products/iphone-15-pro-max');
  assert.equal(r.status, 200);
  assert.equal(r.data.gallery.length, 2);
  assert.ok(Object.keys(r.data.specs).length >= 4);
  assert.ok(r.data.related.length);
  assert.equal((await guest.request('/recent')).data[0].id, 1);
  assert.equal((await guest.request('/products/missing')).status, 404);
});
test('09 server cart ignores client price, stores quantity and variant', async () => {
  const r = await guest.request('/cart/items', 'POST', {
    product_id: 1,
    color: 'تیتانیوم طبیعی',
    quantity: 2,
    price: 1,
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.subtotal, 2 * 89900000);
  assert.equal(r.data.shipping, 0);
  assert.equal((await guest.request('/cart')).data.count, 2);
});
test('10 invalid quantities, stock and variants rejected', async () => {
  for (const quantity of [0, -1, 1.5, 21, '2'])
    assert.equal(
      (
        await guest.request('/cart/items', 'POST', {
          product_id: 1,
          color: 'تیتانیوم طبیعی',
          quantity,
        })
      ).status,
      400
    );
  assert.equal(
    (await guest.request('/cart/items', 'POST', { product_id: 1, color: 'invalid', quantity: 1 }))
      .status,
    400
  );
  assert.equal(
    (
      await guest.request('/cart/items', 'POST', {
        product_id: 1,
        color: 'تیتانیوم مشکی',
        quantity: 11,
      })
    ).status,
    409
  );
  assert.equal(
    (await guest.request('/cart/items', 'POST', { product_id: 28, color: 'سفید', quantity: 1 }))
      .status,
    409
  );
});
test('11 update quantity and remove items; shipping calculation', async () => {
  let r = await guest.request('/cart/items/1', 'PATCH', { color: 'تیتانیوم طبیعی', quantity: 1 });
  assert.equal(r.data.count, 1);
  r = await guest.request('/cart/items/1', 'DELETE', { color: 'تیتانیوم طبیعی' });
  assert.equal(r.data.total, 0);
  r = await guest.request('/cart/items', 'POST', {
    product_id: 8,
    color: 'سبز زیتونی',
    quantity: 1,
  });
  assert.equal(r.data.subtotal, 490000);
  assert.equal(r.data.shipping, 69000);
});
test('12 persistent wishlist and duplicate safety', async () => {
  assert.equal((await guest.request('/wishlist/1', 'POST')).status, 201);
  await guest.request('/wishlist/1', 'POST');
  assert.equal((await guest.request('/wishlist')).data.length, 1);
  await guest.request('/wishlist/1', 'DELETE');
  assert.equal((await guest.request('/wishlist')).data.length, 0);
  await guest.request('/wishlist/2', 'POST');
});
test('13 registration validation, bcrypt hash and session rotation', async () => {
  assert.equal(
    (
      await guest.request('/auth/register', 'POST', {
        name: 'تست',
        email: 'bad',
        password: 'longPassword123',
      })
    ).status,
    400
  );
  assert.equal(
    (
      await guest.request('/auth/register', 'POST', {
        name: 'تست',
        email: 'buyer@example.com',
        password: 'short',
      })
    ).status,
    400
  );
  const oldCookie = guest.cookie;
  const r = await guest.request('/auth/register', 'POST', {
    name: 'خریدار آزمایشی',
    email: 'buyer@example.com',
    password: 'longPassword123',
  });
  assert.equal(r.status, 201);
  assert.notEqual(guest.cookie, oldCookie);
  assert.equal(r.data.user.password_hash, undefined);
  const row = db.prepare('SELECT password_hash FROM users WHERE id=?').get(r.data.user.id);
  assert.match(row.password_hash, /^\$2[ab]\$/);
  assert.equal((await guest.request('/cart')).data.count, 1);
  assert.equal((await guest.request('/wishlist')).data.length, 1);
});
test('14 user validation, address save/delete and account isolation', async () => {
  assert.equal(
    (await guest.request('/account', 'PATCH', { name: 'خریدار جدید', phone: 'bad' })).status,
    400
  );
  assert.equal(
    (await guest.request('/account', 'PATCH', { name: 'خریدار جدید', phone: '۰۹۱۲۳۴۵۶۷۸۹' }))
      .status,
    200
  );
  let r = await guest.request('/addresses', 'POST', { ...address, title: 'خانه' });
  assert.equal(r.status, 201);
  const id = r.data.id;
  assert.equal((await guest.request('/account')).data.addresses.length, 1);
  await other.request('/session');
  assert.equal((await other.request('/account')).status, 401);
  assert.equal((await other.request('/addresses/' + id, 'DELETE')).status, 401);
  assert.equal((await guest.request('/addresses/' + id, 'DELETE')).status, 200);
});
test('15 logout/login preserves account cart and merges guest cart', async () => {
  await guest.request('/auth/logout', 'POST');
  await guest.request('/session');
  assert.equal((await guest.request('/cart')).data.count, 0);
  await guest.request('/cart/items', 'POST', { product_id: 7, color: 'سفید', quantity: 1 });
  assert.equal(
    (await guest.request('/auth/login', 'POST', { email: 'buyer@example.com', password: 'wrong' }))
      .status,
    401
  );
  assert.equal(
    (
      await guest.request('/auth/login', 'POST', {
        email: 'buyer@example.com',
        password: 'longPassword123',
      })
    ).status,
    200
  );
  assert.equal((await guest.request('/cart')).data.count, 2);
  assert.equal((await guest.request('/wishlist')).data[0].id, 2);
});
test('16 checkout authentication and address validation', async () => {
  assert.equal(
    (
      await other.request('/orders', 'POST', {
        address,
        idempotency_key: randomUUID(),
        demo_accepted: true,
      })
    ).status,
    401
  );
  assert.equal(
    (
      await guest.request('/orders', 'POST', {
        address,
        idempotency_key: randomUUID(),
        demo_accepted: false,
      })
    ).status,
    400
  );
  assert.equal(
    (
      await guest.request('/orders', 'POST', {
        address: { ...address, postal_code: '1' },
        idempotency_key: randomUUID(),
        demo_accepted: true,
      })
    ).status,
    400
  );
});
test('17 atomic checkout, price tampering and duplicate protection', async () => {
  const before = db.prepare('SELECT stock FROM products WHERE id=8').get().stock;
  const key = randomUUID();
  const r = await guest.request('/orders', 'POST', {
    address,
    idempotency_key: key,
    demo_accepted: true,
    total: 1,
    shipping: 0,
  });
  assert.equal(r.status, 201);
  order = r.data;
  assert.equal(order.total, 490000 + 1290000 + 69000);
  assert.equal(order.status, 'demo_confirmed');
  assert.equal(order.items.length, 2);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id=8').get().stock, before - 1);
  assert.equal((await guest.request('/cart')).data.count, 0);
  const duplicate = await guest.request('/orders', 'POST', {
    address,
    idempotency_key: key,
    demo_accepted: true,
  });
  assert.equal(duplicate.data.id, order.id);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id=8').get().stock, before - 1);
});
test('18 order history, ownership and tracking with phone verification', async () => {
  assert.equal((await guest.request('/account')).data.orders.length, 1);
  assert.equal((await guest.request('/orders/' + order.id)).data.id, order.id);
  await other.request('/auth/register', 'POST', {
    name: 'کاربر دوم',
    email: 'other@example.com',
    password: 'anotherPassword123',
  });
  assert.equal((await other.request('/orders/' + order.id)).status, 404);
  assert.equal(
    (await guest.request('/tracking', 'POST', { code: order.tracking_code, phone: '09000000000' }))
      .status,
    404
  );
  const r = await guest.request('/tracking', 'POST', {
    code: order.tracking_code,
    phone: address.phone,
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.address, undefined);
  assert.equal(r.data.status, 'demo_confirmed');
});
test('19 stock races roll back order and inventory atomically', async () => {
  await guest.request('/cart/items', 'POST', { product_id: 6, color: 'مشکی', quantity: 1 });
  await guest.request('/cart/items', 'POST', { product_id: 7, color: 'سفید', quantity: 1 });
  const initial = db.prepare('SELECT stock FROM products WHERE id=6').get().stock;
  db.prepare('UPDATE products SET stock=0 WHERE id=7').run();
  const r = await guest.request('/orders', 'POST', {
    address,
    idempotency_key: randomUUID(),
    demo_accepted: true,
  });
  assert.equal(r.status, 409);
  assert.equal(db.prepare('SELECT stock FROM products WHERE id=6').get().stock, initial);
  assert.equal((await guest.request('/cart')).data.count, 2);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM orders').get().n, 1);
});
test('20 contact and newsletter validation and durable storage', async () => {
  assert.equal(
    (
      await guest.request('/contact', 'POST', {
        name: 'تست',
        email: 'x@example.com',
        message: 'short',
      })
    ).status,
    400
  );
  assert.equal(
    (
      await guest.request('/contact', 'POST', {
        name: 'تست',
        email: 'x@example.com',
        message: 'یک پیام آزمایشی برای فروشگاه',
      })
    ).status,
    201
  );
  assert.equal(db.prepare('SELECT COUNT(*) n FROM contacts').get().n, 1);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await guest.request('/newsletter', 'POST', { email: 'subscriber@example.com' })).status,
      201
    );
  assert.equal(db.prepare('SELECT COUNT(*) n FROM subscribers').get().n, 1);
});
test('21 blog and user reviews persist', async () => {
  assert.equal((await guest.request('/posts')).data.length, 3);
  assert.equal((await guest.request('/posts/phone-buying-guide')).status, 200);
  const body = { rating: 4, body: 'این یک دیدگاه آزمایشی برای بررسی ثبت نظر است.' };
  assert.equal((await guest.request('/products/1/reviews', 'POST', body)).status, 201);
  assert.equal((await guest.request('/products/iphone-15-pro-max')).data.rating, 4);
});
test('22 password change invalidates old password', async () => {
  assert.equal(
    (
      await guest.request('/account/password', 'POST', {
        current: 'wrong',
        password: 'newPassword123',
      })
    ).status,
    400
  );
  assert.equal(
    (
      await guest.request('/account/password', 'POST', {
        current: 'longPassword123',
        password: 'newPassword123',
      })
    ).status,
    200
  );
  await guest.request('/auth/logout', 'POST');
  await guest.request('/session');
  assert.equal(
    (
      await guest.request('/auth/login', 'POST', {
        email: 'buyer@example.com',
        password: 'longPassword123',
      })
    ).status,
    401
  );
  assert.equal(
    (
      await guest.request('/auth/login', 'POST', {
        email: 'buyer@example.com',
        password: 'newPassword123',
      })
    ).status,
    200
  );
});
test('23 separate process can read persisted orders and sessions', async () => {
  const script = `import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.env.DATABASE_PATH);console.log(JSON.stringify({orders:d.prepare('SELECT COUNT(*) n FROM orders').get().n,sessions:d.prepare('SELECT COUNT(*) n FROM sessions').get().n}));d.close();`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env: process.env,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0);
  const result = JSON.parse(r.stdout);
  assert.equal(result.orders, 1);
  assert.ok(result.sessions >= 2);
});
test('24 security headers and unknown API', async () => {
  const r = await fetch(base);
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal((await guest.request('/not-real')).status, 404);
});
test('25 fresh server process restores signed session and database cart', async () => {
  const { fork } = await import('node:child_process');
  const child = fork('tests/restart-server.js', [], {
    env: process.env,
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
  });
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Child startup timed out')), 10000);
      child.once('message', (m) => {
        clearTimeout(timer);
        resolve(m.port);
      });
      child.once('error', reject);
    });
    const response = await fetch(`http://127.0.0.1:${port}/api/session`, {
      headers: { Cookie: guest.cookie },
    });
    const data = await response.json();
    assert.equal(data.user.email, 'buyer@example.com');
    assert.equal(data.cart.count, 2);
    assert.ok(data.wishlist.includes(2));
  } finally {
    child.kill('SIGTERM');
  }
});
test('26 body shape, bcrypt byte limit and authenticated registration are validated', async () => {
  const c = client();
  await c.request('/session');
  assert.equal((await c.request('/auth/register', 'POST', [])).status, 400);
  assert.equal(
    (
      await c.request('/auth/register', 'POST', {
        name: 'تست',
        email: 'long@example.com',
        password: 'پ'.repeat(40),
      })
    ).status,
    400
  );
  assert.equal(
    (
      await guest.request('/auth/register', 'POST', {
        name: 'تست',
        email: 'third@example.com',
        password: 'password12345',
      })
    ).status,
    409
  );
});
