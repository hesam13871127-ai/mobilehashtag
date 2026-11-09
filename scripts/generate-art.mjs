// Mobile Hashtag — parametric SVG asset generator.
// Produces product shots, category covers, brand marks and logo files.
// Run: node scripts/generate-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => join(root, 'public', p);
const save = (p, s) => { mkdirSync(dirname(pub(p)), { recursive: true }); writeFileSync(pub(p), s); };

const uid = (() => { let n = 0; return (p) => `${p}${++n}`; })();

/** Framed 800x800 product shot: soft studio backdrop + glow + floor shadow. */
function frame(inner, { bg1 = '#F7F4EE', bg2 = '#ECE5D4', glow = '#B99552', mark = true } = {}) {
  const g = uid('g'), r = uid('r'), s = uid('s');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">
<defs>
<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
<radialGradient id="${r}" cx="0.5" cy="0.38" r="0.55"><stop offset="0" stop-color="${glow}" stop-opacity="0.35"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
<radialGradient id="${s}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#222" stop-opacity="0.28"/><stop offset="1" stop-color="#222" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="800" fill="url(#${g})"/>
<rect width="800" height="800" fill="url(#${r})"/>
${mark ? `<g opacity="0.06" fill="none" stroke="#92703B" stroke-width="26" stroke-linecap="round"><path d="M610 560 L690 240 M500 560 L580 240 M470 430 L720 430 M450 340 L700 340" transform="translate(-40,60) scale(0.9)"/></g>` : ''}
<ellipse cx="400" cy="668" rx="220" ry="34" fill="url(#${s})"/>
${inner}
</svg>`;
}

/* ---------------- device painters (drawn around center 400,380) ---------------- */

function phone({ body = '#1d1d22', edge = '#3a3a42', s1 = '#B99552', s2 = '#5b4a1f', isl = true } = {}) {
  return `<g>
    <rect x="468" y="170" width="150" height="300" rx="34" fill="#000" opacity="0.12"/>
    <rect x="252" y="150" width="240" height="490" rx="44" fill="${edge}"/>
    <rect x="258" y="156" width="228" height="478" rx="39" fill="${body}"/>
    <rect x="270" y="168" width="204" height="454" rx="30" fill="url(#ps${uid('x')}"/>
    <defs><linearGradient id="ps${uid.__n || ''}" x1="0" y1="0" x2="1" y2="1"></linearGradient></defs>
  </g>`;
}

// Simpler robust painters (no cross-def id issues: gradients defined inline per painter)
function G(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

function phoneArt(p = {}) {
  const { body = '#23232a', s1 = '#d9b96a', s2 = '#7a5f2a', cam = '#101014', isl = true } = p;
  const id = uid('p');
  return `<defs>${G(id + 's', [[0, s1], [1, s2]], 0, 0, 1, 1)}${G(id + 'b', [[0, '#3c3c46'], [0.5, body], [1, '#101014']], 0, 0, 1, 0)}</defs>
  <g>
    <rect x="478" y="196" width="132" height="270" rx="30" fill="#000" opacity="0.10"/>
    <rect x="246" y="150" width="252" height="492" rx="46" fill="url(#${id}b)"/>
    <rect x="254" y="158" width="236" height="476" rx="40" fill="#0b0b0e"/>
    <rect x="264" y="168" width="216" height="456" rx="32" fill="url(#${id}s)"/>
    <circle cx="330" cy="300" r="90" fill="#fff" opacity="0.16"/>
    <circle cx="430" cy="470" r="120" fill="#fff" opacity="0.10"/>
    <circle cx="400" cy="200" r="46" fill="#fff" opacity="0.12"/>
    ${isl ? `<rect x="348" y="182" width="96" height="26" rx="13" fill="#0b0b0e"/>` : `<circle cx="372" cy="196" r="9" fill="#0b0b0e"/>`}
    <rect x="300" y="560" width="144" height="12" rx="6" fill="#fff" opacity="0.65"/>
    <rect x="240" y="250" width="7" height="60" rx="3.5" fill="#55555f"/>
    <rect x="240" y="322" width="7" height="90" rx="3.5" fill="#55555f"/>
    <rect x="497" y="280" width="7" height="70" rx="3.5" fill="#55555f"/>
    <g><rect x="512" y="210" width="120" height="240" rx="28" fill="url(#${id}b)" opacity="0.96"/>
    <rect x="524" y="224" width="66" height="66" rx="18" fill="${cam}" stroke="#3c3c46" stroke-width="3"/>
    <circle cx="546" cy="246" r="11" fill="#1f3a5f"/><circle cx="546" cy="246" r="5" fill="#0a1626"/>
    <circle cx="568" cy="268" r="11" fill="#1f3a5f"/><circle cx="568" cy="268" r="5" fill="#0a1626"/>
    <circle cx="546" cy="268" r="4" fill="#f5e9c8"/></g>
  </g>`;
}

function earbudsArt({ case1 = '#f4f1ea', case2 = '#d9d2c2', bud = '#ffffff', tip = '#c9c2b2' } = {}) {
  const id = uid('e');
  return `<defs>${G(id + 'c', [[0, case1], [1, case2]])}${G(id + 'b', [[0, '#ffffff'], [1, '#d8d3c8']])}</defs>
  <g>
    <rect x="238" y="330" width="324" height="240" rx="72" fill="url(#${id}c)" stroke="#c9c2b2" stroke-width="3"/>
    <rect x="238" y="330" width="324" height="120" rx="60" fill="#fff" opacity="0.35"/>
    <line x1="238" y1="450" x2="562" y2="450" stroke="#b9b2a2" stroke-width="3"/>
    <rect x="368" y="444" width="64" height="12" rx="6" fill="#8f897c"/>
    <circle cx="400" cy="505" r="9" fill="#239B68"/>
    <g><ellipse cx="322" cy="252" rx="52" ry="62" fill="url(#${id}b)" stroke="#cfc9bb" stroke-width="3"/>
    <rect x="304" y="292" width="36" height="110" rx="18" fill="url(#${id}b)" stroke="#cfc9bb" stroke-width="3"/>
    <circle cx="322" cy="238" r="16" fill="${tip}"/></g>
    <g><ellipse cx="478" cy="252" rx="52" ry="62" fill="url(#${id}b)" stroke="#cfc9bb" stroke-width="3"/>
    <rect x="460" y="292" width="36" height="110" rx="18" fill="url(#${id}b)" stroke="#cfc9bb" stroke-width="3"/>
    <circle cx="478" cy="238" r="16" fill="${tip}"/></g>
  </g>`;
}

function headphonesArt({ c1 = '#2b2b33', c2 = '#101014', cush = '#B99552' } = {}) {
  const id = uid('h');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]])}</defs>
  <g>
    <path d="M250 420 C250 250 550 250 550 420" fill="none" stroke="url(#${id}c)" stroke-width="54" stroke-linecap="round"/>
    <path d="M250 420 C250 250 550 250 550 420" fill="none" stroke="${cush}" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
    <rect x="196" y="380" width="108" height="180" rx="54" fill="url(#${id}c)"/>
    <rect x="210" y="396" width="80" height="148" rx="40" fill="${cush}" opacity="0.9"/>
    <rect x="496" y="380" width="108" height="180" rx="54" fill="url(#${id}c)"/>
    <rect x="510" y="396" width="80" height="148" rx="40" fill="${cush}" opacity="0.9"/>
    <circle cx="550" cy="470" r="10" fill="#239B68"/>
  </g>`;
}

