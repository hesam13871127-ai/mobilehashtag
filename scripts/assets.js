import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const base = 'frontend/assets/images';
const svg = (body, bg = '#fff') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#e9e9e6"/><stop offset=".5" stop-color="#a5a9ac"/><stop offset="1" stop-color="#e8e9e5"/></linearGradient><linearGradient id="dark" x2="1" y2="1"><stop stop-color="#53585b"/><stop offset="1" stop-color="#191d20"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="15" flood-opacity=".13"/></filter><pattern id="mesh" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#303438"/><circle cx="3" cy="3" r="1.2" fill="#64686a"/></pattern></defs><rect width="600" height="600" fill="${bg}"/>${body}</svg>`;
const shapes = {
  speaker: `<g transform="rotate(-22 300 300)" filter="url(#s)"><rect x="120" y="190" width="360" height="220" rx="80" fill="url(#mesh)"/><ellipse cx="146" cy="300" rx="35" ry="98" fill="#24282a"/><ellipse cx="457" cy="300" rx="29" ry="96" fill="url(#dark)"/><rect x="282" y="265" width="62" height="65" rx="6" fill="#d55332"/><text x="313" y="308" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="26" fill="white">JBL</text></g>`,
  cable: `<g fill="none" stroke="#e2e0da" stroke-width="22" filter="url(#s)"><path d="M190 155v165c0 150 225 150 225 0s-170-110-170 0 110 95 110 0V140"/></g><g fill="url(#metal)"><rect x="162" y="85" width="56" height="95" rx="12"/><rect x="326" y="80" width="56" height="95" rx="12"/></g><rect x="172" y="66" width="36" height="35" rx="9" fill="#383c3e"/><rect x="336" y="62" width="36" height="35" rx="9" fill="#383c3e"/>`,
  glass: `<g transform="rotate(17 300 300)" filter="url(#s)"><rect x="185" y="85" width="230" height="420" rx="36" fill="#f4f9fa" stroke="#9aa7ad" stroke-width="5"/><rect x="265" y="99" width="70" height="14" rx="7" fill="#373b3c"/><path d="M201 420L395 140M215 451L395 191" stroke="#fff" stroke-width="20"/></g>`,
  lens: `<g filter="url(#s)" transform="rotate(15 300 300)"><rect x="150" y="150" width="300" height="300" rx="65" fill="url(#metal)"/>${[
    [235, 240],
    [355, 305],
    [235, 365],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="49" fill="#20292d" stroke="#777f83" stroke-width="8"/><circle cx="${x}" cy="${y}" r="33" fill="#222f3b"/><circle cx="${x - 10}" cy="${y - 12}" r="12" fill="#687d8b"/>`
    )
    .join('')}</g>`,
  holder: `<g filter="url(#s)"><ellipse cx="300" cy="469" rx="139" ry="32" fill="url(#metal)"/><path d="M285 465L300 270" stroke="#92989b" stroke-width="30"/><rect x="212" y="117" width="180" height="230" rx="25" fill="url(#dark)" transform="rotate(10 300 230)"/><path d="M227 310v30h150v-30" fill="none" stroke="#b4b8b9" stroke-width="13"/></g>`,
  memory: `<g transform="rotate(-15 300 300)" filter="url(#s)"><path d="M210 140h142l44 49v271H210z" fill="#282c2f"/><rect x="225" y="245" width="156" height="150" rx="7" fill="#b84038"/><text x="302" y="313" text-anchor="middle" font-family="sans-serif" font-size="32" font-weight="bold" fill="#fff">128 GB</text>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${226 + i * 24}" y="160" width="17" height="48" rx="3" fill="#c9a44c"/>`).join('')}</g>`,
  flash: `<g transform="rotate(30 300 300)" filter="url(#s)"><rect x="245" y="190" width="110" height="280" rx="28" fill="url(#metal)"/><rect x="251" y="110" width="98" height="107" rx="4" fill="#b4b7b7"/><rect x="264" y="132" width="27" height="28" fill="#313737"/><rect x="309" y="132" width="27" height="28" fill="#313737"/><circle cx="300" cy="425" r="17" fill="#fff"/></g>`,
  tablet: `<g transform="rotate(-8 300 300)" filter="url(#s)"><rect x="100" y="125" width="400" height="300" rx="24" fill="url(#metal)"/><rect x="112" y="137" width="376" height="276" rx="16" fill="#282d42"/><path d="M115 360Q270 90 485 200V412H115z" fill="#b3a8ba"/><path d="M115 412Q270 200 485 310V412z" fill="#dad0cb"/></g>`,
  pen: `<g transform="rotate(35 300 300)" filter="url(#s)"><rect x="280" y="70" width="40" height="400" rx="20" fill="#efeeea" stroke="#b9b9b6"/><path d="M280 450L300 515l20-65" fill="#d7d5cd"/><path d="M294 495l6 20 6-20" fill="#555"/></g>`,
  gamepad: `<g filter="url(#s)"><path d="M175 190Q140 185 115 260L80 365Q80 430 135 410l85-65h160l85 65q55 20 55-45l-35-105q-25-75-60-70z" fill="#e4e4df" stroke="#bfc2c1" stroke-width="3"/><circle cx="224" cy="308" r="35" fill="#323739"/><circle cx="365" cy="308" r="35" fill="#323739"/><path d="M170 224v70m-35-35h70" stroke="#303538" stroke-width="20"/>${[
    [424, 225],
    [451, 252],
    [397, 252],
    [424, 280],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#737d83"/>`)
    .join('')}</g>`,
  tracker: `<g filter="url(#s)"><circle cx="300" cy="300" r="130" fill="#f0f0ec" stroke="#c8c9c8" stroke-width="4"/><circle cx="300" cy="300" r="99" fill="url(#metal)"/><circle cx="300" cy="300" r="19" fill="#7d8588"/></g>`,
  strap: `<g transform="rotate(20 300 300)" filter="url(#s)"><rect x="245" y="70" width="110" height="220" rx="30" fill="#b9ad95"/><rect x="245" y="305" width="110" height="230" rx="35" fill="#b9ad95"/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="300" cy="${345 + i * 34}" rx="9" ry="5" fill="#fff"/>`).join('')}<rect x="260" y="92" width="80" height="44" rx="7" fill="none" stroke="#d1d4d1" stroke-width="10"/></g>`,
  earbuds: `<g fill="none" stroke="#dddeda" stroke-width="9" filter="url(#s)"><path d="M220 210v140q0 90 80 90t80-90V210M300 440v100"/></g><g fill="#e9eae7" stroke="#bbb" stroke-width="2"><rect x="195" y="125" width="38" height="130" rx="18"/><ellipse cx="214" cy="140" rx="44" ry="34"/><rect x="367" y="125" width="38" height="130" rx="18"/><ellipse cx="386" cy="140" rx="44" ry="34"/></g>`,
  adapter: `<g filter="url(#s)"><rect x="130" y="225" width="340" height="150" rx="35" fill="url(#metal)"/>${[0, 1, 2].map((i) => `<rect x="${175 + i * 85}" y="277" width="55" height="35" rx="5" fill="#333a3e"/>`).join('')}<path d="M150 240Q110 110 300 110" stroke="#bbb" stroke-width="15" fill="none"/><rect x="290" y="90" width="77" height="40" rx="9" fill="#b7babc"/></g>`,
};
for (const [key, body] of Object.entries(shapes))
  fs.writeFileSync(`${base}/products/${key}.svg`, svg(body));
