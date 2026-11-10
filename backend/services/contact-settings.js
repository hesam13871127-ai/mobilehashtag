import fs from 'node:fs';

const configPath = new URL('../config/contact.json', import.meta.url);
const value = (input, limit = 600) =>
  typeof input === 'string' ? input.trim().slice(0, limit) : '';
const reservedDomain = (host) =>
  /(?:^|\.)(?:example|invalid|test|localhost)$/.test(host) ||
  /(?:^|\.)example\.(?:com|net|org)$/.test(host);
const reservedPhone = (phone) =>
  /^\+1\d{3}55501\d{2}$/.test(phone) || /^\+442079460\d{3}$/.test(phone);

// The displayed format stays readable; destinations use an international digit-only format.
export function normalizePhone(input) {
  let number = value(input, 50)
    .replace(/[۰-۹]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c))
    .replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c))
    .replace(/[\s().-]/g, '');
  if (number.startsWith('00')) number = '+' + number.slice(2);
  if (/^0\d{10}$/.test(number)) number = '+98' + number.slice(1);
  return /^\+[1-9]\d{6,14}$/.test(number) ? number : '';
}

export function phoneLinks(input) {
  const number = normalizePhone(input);
  return number ? { tel: 'tel:' + number, whatsapp: 'https://wa.me/' + number.slice(1) } : null;
}

function social(input, network, demo) {
  const text = value(input, 300);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    )
      return null;
    const hosts =
      network === 'instagram' ? ['instagram.com', 'www.instagram.com'] : ['t.me', 'telegram.me'];
    const sample = reservedDomain(url.hostname);
    if (
      (!sample && !hosts.includes(url.hostname)) ||
      !/^\/[A-Za-z0-9_.]{1,64}\/?$/.test(url.pathname)
    )
      return null;
    return { value: url.href, href: !demo && !sample ? url.href : null, sample };
  } catch {
    return null;
  }
}

// Only these public fields can leave the server. Malformed or blank fields disappear.
export function publicContactSettings(input = {}) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const demo = raw.mode !== 'live';
  const contactNumber = (input, type) => {
    const number = normalizePhone(input);
    if (!number) return null;
    const sample = reservedPhone(number);
    return {
      value: value(input, 50),
      href: !demo && !sample ? phoneLinks(number)[type] : null,
      sample,
    };
  };
  const phone = contactNumber(raw.phone, 'tel');
  const whatsapp = contactNumber(raw.whatsapp, 'whatsapp');
  const mail = value(raw.email, 254);
  const validEmail = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/.test(mail);
  const sampleEmail = validEmail && reservedDomain(mail.split('@')[1].toLowerCase());
  const email = validEmail
    ? {
        value: mail,
        href:
          !demo && !sampleEmail ? 'mailto:' + encodeURIComponent(mail).replace('%40', '@') : null,
        sample: sampleEmail,
      }
    : null;
  const instagram = social(raw.instagram, 'instagram', demo);
  const telegram = social(raw.telegram, 'telegram', demo);
  const hasSamples = [phone, whatsapp, email, instagram, telegram].some((item) => item?.sample);
  let map = null;
  const { verified, latitude, longitude } = raw.map || {};
  if (
    !demo &&
    verified === true &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  ) {
    map = {
      latitude,
      longitude,
      href: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
    };
  }
  return {
    demo,
    hasSamples,
    storeName: value(raw.storeName, 100) || 'موبایل هشتگ',
    notice: demo
      ? 'اطلاعات تماس آزمایشی است؛ شماره‌ها و نشانی متعلق به فروشگاه واقعی نیستند. تماس و لینک‌های بیرونی غیرفعال‌اند.'
      : hasSamples
        ? 'برخی اطلاعات هنوز نمونه‌اند و لینک آن‌ها غیرفعال است.'
        : '',
    phone,
    whatsapp,
    address: value(raw.address),
    email,
    workingHours: value(raw.workingHours, 240),
    instagram,
    telegram,
    map,
  };
}

export function readContactSettings() {
  // Small public configuration, reread on request so all surfaces update together after refresh.
  return publicContactSettings(JSON.parse(fs.readFileSync(configPath, 'utf8')));
}