function speakerArt({ c1 = '#33333c', c2 = '#141419', ring = '#B99552' } = {}) {
  const id = uid('s');
  let dots = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++)
    dots += `<circle cx="${330 + c * 28}" cy="${290 + r * 30}" r="6" fill="#000" opacity="0.45"/>`;
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]], 0, 0, 1, 0)}</defs>
  <g>
    <rect x="292" y="220" width="216" height="360" rx="66" fill="url(#${id}c)"/>
    <rect x="292" y="220" width="216" height="360" rx="66" fill="none" stroke="${ring}" stroke-width="6" opacity="0.7"/>
    ${dots}
    <circle cx="400" cy="520" r="26" fill="none" stroke="${ring}" stroke-width="6"/>
    <circle cx="400" cy="520" r="7" fill="${ring}"/>
    <rect x="360" y="196" width="80" height="26" rx="13" fill="${ring}"/>
    <path d="M600 300 q40 60 0 120 M632 270 q60 90 0 180" stroke="${ring}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M200 300 q-40 60 0 120 M168 270 q-60 90 0 180" stroke="${ring}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>
  </g>`;
}

function chargerArt({ c1 = '#f2eee6', c2 = '#cfc7b6', cable = '#2b2b33' } = {}) {
  const id = uid('c');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]])}</defs>
  <g>
    <path d="M470 470 C560 470 560 560 470 580 C380 600 360 480 470 470 Z" fill="none" stroke="${cable}" stroke-width="22" stroke-linecap="round"/>
    <path d="M470 470 C560 470 560 560 470 580" fill="none" stroke="${cable}" stroke-width="22" stroke-linecap="round"/>
    <circle cx="470" cy="520" r="46" fill="none" stroke="${cable}" stroke-width="22"/>
    <rect x="470" y="430" width="70" height="30" rx="10" fill="#3c3c46"/>
    <rect x="252" y="300" width="220" height="190" rx="40" fill="url(#${id}c)" stroke="#b9b2a2" stroke-width="3"/>
    <rect x="300" y="252" width="22" height="62" rx="8" fill="#8f897c"/>
    <rect x="402" y="252" width="22" height="62" rx="8" fill="#8f897c"/>
    <rect x="300" y="360" width="124" height="52" rx="14" fill="#2b2b33"/>
    <rect x="312" y="372" width="44" height="14" rx="7" fill="#B99552"/>
    <rect x="368" y="372" width="44" height="14" rx="7" fill="#B99552" opacity="0.6"/>
    <text x="362" y="350" font-family="sans-serif" font-size="30" font-weight="bold" fill="#92703B" text-anchor="middle">65W</text>
  </g>`;
}

