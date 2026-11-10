import sharp from 'sharp';
import fs from 'node:fs';
const dir = 'frontend/assets/images';
// Panoramic desktop art keeps the full camera silhouette instead of cropping it.
const left = await sharp(`${dir}/banners/hero-phone.png`).resize({ height: 600 }).toBuffer();
const meta = await sharp(left).metadata();
const right = await sharp(left)
  .extract({ left: meta.width - 2, top: 0, width: 2, height: 600 })
  .resize(1600 - meta.width, 600, { fit: 'fill' })
  .toBuffer();
await sharp({ create: { width: 1600, height: 600, channels: 3, background: '#f2ece2' } })
  .composite([
    { input: left, left: 0, top: 0 },
    { input: right, left: meta.width, top: 0 },
  ])
  .webp({ quality: 90 })
  .toFile(`${dir}/banners/hero-phone-wide.webp`);
const phone = (color, camera, screen) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="body" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#303b46"/></linearGradient><linearGradient id="screen" x2="1" y2="1"><stop stop-color="${screen}"/><stop offset="1" stop-color="#101526"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="15" stdDeviation="11" flood-opacity=".15"/></filter></defs><rect width="600" height="600" fill="white"/><g filter="url(#s)" transform="rotate(-9 290 300)"><rect x="115" y="100" width="210" height="390" rx="23" fill="url(#body)" stroke="#8a929b" stroke-width="3"/>${camera}<rect x="285" y="115" width="190" height="370" rx="23" fill="#252a30" stroke="#9a9da0" stroke-width="3"/><rect x="293" y="124" width="174" height="352" rx="18" fill="url(#screen)"/><path d="M294 400Q420 150 465 220v180q-80-100-172 50" fill="none" stroke="${screen}" stroke-width="35" opacity=".55"/><circle cx="380" cy="137" r="4" fill="#151b25"/></g></svg>`;
const c = (x, y, r = 23) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#1e252c" stroke="#aeb7bd" stroke-width="3"/><circle cx="${x - 4}" cy="${y - 5}" r="${r * 0.5}" fill="#38495c"/>`;
const art = {
  poco: phone(
    '#596c9b',
    `<rect x="130" y="115" width="180" height="110" rx="16" fill="#222936"/>${c(164, 153)}${c(217, 153)}${c(164, 201, 15)}`,
    '#c4bb72'
  ),
  honor: phone('#9cb3c5', c(160, 155, 34) + c(160, 237, 34), '#728fba'),
  redmi: phone(
    '#8ba494',
    `<circle cx="220" cy="175" r="63" fill="#202a2a" stroke="#a5b7a8" stroke-width="3"/>${c(193, 177, 20)}${c(247, 177, 20)}`,
    '#7d9c8e'
  ),
  band: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#565e60"/><stop offset="1" stop-color="#1b2224"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="12" flood-opacity=".15"/></filter></defs><rect width="600" height="600" fill="white"/><g filter="url(#s)" transform="rotate(-22 300 300)"><rect x="232" y="70" width="136" height="460" rx="67" fill="url(#a)"/><rect x="215" y="173" width="170" height="260" rx="80" fill="#939c9f"/><rect x="222" y="180" width="156" height="246" rx="74" fill="#161c1e"/><circle cx="300" cy="279" r="51" fill="none" stroke="#bdd1a2" stroke-width="11"/><path d="M300 243v36l25 20" fill="none" stroke="#f0e7cb" stroke-width="8" stroke-linecap="round"/><rect x="266" y="360" width="68" height="8" rx="4" fill="#d9b77a"/><rect x="275" y="378" width="50" height="5" rx="2" fill="#808d89"/></g></svg>`,
};
for (const [key, source] of Object.entries(art)) {
  fs.writeFileSync(`${dir}/products/${key}.svg`, source);
  await sharp(Buffer.from(source))
    .resize(600)
    .webp({ quality: 90 })
    .toFile(`${dir}/products/${key}.webp`);
  await sharp(Buffer.from(source))
    .resize(900)
    .toBuffer()
    .then((b) =>
      sharp(b)
        .extract({ left: 130, top: 90, width: 640, height: 640 })
        .resize(600)
        .webp({ quality: 88 })
        .toFile(`${dir}/products/${key}-detail.webp`)
    );
}
console.log('Panoramic hero and individual supplementary product illustrations prepared.');
