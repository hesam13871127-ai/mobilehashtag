import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  publicContactSettings,
  normalizePhone,
  phoneLinks,
  readContactSettings,
} from '../backend/services/contact-settings.js';

const sample = JSON.parse(
  fs.readFileSync(new URL('../backend/config/contact.json', import.meta.url))
);

test('Contact configuration uses labeled, reserved demo data and no location', () => {
  const c = readContactSettings();
  assert.equal(c.demo, true);
  assert.equal(c.hasSamples, true);
  assert.match(c.notice, /آزمایشی/);
  assert.match(c.phone.value, /555 01/);
  for (const key of ['phone', 'whatsapp', 'email', 'instagram', 'telegram']) {
    assert.ok(c[key].value, key);
    assert.equal(c[key].href, null, key);
  }
  assert.match(c.email.value, /\.example$/);
  assert.match(c.address, /غیرواقعی/);
  assert.equal(c.map, null);
});

test('Phone normalization and wa.me destinations have the correct format', () => {
  // Reserved fictional ranges: URL construction is inspected, no call/message is sent.
  assert.equal(normalizePhone('۰۰۱ (۲۰۲) ۵۵۵-۰۱۴۲'), '+12025550142');
  assert.equal(normalizePhone('+١ ٢٠٢ ٥٥٥ ٠١٤٣'), '+12025550143');
  assert.deepEqual(phoneLinks('+1 (202) 555-0142'), {
    tel: 'tel:+12025550142',
    whatsapp: 'https://wa.me/12025550142',
  });
  assert.equal(normalizePhone('۰۲۱۰۰۰۰۰۰۰۰'), '+982100000000');
  for (const invalid of [
    'javascript:alert(1)',
    '12345',
    '+0000000',
    '+1/2025550142',
    '+12025550142?x=1',
    '+1234567890123456',
    null,
  ]) {
    assert.equal(phoneLinks(invalid), null);
  }
});

test('Switching mode alone never activates the shipped fictional contacts', () => {
  const c = publicContactSettings({ ...sample, mode: 'live' });
  assert.equal(c.demo, false);
  assert.equal(c.hasSamples, true);
  for (const key of ['phone', 'whatsapp', 'email', 'instagram', 'telegram'])
    assert.equal(c[key].href, null);
  assert.match(c.notice, /نمونه/);
});

test('Blank or malformed fields are omitted; only public fields are returned', () => {
  const c = publicContactSettings({
    mode: 'live',
    phone: '',
    whatsapp: '[ENTER NUMBER]',
    email: 'bad mail',
    instagram: '',
    telegram: null,
    address: '',
    workingHours: '',
    secret: 'must-not-leak',
  });
  for (const key of ['phone', 'whatsapp', 'email', 'instagram', 'telegram', 'map'])
    assert.equal(c[key], null);
  assert.equal(c.address, '');
  assert.equal(c.workingHours, '');
  assert.equal(c.secret, undefined);
  assert.equal(publicContactSettings(null).demo, true);
  assert.equal(publicContactSettings({ mode: 'typo' }).demo, true);
});

test('Unsafe or misleading social and email destinations are rejected', () => {
  for (const url of [
    'javascript:alert(1)',
    'http://instagram.com/test',
    'https://instagram.com.attacker.invalid/test',
    'https://instagram.com@evil.org/test',
    'https://instagram.com:4433/test',
    'https://instagram.com/test?next=evil',
    'https://instagram.com/',
  ]) {
    const c = publicContactSettings({ mode: 'live', instagram: url });
    // Reserved .invalid domains may be rendered as inactive samples, never followed.
    assert.equal(c.instagram?.href ?? null, null, url);
  }
  assert.equal(publicContactSettings({ email: 'x@example.com\r\nBcc:a@b.com' }).email, null);
  assert.equal(publicContactSettings({ telegram: 'https://evil.org/test' }).telegram, null);
});

test('Live allowed social profile destinations pass validation', () => {
  // Construct URLs only. Ownership/delivery is not claimed or remotely verified.
  const c = publicContactSettings({
    mode: 'live',
    instagram: 'https://www.instagram.com/mobilehashtag_test_fixture',
    telegram: 'https://t.me/mobilehashtag_test_fixture',
  });
  assert.equal(c.instagram.href, 'https://www.instagram.com/mobilehashtag_test_fixture');
  assert.equal(c.telegram.href, 'https://t.me/mobilehashtag_test_fixture');
});

test('Map requires live mode, explicit verification and exact finite coordinates', () => {
  // 0,0 is a test coordinate, not a claimed store location; never used in shipped configuration.
  const location = { verified: true, latitude: 0, longitude: 0 };
  assert.equal(publicContactSettings({ mode: 'demo', map: location }).map, null);
  assert.equal(
    publicContactSettings({ mode: 'live', map: { ...location, verified: false } }).map,
    null
  );
  for (const fields of [
    { latitude: null },
    { longitude: undefined },
    { latitude: '0' },
    { latitude: 91 },
    { longitude: 181 },
    { latitude: NaN },
  ]) {
    assert.equal(
      publicContactSettings({ mode: 'live', map: { ...location, ...fields } }).map,
      null
    );
  }
  const c = publicContactSettings({ mode: 'live', map: location });
  assert.equal(c.map.href, 'https://www.openstreetmap.org/?mlat=0&mlon=0#map=16/0/0');
});