function powerbankArt({ c1 = '#2e2e37', c2 = '#131318', pct = '78' } = {}) {
  const id = uid('b');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]], 0, 0, 1, 1)}</defs>
  <g>
    <rect x="250" y="250" width="300" height="180" rx="44" fill="url(#${id}c)"/>
    <rect x="250" y="250" width="300" height="180" rx="44" fill="none" stroke="#B99552" stroke-width="5" opacity="0.8"/>
    <rect x="286" y="300" width="120" height="80" rx="16" fill="#0a0f0c"/>
    <text x="346" y="356" font-family="sans-serif" font-size="44" font-weight="bold" fill="#4ade80" text-anchor="middle">${pct}</text>
    <circle cx="470" cy="322" r="12" fill="#B99552"/><circle cx="470" cy="358" r="12" fill="#55555f"/>
    <rect x="300" y="430" width="200" height="16" rx="8" fill="#000" opacity="0.15"/>
    <rect x="270" y="470" width="120" height="60" rx="18" fill="#3c3c46"/>
    <rect x="410" y="470" width="120" height="60" rx="18" fill="#3c3c46"/>
    <path d="M330 470 v-40 M470 470 v-40" stroke="#55555f" stroke-width="10"/>
  </g>`;
}

function cableArt({ cable = '#B99552', cable2 = '#92703B' } = {}) {
  return `<g>
    <ellipse cx="400" cy="430" rx="150" ry="120" fill="none" stroke="${cable2}" stroke-width="26"/>
    <ellipse cx="400" cy="430" rx="105" ry="80" fill="none" stroke="${cable}" stroke-width="22"/>
    <ellipse cx="400" cy="430" rx="62" ry="44" fill="none" stroke="${cable2}" stroke-width="18"/>
    <path d="M540 380 L640 300" stroke="${cable}" stroke-width="24" stroke-linecap="round"/>
    <rect x="616" y="252" width="60" height="70" rx="14" fill="#3c3c46" transform="rotate(45 646 287)"/>
    <rect x="640" y="228" width="26" height="50" rx="10" fill="#a9a29a" transform="rotate(45 653 253)"/>
    <path d="M262 384 L168 460" stroke="${cable2}" stroke-width="24" stroke-linecap="round"/>
    <rect x="96" y="436" width="70" height="52" rx="14" fill="#3c3c46"/>
    <rect x="66" y="446" width="36" height="32" rx="8" fill="#a9a29a"/>
  </g>`;
}

function magsafeArt({ c1 = '#f4f1ea', c2 = '#cfc7b6' } = {}) {
  const id = uid('m');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]])}</defs>
  <g>
    <circle cx="400" cy="400" r="150" fill="url(#${id}c)" stroke="#b9b2a2" stroke-width="4"/>
    <circle cx="400" cy="400" r="112" fill="none" stroke="#B99552" stroke-width="14"/>
    <circle cx="400" cy="400" r="112" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="10 14"/>
    <circle cx="400" cy="400" r="46" fill="#2b2b33"/>
    <path d="M408 372 l-22 34 h14 l-6 24 24 -36 h-14 z" fill="#fff"/>
    <path d="M400 550 C400 620 480 620 520 580" stroke="#8f897c" stroke-width="20" fill="none" stroke-linecap="round"/>
    <rect x="510" y="552" width="64" height="34" rx="12" fill="#3c3c46"/>
  </g>`;
}