for (const file of fs
  .readdirSync(`${base}/products`)
  .filter((f) => f.endsWith('.png') || f.endsWith('.svg'))) {
  const key = path.parse(file).name;
  await sharp(`${base}/products/${file}`)
    .resize(600, 600, { fit: 'contain', background: '#fff' })
    .webp({ quality: 88 })
    .toFile(`${base}/products/${key}.webp`);
  await sharp(await sharp(`${base}/products/${file}`).resize(900, 900, { fit: 'cover' }).toBuffer())
    .extract({ left: 130, top: 90, width: 640, height: 640 })
    .resize(600)
    .webp({ quality: 86 })
    .toFile(`${base}/products/${key}-detail.webp`);
}
const mark = `<path d="M27 4h42a12 12 0 0 1 12 12v64a12 12 0 0 1-12 12H27A12 12 0 0 1 15 80V16A12 12 0 0 1 27 4z" fill="none" stroke="#c9a44c" stroke-width="5"/><g stroke="#c9a44c" stroke-width="7" stroke-linecap="round"><path d="M40 26L33 70M61 26L54 70M27 40h42M24 57h42"/></g><path d="M41 83h14" stroke="#c9a44c" stroke-width="3" stroke-linecap="round"/>`;
fs.writeFileSync(
  `${base}/brand/symbol.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${mark}</svg>`
);
fs.writeFileSync(
  `${base}/brand/logo-horizontal.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 100">${mark}<text x="105" y="48" fill="#222" font-family="sans-serif" font-size="29" font-weight="bold">MOBILE HASHTAG</text><text x="108" y="72" fill="#a78335" font-family="sans-serif" font-size="12" letter-spacing="5">SMARTER CHOICES</text></svg>`
);
await sharp(`${base}/brand/symbol.svg`).resize(64).png().toFile('frontend/favicon.png');
await sharp(`${base}/brand/symbol.svg`).resize(192).png().toFile(`${base}/brand/mobile-logo.png`);
await sharp(`${base}/banners/hero-phone.png`)
  .resize(1600)
  .webp({ quality: 88 })
  .toFile(`${base}/banners/hero-phone.webp`);