function caseArt({ c1 = '#7a2e2e', c2 = '#3d1515', pat = '#a85638' } = {}) {
  const id = uid('k');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]], 0, 0, 1, 1)}</defs>
  <g>
    <rect x="272" y="170" width="220" height="452" rx="52" fill="url(#${id}c)"/>
    <rect x="272" y="170" width="220" height="452" rx="52" fill="none" stroke="${pat}" stroke-width="6" opacity="0.7"/>
    <rect x="300" y="200" width="96" height="96" rx="26" fill="#000" opacity="0.35"/>
    <circle cx="330" cy="230" r="14" fill="#101014" stroke="#55555f" stroke-width="4"/>
    <circle cx="366" cy="230" r="14" fill="#101014" stroke="#55555f" stroke-width="4"/>
    <circle cx="330" cy="266" r="14" fill="#101014" stroke="#55555f" stroke-width="4"/>
    <circle cx="366" cy="266" r="6" fill="#f5e9c8"/>
    <path d="M300 560 q50 -26 100 0 q34 18 64 0" stroke="${pat}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M300 520 q50 -26 100 0 q34 18 64 0" stroke="${pat}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>
    <rect x="512" y="300" width="120" height="230" rx="34" fill="url(#${id}c)" opacity="0.55"/>
  </g>`;
}

function glassArt() {
  return `<g>
    <rect x="280" y="170" width="240" height="460" rx="40" fill="#dfe9f2" opacity="0.75" stroke="#9fb3c8" stroke-width="4"/>
    <path d="M300 600 L470 190 L510 190 L340 600 Z" fill="#fff" opacity="0.6"/>
    <rect x="360" y="190" width="80" height="22" rx="11" fill="#0b0b0e"/>
    <rect x="292" y="470" width="150" height="56" rx="16" fill="#2b2b33" opacity="0.9"/>
    <text x="367" y="507" font-family="sans-serif" font-size="30" font-weight="bold" fill="#fff" text-anchor="middle">9H</text>
    <circle cx="560" cy="300" r="46" fill="#B99552"/>
    <path d="M540 300 l14 14 28 -30" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function lensArt() {
  const id = uid('l');
  return `<defs>${G(id + 'c', [[0, '#3c3c46'], [1, '#101014']])}</defs>
  <g>
    <circle cx="400" cy="400" r="160" fill="url(#${id}c)"/>
    <circle cx="400" cy="400" r="160" fill="none" stroke="#B99552" stroke-width="8"/>
    <circle cx="400" cy="400" r="118" fill="#0a1626"/>
    <circle cx="400" cy="400" r="118" fill="none" stroke="#2b4a73" stroke-width="6"/>
    <circle cx="400" cy="400" r="70" fill="#12315c"/>
    <circle cx="400" cy="400" r="34" fill="#050b16"/>
    <ellipse cx="360" cy="360" rx="26" ry="14" fill="#7fb2f0" opacity="0.7" transform="rotate(-30 360 360)"/>
    <circle cx="560" cy="250" r="30" fill="#B99552" opacity="0.85"/>
    <circle cx="240" cy="560" r="18" fill="#B99552" opacity="0.5"/>
  </g>`;
}

function watchArt({ strap = '#7a2e2e', s1 = '#d9b96a', s2 = '#5b4a1f' } = {}) {
  const id = uid('w');
  return `<defs>${G(id + 's', [[0, s1], [1, s2]], 0, 0, 1, 1)}</defs>
  <g>
    <rect x="356" y="120" width="88" height="150" rx="24" fill="${strap}"/>
    <rect x="356" y="530" width="88" height="150" rx="24" fill="${strap}"/>
    <circle cx="400" cy="180" r="8" fill="#000" opacity="0.3"/><circle cx="400" cy="215" r="8" fill="#000" opacity="0.3"/>
    <circle cx="400" cy="585" r="8" fill="#000" opacity="0.3"/><circle cx="400" cy="620" r="8" fill="#000" opacity="0.3"/>
    <rect x="316" y="180" width="22" height="60" rx="10" fill="#3c3c46"/>
    <rect x="462" y="180" width="22" height="60" rx="10" fill="#3c3c46"/>
    <rect x="292" y="252" width="216" height="296" rx="56" fill="#101014"/>
    <rect x="304" y="264" width="192" height="272" rx="46" fill="url(#${id}s)"/>
    <circle cx="400" cy="400" r="86" fill="#0b0b0e" opacity="0.85"/>
    <text x="400" y="392" font-family="sans-serif" font-size="44" font-weight="bold" fill="#fff" text-anchor="middle">10:09</text>
    <text x="400" y="428" font-family="sans-serif" font-size="22" fill="#d9b96a" text-anchor="middle">FRI 24</text>
    <circle cx="400" cy="470" r="12" fill="#D94C4C"/>
    <path d="M394 470 h5 l3 -8 4 14 3 -6 h5" stroke="#fff" stroke-width="3" fill="none"/>
  </g>`;
}

function carmountArt() {
  return `<g>
    <rect x="300" y="180" width="200" height="330" rx="36" fill="#23232a"/>
    <rect x="314" y="194" width="172" height="302" rx="26" fill="#3d5a80"/>
    <circle cx="400" cy="300" r="60" fill="#fff" opacity="0.2"/>
    <path d="M340 420 L400 340 L460 420" stroke="#B99552" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="272" y="220" width="28" height="120" rx="14" fill="#3c3c46"/>
    <rect x="500" y="220" width="28" height="120" rx="14" fill="#3c3c46"/>
    <rect x="380" y="510" width="40" height="80" rx="16" fill="#3c3c46"/>
    <circle cx="400" cy="606" r="34" fill="#23232a" stroke="#B99552" stroke-width="6"/>
    <path d="M360 660 L440 660 M380 660 v-20 M420 660 v-20" stroke="#55555f" stroke-width="10" stroke-linecap="round"/>
  </g>`;
}