const campaigns = [
  ['audio', 'headphones', '#ede9e2'],
  ['watch', 'watch', '#e9eeec'],
  ['power', 'powerbank', '#edece8'],
  ['airpods', 'airpods', '#f1f0eb'],
  ['case', 'case', '#eaf0ea'],
  ['charger', 'charger', '#efeeeb'],
  ['speaker', 'speaker', '#e5e8ed'],
];
for (let i = 0; i < campaigns.length; i++) {
  const [key, product, color] = campaigns[i];
  const w = i < 3 ? 1400 : 800,
    h = i < 3 ? 700 : 480;
  const bg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><circle cx="${w * 0.23}" cy="${h * 0.5}" r="${h * 0.38}" fill="none" stroke="#c9a44c" stroke-opacity=".25" stroke-width="2"/><ellipse cx="${w * 0.25}" cy="${h * 0.85}" rx="${w * 0.22}" ry="${h * 0.07}" fill="#000" opacity=".04"/></svg>`
  );
  const image = await sharp(`${base}/products/${product}.webp`)
    .resize(Math.round(h * 0.9))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let j = 0; j < image.data.length; j += 4) {
    const m = Math.min(image.data[j], image.data[j + 1], image.data[j + 2]);
    if (m > 242) image.data[j + 3] = Math.round(((255 - m) / 13) * 255);
  }
  const png = await sharp(image.data, { raw: image.info }).png().toBuffer();
  await sharp(bg)
    .composite([{ input: png, left: Math.round(w * 0.03), top: Math.round(h * 0.05) }])
    .webp({ quality: 90 })
    .toFile(`${base}/banners/${key}.webp`);
}
const cats = [
  'iphone',
  'headphones',
  'watch',
  'airpods',
  'powerbank',
  'charger',
  'case',
  'speaker',
  'tablet',
  'cable',
  'gamepad',
  'memory',
];
for (const k of cats)
  await sharp(`${base}/products/${k}.webp`)
    .resize(240)
    .webp({ quality: 85 })
    .toFile(`${base}/categories/${k}.webp`);
for (const [key, prod, bg] of [
  ['phone-guide', 'samsung', '#eeeae2'],
  ['audio-guide', 'headphones', '#e6e9e6'],
  ['battery-guide', 'powerbank', '#e9e7e1'],
]) {
  const p = await sharp(`${base}/products/${prod}.webp`).resize(420).toBuffer();
  await sharp({ create: { width: 800, height: 460, channels: 3, background: bg } })
    .composite([{ input: p, left: 190, top: 20, blend: 'multiply' }])
    .webp({ quality: 85 })
    .toFile(`${base}/blog/${key}.webp`);
}
for (const weight of [400, 500, 600, 700, 800])
  for (const subset of ['arabic', 'latin'])
    fs.copyFileSync(
      `node_modules/@fontsource/vazirmatn/files/vazirmatn-${subset}-${weight}-normal.woff2`,
      `frontend/assets/fonts/vazirmatn-${subset}-${weight}.woff2`
    );
fs.copyFileSync('node_modules/@fontsource/vazirmatn/LICENSE', 'frontend/assets/fonts/OFL.txt');
console.log('Local images, galleries, banners, category art, brand package and fonts ready.');
fs.copyFileSync(
  'node_modules/@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff2',
  'frontend/assets/fonts/symbols.woff2'
);
fs.copyFileSync(
  'node_modules/@fontsource/noto-sans-symbols-2/LICENSE',
  'frontend/assets/fonts/SYMBOLS-OFL.txt'
);
for (const [brand, word] of Object.entries({
  Apple: 'apple',
  Samsung: 'SAMSUNG',
  Xiaomi: 'xiaomi',
  Sony: 'SONY',
  Anker: 'ANKER',
  JBL: 'JBL',
}))
  fs.writeFileSync(
    `${base}/brand/${brand.toLowerCase()}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 50"><text x="85" y="35" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${brand === 'Samsung' ? 26 : 32}" fill="#92928d">${word}</text></svg>`
  );