function controllerArt({ c1 = '#2e2e37', c2 = '#131318', ac = '#B99552' } = {}) {
  const id = uid('j');
  return `<defs>${G(id + 'c', [[0, c1], [1, c2]], 0, 0, 0, 1)}</defs>
  <g>
    <path d="M240 380 C240 320 300 300 400 300 C500 300 560 320 560 380 L520 520 C510 556 470 556 452 522 L430 470 L370 470 L348 522 C330 556 290 556 280 520 Z" fill="url(#${id}c)"/>
    <path d="M240 380 C240 320 300 300 400 300 C500 300 560 320 560 380" fill="none" stroke="${ac}" stroke-width="6"/>
    <circle cx="320" cy="390" r="26" fill="#101014" stroke="${ac}" stroke-width="5"/>
    <circle cx="480" cy="390" r="26" fill="#101014" stroke="${ac}" stroke-width="5"/>
    <rect x="292" y="440" width="56" height="18" rx="9" fill="${ac}"/>
    <rect x="311" y="421" width="18" height="56" rx="9" fill="${ac}"/>
    <circle cx="462" cy="448" r="11" fill="#D94C4C"/><circle cx="492" cy="448" r="11" fill="#239B68"/>
    <circle cx="477" cy="428" r="11" fill="#d9b96a"/><circle cx="477" cy="468" r="11" fill="#3d5a80"/>
    <circle cx="400" cy="400" r="16" fill="${ac}"/>
  </g>`;
}

function ringlightArt() {
  const id = uid('t');
  return `<defs>${G(id + 'c', [[0, '#fff7e6'], [1, '#e3c987']])}</defs>
  <g>
    <circle cx="400" cy="300" r="140" fill="none" stroke="url(#${id}c)" stroke-width="44"/>
    <circle cx="400" cy="300" r="140" fill="none" stroke="#92703B" stroke-width="6" opacity="0.5"/>
    <rect x="352" y="252" width="96" height="96" rx="20" fill="#23232a"/>
    <rect x="362" y="262" width="76" height="76" rx="12" fill="#3d5a80"/>
    <circle cx="400" cy="300" r="18" fill="#fff" opacity="0.35"/>
    <rect x="388" y="440" width="24" height="80" fill="#3c3c46"/>
    <path d="M400 520 L310 660 M400 520 L490 660 M400 520 L400 660" stroke="#3c3c46" stroke-width="20" stroke-linecap="round"/>
    <circle cx="400" cy="520" r="22" fill="#23232a"/>
  </g>`;
}

function hubArt() {
  return `<g>
    <rect x="240" y="330" width="320" height="120" rx="30" fill="#2e2e37"/>
    <rect x="240" y="330" width="320" height="120" rx="30" fill="none" stroke="#B99552" stroke-width="5" opacity="0.8"/>
    <rect x="272" y="362" width="60" height="26" rx="8" fill="#101014" stroke="#55555f" stroke-width="3"/>
    <rect x="348" y="362" width="60" height="26" rx="8" fill="#101014" stroke="#55555f" stroke-width="3"/>
    <circle cx="452" cy="375" r="15" fill="#101014" stroke="#55555f" stroke-width="3"/>
    <rect x="492" y="362" width="40" height="26" rx="8" fill="#101014" stroke="#55555f" stroke-width="3"/>
    <circle cx="292" cy="418" r="7" fill="#239B68"/>
    <path d="M560 390 C640 390 640 480 580 500" stroke="#3c3c46" stroke-width="18" fill="none" stroke-linecap="round"/>
    <rect x="540" y="484" width="70" height="34" rx="12" fill="#3c3c46"/>
  </g>`;
}

function cleanerArt() {
  return `<g>
    <rect x="300" y="260" width="130" height="300" rx="34" fill="#e8f0f7" stroke="#9fb3c8" stroke-width="4"/>
    <rect x="300" y="260" width="130" height="120" rx="34" fill="#3d5a80" opacity="0.85"/>
    <rect x="336" y="200" width="58" height="70" rx="12" fill="#2b2b33"/>
    <rect x="346" y="180" width="38" height="26" rx="8" fill="#B99552"/>
    <text x="365" y="470" font-family="sans-serif" font-size="26" font-weight="bold" fill="#92703B" text-anchor="middle">#</text>
    <rect x="450" y="380" width="120" height="180" rx="20" fill="#B99552" opacity="0.9" transform="rotate(12 510 470)"/>
    <rect x="450" y="380" width="120" height="40" rx="20" fill="#92703B" transform="rotate(12 510 470)"/>
  </g>`;
}

/* ---------------- products ---------------- */
const P = (file, art, opts) => save(`images/products/${file}`, frame(art, opts));

P('iphone-17-pro.svg', phoneArt({ s1: '#e8c876', s2: '#6b5320' }));
P('iphone-16.svg', phoneArt({ s1: '#9fc5e8', s2: '#2b4a73', isl: false }));
P('galaxy-s25-ultra.svg', phoneArt({ body: '#2a2d38', s1: '#c9ccd6', s2: '#4a4f63', isl: false }));
P('galaxy-a56.svg', phoneArt({ body: '#233026', s1: '#9fd8b4', s2: '#1f5c40', isl: false }));
P('redmi-note-14-pro.svg', phoneArt({ body: '#252b3a', s1: '#a8b8f0', s2: '#2c3a7a', isl: false }));
P('poco-x7-pro.svg', phoneArt({ body: '#2b2320', s1: '#f0c060', s2: '#7a4a10', isl: false }));
P('airpods-pro.svg', earbudsArt({}));
P('galaxy-buds-3.svg', earbudsArt({ case1: '#e8ecf4', case2: '#b9c4d6', tip: '#8fa0bd' }));
P('jbl-flip-6.svg', speakerArt({}));
P('soundcore-q30.svg', headphonesArt({}));
P('baseus-65w.svg', chargerArt({}));
P('anker-powercore-20k.svg', powerbankArt({}));
P('baseus-cable.svg', cableArt({}));
P('magsafe-charger.svg', magsafeArt({}));
P('iphone-leather-case.svg', caseArt({}));
P('samsung-case.svg', caseArt({ c1: '#2c3a5c', c2: '#121a30', pat: '#6f86c9' }));
P('tempered-glass.svg', glassArt({}));
P('lens-protector.svg', lensArt({}));
P('galaxy-watch-7.svg', watchArt({}));
P('watch-ultra-band.svg', watchArt({ strap: '#2c3a5c', s1: '#a8b8f0', s2: '#2c3a7a' }));
P('car-wireless-charger.svg', carmountArt({}));
P('gamesir-controller.svg', controllerArt({}));
P('ring-light.svg', ringlightArt({}));
P('usb-c-hub.svg', hubArt({}));
P('magsafe-powerbank.svg', powerbankArt({ c1: '#4a4438', c2: '#1c1a15', pct: '100' }));
P('soundcore-speaker.svg', speakerArt({ c1: '#24405c', c2: '#0e1c2b', ring: '#6fb3e8' }));
P('cleaning-kit.svg', cleanerArt({}));

/* ---------------- categories (600x600 covers, no text — labels rendered in HTML) ---------------- */
function cover(inner, { bg1, bg2, glow }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600"><defs>
<linearGradient id="${uid('c')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
</defs><rect width="600" height="600" fill="url(#c${''})"/>${''}</svg>`;
}
// Build covers by reusing frame() at 600 viewBox via transform wrapper:
function coverOf(painter, palette) {
  const inner = painter;
  return frame(inner, palette).replace('viewBox="0 0 800 800" width="800" height="800"', 'viewBox="100 60 600 600" width="600" height="600"');
}
const C = (file, art, bg1, bg2, glow) => save(`images/categories/${file}`, coverOf(art, { bg1, bg2, glow }));
C('mobile.svg', phoneArt({ s1: '#e8c876', s2: '#6b5320' }), '#FBF8F1', '#EFE6D2', '#B99552');
C('audio.svg', headphonesArt({}), '#F4F6FA', '#DCE4EF', '#3d5a80');
C('charger-cable.svg', chargerArt({}), '#FBF7EF', '#EFE3CB', '#B99552');
C('powerbank.svg', powerbankArt({}), '#F3F4F6', '#D9DCE3', '#55555f');
C('case-cover.svg', caseArt({}), '#FAF1F1', '#EBD5D5', '#a85638');
C('glass.svg', glassArt({}), '#F1F6FB', '#D7E6F2', '#3d5a80');
C('speaker.svg', speakerArt({}), '#F6F3EE', '#E4DCCB', '#92703B');
C('smartwatch.svg', watchArt({}), '#F4F2FA', '#DCD6EE', '#5b4a8a');
C('car.svg', carmountArt({}), '#F2F5F7', '#D5DEE4', '#4a6a80');
C('gaming.svg', controllerArt({}), '#F3F1FA', '#D8D2EC', '#5b4a8a');
C('storage.svg', hubArt({}), '#F5F4F2', '#E0DCD4', '#8a7d5b');
C('photography.svg', ringlightArt({}), '#FBF6EC', '#F0E2C4', '#B99552');
C('converter.svg', cableArt({}), '#F4F6F8', '#D9E2E9', '#3d5a80');
C('general.svg', cleanerArt({}), '#F6F5F3', '#E3DFD6', '#8a7d5b');

/* ---------------- brands ---------------- */
const brands = [
  ['apple', 'APPLE', '#222222'], ['samsung', 'SAMSUNG', '#1428A0'], ['xiaomi', 'XIAOMI', '#FF6900'],
  ['poco', 'POCO', '#FFD900'], ['anker', 'ANKER', '#00A9CE'], ['baseus', 'BASEUS', '#222222'],
  ['jbl', 'JBL', '#FF3300'], ['soundcore', 'SOUNDCORE', '#00B2FF'], ['huawei', 'HUAWEI', '#CF0A2C'],
  ['lenovo', 'LENOVO', '#E2231A'],
];
for (const [slug, name, color] of brands) {
  const dark = ['#222222', '#1428A0', '#CF0A2C', '#E2231A'].includes(color);
  save(`images/brands/${slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">
<rect width="320" height="160" rx="24" fill="#FFFFFF" stroke="#ECEAE5" stroke-width="2"/>
<circle cx="60" cy="80" r="30" fill="${color}"/>
<text x="60" y="92" font-family="Verdana,sans-serif" font-size="32" font-weight="bold" fill="${dark || color === '#FF3300' ? '#fff' : '#222'}" text-anchor="middle">${name[0]}</text>
<text x="180" y="92" font-family="Verdana,sans-serif" font-size="26" font-weight="bold" letter-spacing="3" fill="#222" text-anchor="middle">${name}</text>
</svg>`);
}

/* ---------------- logo ---------------- */
function hashtagMark(bg1, bg2, fg) {
  return `<g>
<rect x="8" y="8" width="144" height="144" rx="38" fill="url(#lg)"/>
<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<g stroke="${fg}" stroke-width="17" stroke-linecap="round">
<path d="M66 34 L54 126"/><path d="M106 34 L94 126"/>
<path d="M38 62 L122 62"/><path d="M38 98 L122 98"/>
</g>
<circle cx="122" cy="34" r="9" fill="${fg}"/>
</g>`;
}
const logoFull = (bg1, bg2, fg, sub) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160" width="520" height="160">
${hashtagMark(bg1, bg2, fg)}
<text x="330" y="86" font-family="Tahoma,Verdana,sans-serif" font-size="52" font-weight="bold" fill="#222222" text-anchor="middle">موبایل هشتگ</text>
<text x="330" y="122" font-family="Verdana,sans-serif" font-size="21" letter-spacing="6" fill="${sub}" text-anchor="middle">MOBILE HASHTAG</text>
</svg>`;
save('images/logo/logo.svg', logoFull('#D9B96A', '#92703B', '#FFFFFF', '#92703B'));
save('images/logo/logo-white.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160" width="520" height="160">
${hashtagMark('#E8D7B0', '#B99552', '#222222')}
<text x="330" y="86" font-family="Tahoma,Verdana,sans-serif" font-size="52" font-weight="bold" fill="#FFFFFF" text-anchor="middle">موبایل هشتگ</text>
<text x="330" y="122" font-family="Verdana,sans-serif" font-size="21" letter-spacing="6" fill="#E8D7B0" text-anchor="middle">MOBILE HASHTAG</text>
</svg>`);
save('images/logo/logo-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">${hashtagMark('#D9B96A', '#92703B', '#FFFFFF')}</svg>`);
save('images/logo/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="64" height="64">${hashtagMark('#D9B96A', '#92703B', '#FFFFFF')}</svg>`);

console.log('art generated');
