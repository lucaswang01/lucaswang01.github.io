// Original illustrations for Math Go. All artwork is drawn locally with SVG.
// Named groups make each little dinosaur easy to animate with CSS.
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const outline = '#243f40';
const palettes = {
  sprig: { skin: '#82b969', shade: '#5c9252', light: '#c7dda0', accent: '#f4cb73' },
  brook: { skin: '#7bbbc9', shade: '#4f94a8', light: '#c8e7dd', accent: '#efb170' },
  pebble: { skin: '#d89662', shade: '#b26b45', light: '#efc792', accent: '#a79477' },
  breeze: { skin: '#93a963', shade: '#697c48', light: '#d0d799', accent: '#edbb72' },
  bloom: { skin: '#cc999c', shade: '#a37180', light: '#eed0bb', accent: '#78aaa1' },
  crystal: { skin: '#9c9ec8', shade: '#777eab', light: '#d3d6e9', accent: '#a8dcca' },
  ember: { skin: '#dea066', shade: '#b6764e', light: '#f3d2a0', accent: '#e4bc58' },
};

function eye(x, y, flip = false) {
  return `<g class="dino-eye" transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}"><ellipse rx="7.2" ry="9" fill="${outline}" stroke="none"/><circle cx="2" cy="-3" r="2.5" fill="#fffdf4" stroke="none"/><path d="M-7-13q7-4 13 0" fill="none" stroke-width="2.3" stroke-linecap="round"/></g>`;
}

function toes(x, y, count = 2) {
  return `<g stroke-width="2" stroke-linecap="round">${Array.from({length: count}, (_, i) => `<path d="M${x + i * 8} ${y}v5"/>`).join('')}</g>`;
}

function sprig(p) {
  return `
    <g class="dino-tail"><path d="M74 133Q35 154 17 115Q13 153 62 169" fill="${p.shade}"/><path d="M23 127q-7-16 2-23q13 7 7 20" fill="${p.skin}"/></g>
    <g class="dino-body">
      <path d="M64 139l-3 39q0 12 17 10l14-2l4-28m46-9l6 32q3 10 19 6l7-5l-9-40" fill="${p.shade}"/>
      <ellipse cx="107" cy="132" rx="58" ry="39" fill="${p.skin}"/>
      <path d="M57 143q39 17 85 0l-1 29q-26 13-50-1" fill="${p.light}" stroke="none"/>
      <path d="M62 143l-4 36q0 12 21 10q12 0 12-10l2-21m37-4l6 26q3 12 24 6q8-3 4-13l-8-28" fill="${p.skin}"/>
      ${toes(66,181)}${toes(145,178)}
      <path d="M72 116l7-3m13-3l6-1m-24 17l7-2" fill="none" stroke="${p.shade}" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g class="dino-head">
      <path d="M122 123q-19-13-14-31q-11-14 3-26q-1-16 15-20q9-15 23-6q17-8 25 6q15 1 19 16q14 9 8 25q10 15-5 26l-26 25Z" fill="${p.shade}"/>
      <path d="M123 113q-12-14-5-28q-5-13 8-20q3-17 16-12q13-7 21 6q19-1 21 18q15 14 1 33" fill="${p.light}" stroke="none"/>
      <path d="M143 79q28-9 37 17l9 14q26-4 28 15q3 24-36 26q-30 1-48-17q-11-13-4-34" fill="${p.skin}"/>
      <path d="M162 89l4-32q16 14 11 38m18 20l13-23q11 16 1 29" fill="#fff0d1"/>
      <path d="M141 88l-4-24q-11 7-9 25" fill="#fff0d1"/>
      ${eye(159,111)}
      <ellipse cx="178" cy="130" rx="9" ry="5" fill="#dfa383" stroke="none" opacity=".7"/>
      <path d="M192 137q10 0 14-5m-3-9h1" fill="none" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M135 49q-8-17-22-12q-1 15 20 17m3-6q4-17 19-15q3 17-18 22" fill="#b8ce80" stroke-width="2"/>
    </g>`;
}

function brook(p) {
  return `
    <g class="dino-tail"><path d="M73 132Q33 146 23 104q-16 44 42 59" fill="${p.shade}"/></g>
    <g class="dino-body">
      <path d="M73 147l-3 33q1 10 19 9l8-40m27-2l9 35q3 9 17 5l4-6l-7-36" fill="${p.shade}"/>
      <ellipse cx="104" cy="140" rx="51" ry="34" fill="${p.skin}"/>
      <path d="M67 149q35 15 73-1l-4 22q-26 6-56-1" fill="${p.light}" stroke="none"/>
      <path d="M60 148l-3 35q2 9 24 8q8-1 8-10l3-20m35-6l2 25q2 10 24 7q8-1 6-10l-8-30" fill="${p.skin}"/>
      ${toes(65,184)}${toes(139,180)}
      <ellipse cx="80" cy="129" rx="8" ry="5" fill="${p.shade}" stroke="none"/><ellipse cx="104" cy="119" rx="6" ry="4" fill="${p.shade}" stroke="none"/>
    </g>
    <g class="dino-head">
      <path d="M119 145q17-30 13-79q-14-9-11-23q3-22 33-20q31-4 37 19q15 2 17 17q-1 19-33 19q-1 48-16 74" fill="${p.skin}"/>
      <path d="M153 145q13-34 10-71q9 5 14 3q-2 49-16 73" fill="${p.light}" stroke="none"/>
      <path d="M131 24q-7-12 2-17q14 0 13 14m7 0q0-15 12-16q10 10 2 19" fill="${p.accent}"/>
      ${eye(161,46)}
      <ellipse cx="180" cy="62" rx="9" ry="5" fill="#eab797" stroke="none" opacity=".85"/>
      <path d="M189 67q10-1 12-5m-2-13h1" fill="none" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M137 96q16 10 33 4m-36 8q17 10 33 4" fill="none" stroke="#e7c378" stroke-width="5"/>
      <path d="M165 102l5 13l-10-4l-5 9l-1-16" fill="#e7c378" stroke-width="2"/>
    </g>`;
}

function pebble(p) {
  return `
    <g class="dino-tail"><path d="M67 139Q34 142 27 161l-12-2q5-31 48-41" fill="${p.shade}"/><path d="M11 151l-7 9l7 14l18 2l8-12l-7-14Z" fill="${p.accent}"/></g>
    <g class="dino-body">
      <path d="M63 146l-1 34q3 9 21 7l6-31m40-3l5 30q5 7 19 3l4-8l-7-26" fill="${p.shade}"/>
      <path d="M44 139q-2-47 54-49q54-4 70 45l-13 27l-82 4Z" fill="${p.skin}"/>
      <path d="M44 132q2-35 31-39l-1-11l18-10l16 11l13-10l18 13l-1 12q22 11 29 34l-18 7l-20-9l-19 7l-22-9l-18 12Z" fill="${p.accent}"/>
      <path d="M48 121l24-11l17 18m-15-35l14 17l20-8l2-19m0 19l19 7l9-11m-9 11l1 21m-42-20l-1 18" fill="none" stroke="#766e57" stroke-width="2.5"/>
      <path d="M68 146l-7 34q0 11 23 10q10-1 11-11l3-20m25-3l2 25q1 10 24 7q10-2 6-13l-6-23" fill="${p.skin}"/>
      ${toes(71,182)}${toes(135,181)}
    </g>
    <g class="dino-head">
      <path d="M157 118l-4-16l15-5l11 15m5 0l10-15l11 8l-3 15" fill="${p.accent}"/>
      <path d="M153 113q26-17 46 3l7 9q23-3 24 15q0 19-30 20q-31 2-50-16q-11-18 3-31" fill="${p.skin}"/>
      <path d="M153 113q26-17 46 3l-13 5l-13-5l-15 10" fill="${p.accent}" stroke="none"/>
      ${eye(181,132)}
      <ellipse cx="197" cy="148" rx="8" ry="4" fill="#edb99b" stroke="none"/>
      <path d="M213 148q8 0 11-4m-4-9h1" fill="none" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M89 83q-8-17 5-25q13 13 8 25m0-5q7-13 18-9q-2 13-17 17" fill="#aabd77" stroke-width="2"/>
    </g>`;
}

function breeze(p) {
  return `
    <g class="dino-tail"><path d="M101 155l-23 34l27-13l11-18" fill="${p.shade}"/></g>
    <g class="dino-wing dino-wing-back"><path d="M133 109q30-62 90-56q-26 29-15 69q-18-16-32 3q-9-15-25 5Z" fill="${p.shade}"/><path d="M142 112l69-47l-39 58" fill="none" stroke="#b6c183" stroke-width="3"/></g>
    <g class="dino-body"><ellipse cx="122" cy="132" rx="29" ry="37" transform="rotate(-15 122 132)" fill="${p.skin}"/><ellipse cx="133" cy="141" rx="16" ry="22" fill="${p.light}" stroke="none"/><path d="M111 164l-8 17l12 3m18-19l2 14l13-1" fill="none" stroke-width="5" stroke-linecap="round"/></g>
    <g class="dino-wing"><path d="M111 116Q81 66 18 53q16 36 0 72q25-14 41 8q23-13 41 7Z" fill="${p.skin}"/><path d="M108 119L29 65l29 65m50-11l-3 18" fill="none" stroke="${p.shade}" stroke-width="3"/><path d="M35 83q-7 16-6 26q17-2 29 13l26-3Z" fill="${p.light}" stroke="none" opacity=".7"/></g>
    <g class="dino-head"><path d="M122 72L103 39q32 3 43 29" fill="${p.shade}"/><path d="M119 72q9-20 30-13q26 4 23 28l-6 16q-14 17-32 4q-26-8-15-35" fill="${p.skin}"/><path d="M165 81l49 18l-48 9q9-13-1-27" fill="${p.accent}"/>${eye(148,81)}<ellipse cx="151" cy="101" rx="8" ry="4" fill="#d8b391" stroke="none"/><path d="M171 95l24 5" fill="none" stroke-width="2"/><path d="M120 61q-17-14-11-25q16 4 19 18" fill="#d0d799" stroke-width="2"/></g>`;
}

function bloom(p) {
  return `
    <g class="dino-tail"><path d="M90 141Q41 160 23 125q-5 44 72 45" fill="${p.shade}"/></g>
    <g class="dino-body"><path d="M99 148l-3 36q1 9 23 6l8-35m25-19l7 42q4 9 25 4l-13-40" fill="${p.shade}"/><path d="M81 140q4-29 39-40l28 1l18 23l-8 41q-58 20-77-25" fill="${p.skin}"/><path d="M130 114q-8 32 23 44l10-18l-15-29" fill="${p.light}" stroke="none"/><path d="M108 150l-8 37q1 11 25 6q10-2 8-10l2-27m-8-33l-7 20l15 8" fill="${p.skin}"/>${toes(112,186)}<path d="M92 126l7-4m6-6l6-2" stroke="${p.shade}" stroke-width="4" stroke-linecap="round"/></g>
    <g class="dino-head"><path d="M144 57Q105 30 70 59q32-2 53 25" fill="${p.accent}"/><path d="M143 64Q107 43 84 56" fill="none" stroke="#b6d4b9" stroke-width="5"/><path d="M126 122l-1-39q1-30 34-29q31 1 30 28l9 16q26 0 24 18q-1 13-30 13q-21 0-36-13l2 30" fill="${p.skin}"/>${eye(167,84)}<ellipse cx="181" cy="105" rx="9" ry="5" fill="#ecbca9" stroke="none"/><path d="M202 117q9 0 14-4m-7-10h1" fill="none" stroke-width="2.5" stroke-linecap="round"/><g transform="translate(128 80)" fill="#eccc8f" stroke-width="1.7"><ellipse cy="-8" rx="5" ry="9"/><ellipse cy="-8" rx="5" ry="9" transform="rotate(72)"/><ellipse cy="-8" rx="5" ry="9" transform="rotate(144)"/><ellipse cy="-8" rx="5" ry="9" transform="rotate(216)"/><ellipse cy="-8" rx="5" ry="9" transform="rotate(288)"/><circle r="5" fill="#a77461"/></g></g>`;
}

function crystal(p) {
  return `
    <g class="dino-tail"><path d="M69 148Q39 170 12 133q-4 34 55 42" fill="${p.shade}"/><path d="M23 153l-14-21l17 8m7 22l-2-25l13 20" fill="${p.accent}" stroke-width="2"/></g>
    <g class="dino-body"><path d="M63 146l-1 39q3 8 22 4l7-34m49-5l4 36q3 6 18 1l6-7l-10-27" fill="${p.shade}"/><g fill="${p.accent}"><path d="M51 122l-4-24l17-15l17 29"/><path d="M70 106l5-33l23-16l13 44"/><path d="M104 99l13-40l20 13l5 37"/><path d="M137 113l18-30l14 16l-7 30"/></g><g fill="none" stroke="#679b98" stroke-width="2"><path d="M65 105l-1-22m24 14l10-40m21 45l-2-43m31 59l7-35"/></g><ellipse cx="107" cy="139" rx="62" ry="36" fill="${p.skin}"/><path d="M58 145q45 22 87 0l-6 27H80" fill="${p.light}" stroke="none"/><path d="M60 150l-5 34q1 12 26 9q9-1 9-10l4-24m37-6l2 29q2 11 24 7q9-2 5-14l-9-23" fill="${p.skin}"/>${toes(65,184)}${toes(143,182)}<path d="M77 126l8-3m14-5l8 1m-18 16l8-2" stroke="${p.shade}" stroke-width="4" stroke-linecap="round"/></g>
    <g class="dino-head"><path d="M148 131q5-25 31-25q27 1 28 22q22 1 22 16q1 17-28 19q-40-1-53-23Z" fill="${p.skin}"/>${eye(184,131)}<ellipse cx="197" cy="149" rx="8" ry="4" fill="#d6b4bd" stroke="none"/><path d="M212 152q8-1 11-5m-5-11h1" fill="none" stroke-width="2.5" stroke-linecap="round"/></g>`;
}

function ember(p) {
  return `
    <g class="dino-tail"><path d="M100 136Q51 168 22 140q6 39 90 29" fill="${p.shade}"/><path d="M48 155l-1-13l13 8m7 12l3-16l13 10" fill="${p.accent}"/></g>
    <g class="dino-body"><path d="M112 154l-12 29q-3 12 22 10l13-21m26-22l9 32q5 9 26 3l-8-12l-9-33" fill="${p.shade}"/><path d="M87 144q1-31 36-42l29-8l28 21l-6 40q-10 26-49 20q-31-3-38-31" fill="${p.skin}"/><path d="M139 115q-12 26 28 43l8-19l-14-28" fill="${p.light}" stroke="none"/><path d="M119 151l-12 35q-3 12 28 9l8-8l-2-18m22-45l12 7l9-7" fill="${p.skin}"/>${toes(121,187,3)}<path d="M103 131l8-3m5-9l7-2" stroke="${p.shade}" stroke-width="4" stroke-linecap="round"/></g>
    <g class="dino-head"><path d="M120 77l-6-19l19 3l3-19l19 12l13-12l10 20" fill="${p.accent}"/><path d="M123 75q2-26 38-25q29-2 36 22l8 13q26-1 24 22q-2 21-31 24q-45 5-65-18l-11-17Z" fill="${p.skin}"/><path d="M168 119q26 10 48-3" fill="none" stroke-width="2.5" stroke-linecap="round"/><path d="M180 122l5 8l5-7m11-2l6 6l3-9" fill="#fff5dc" stroke-width="1.7"/>${eye(174,86)}<ellipse cx="193" cy="106" rx="10" ry="5" fill="#eec095" stroke="none"/><path d="M219 96h1" stroke-width="3" stroke-linecap="round"/><path d="M134 71l9-4m8-2l7 1" stroke="${p.shade}" stroke-width="3" stroke-linecap="round"/></g>`;
}

const painters = { sprig, brook, pebble, breeze, bloom, crystal, ember };
const names = { sprig: 'Sprig, the leafy triceratops', brook: 'Brook, the river longneck', pebble: 'Pebble, the rock ankylosaurus', breeze: 'Fernwing, the forest pterosaur', bloom: 'Blossom, the flower parasaurolophus', crystal: 'Prismback, the crystal stegosaurus', ember: 'Suncrest, the sunny tyrannosaurus' };

export function dinoArt(id, { variant = 'normal', className = '', label = '' } = {}) {
  const key = Object.hasOwn(painters, id) ? id : 'sprig';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 220" class="dino-art dino-${key} variant-${esc(variant)} ${esc(className)}" role="img" aria-label="${esc(label || names[key])}"><ellipse class="dino-shadow" cx="123" cy="195" rx="70" ry="10" fill="#243f40" opacity=".1"/><g fill="none" stroke="${outline}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${painters[key](palettes[key])}</g></svg>`;
}

export function heroArt({ color = 'teal', gear = 'field' } = {}) {
  const coats = { teal: '#558f87', rust: '#bc7959', plum: '#9283a5', gold: '#cca55e', blue: '#759ab7' };
  const coat = coats[color] || coats.teal;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 220" class="hero-art gear-${esc(gear)}" role="img" aria-label="Your dinosaur explorer"><ellipse cx="120" cy="203" rx="47" ry="8" fill="#243f40" opacity=".12"/><g stroke="${outline}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M77 117q-14-13-21 3l-1 42q7 11 29 4" fill="#ac7958"/><path d="M97 156l-5 34q-18 2-15 12h33l9-40m9-1l4 35h28q8-9-9-13l-5-29" fill="#687674"/><path d="M88 114q31-12 60 1l13 43q-38 13-81 0Z" fill="${coat}"/><path d="M92 118l-18 27l-12-9q-10-5-14 5q-1 8 9 13l16 8q9 4 16-8l10-15m46-20l15 29l15-7q13-4 13 8q-1 8-11 11l-18 5q-7 1-11-7l-10-17" fill="${coat}"/><path d="M105 121l12 18l13-20" fill="#edc77e"/><path d="M83 158q35 8 72 0" fill="none" stroke="#bc9e74" stroke-width="7"/><rect x="119" y="153" width="12" height="12" rx="2" fill="#e8c47c"/><path d="M107 101v20q14 12 26-1v-19" fill="#d7a17d"/><ellipse cx="117" cy="76" rx="37" ry="39" fill="#e6b58e"/><path d="M81 83q-8-46 32-48q41-1 41 42l-12-6l-5-15q-13 18-41 12l-3 16" fill="#655044"/><path d="M68 56q3-19 38-20q44-1 61 21q-34 15-99-1" fill="#dcc28e"/><path d="M83 48l8-22q27-15 49 3l10 22" fill="#e8d5ac"/><path d="M86 44q31 9 60 2" fill="none" stroke="#6e9380" stroke-width="7"/><ellipse cx="102" cy="84" rx="4" ry="5" fill="${outline}" stroke="none"/><ellipse cx="133" cy="84" rx="4" ry="5" fill="${outline}" stroke="none"/><path d="M109 100q10 8 20-2" fill="none" stroke-width="2.5"/><path d="M90 96h8m37 0h8" stroke="#cd8e77" stroke-width="5"/><path d="M90 120l-6 34" stroke="#bc9e74" stroke-width="5"/><path d="M176 150l-2 51" stroke="#8a684f" stroke-width="5"/><path d="M175 150q14-14 22-5q-1 12-22 13" fill="#87a966" stroke-width="2"/></g></svg>`;
}

const icons = {
  leaf: '<path d="M20 4C8 2 3 8 5 15c2 7 13 7 15-11Z"/><path d="m4 21 12-12M9 16v-5m4 2h5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  book: '<path d="M12 5q-5-4-10-1v15q5-3 10 1q5-4 10-1V4q-5-3-10 1Zm0 0v15"/>',
  backpack: '<rect x="5" y="5" width="14" height="17" rx="5"/><path d="M9 5V4a3 3 0 0 1 6 0v1M5 11H3v7h2m14-7h2v7h-2"/><rect x="8" y="13" width="8" height="6" rx="2"/>',
  shield: '<path d="m12 2 8 3v7q0 7-8 10q-8-3-8-10V5Zm-4 9 3 3 5-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  home: '<path d="m3 10 9-8 9 8v11h-7v-7h-4v7H3Z"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01" stroke-width="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  droplet: '<path d="M12 2q10 12 8 16a9 9 0 0 1-16 0Q2 14 12 2Z"/>',
  gem: '<path d="m7 3-5 6 10 13L22 9l-5-6Zm-5 6h20M7 3l5 19 5-19"/>',
  trophy: '<path d="M7 3h10v8a5 5 0 0 1-10 0ZM7 5H3v4q0 5 5 5m9-9h4v4q0 5-5 5m-4 2v5m-5 0h10"/>',
  paw: '<ellipse cx="12" cy="16" rx="7" ry="5"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="11" cy="5" rx="2" ry="3"/><ellipse cx="17" cy="6" rx="2" ry="3"/><ellipse cx="21" cy="11" rx="2" ry="3"/>',
  settings: '<path d="m10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
};

export function icon(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.spark}</svg>`;
}

function tree(x, y, scale = 1, fill = '#638b62') {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 10v60" stroke="#647455" stroke-width="10" stroke-linecap="round"/><path d="M-7 39l-23-17m26 28l28-22" stroke="#647455" stroke-width="5" stroke-linecap="round"/><path d="M-46 11q-15-30 10-43q0-33 32-29q31-13 43 18q34 2 27 36q16 34-17 43q-10 26-41 9q-35 15-42-15q-24 3-22-19" fill="${fill}"/><path d="M-31-21q17-21 39-14m-39 51q15 12 30 3m24-27q16 1 18-11" fill="none" stroke="#d8e2a0" stroke-width="5" stroke-linecap="round" opacity=".3"/></g>`;
}

function fern(x, y, scale = 1, fill = '#59846b') {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}"><path d="M0 44Q-4-1-35-20Q-45-3-28 9q-27-4-27 9q10 19 42 15Q-3 39 0 44ZM0 44Q4-1 35-20Q45-3 28 9q27-4 27 9q-10 19-42 15Q3 39 0 44Z"/><path d="M0 48Q-10-7 0-40Q14-13 0 48Z"/></g>`;
}

function crystals(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#6c8c95" stroke-width="2" stroke-linejoin="round"><path d="m-19 25-8-48 14-20 14 21 1 48" fill="#a1cbd0"/><path d="m-8 29 1-70 15-27 17 26-9 73" fill="#c2d9da"/><path d="m14 31 10-42 16-12 7 20-17 37" fill="#9eb7cc"/><path d="m8-68 3 96m13-39 5 41m-42-73 5 70" fill="none" opacity=".6"/></g>`;
}

function grass(x, y, scale = 1, fill = '#8d9d6d') {
  return `<path transform="translate(${x} ${y}) scale(${scale})" d="M-11 0q2-15-6-25q19 6 17 25q2-25 13-30q-6 14-4 30q6-15 18-14Q12-8 13 0Z" fill="${fill}"/>`;
}

export function sceneArt(habitatId = 'fern') {
  const colors = {
    fern: {sky:'#d9e7d4', far:'#b7cba6', hills:'#91b08a', ground:'#ccd4a6', foliage:'#4c795d'},
    river: {sky:'#dcebec', far:'#b4d1c9', hills:'#8cafab', ground:'#c7d6b6', foliage:'#547f74'},
    crystal: {sky:'#e4e2ef', far:'#c1bfd7', hills:'#a1aac5', ground:'#d1d2d7', foliage:'#708b8a'},
    summit: {sky:'#f5e5c5', far:'#d8c3a6', hills:'#b3b59b', ground:'#ded1a2', foliage:'#81936b'},
  };
  const c = colors[habitatId] || colors.fern;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" class="scene-art scene-${esc(habitatId)}" role="img" aria-label="A peaceful dinosaur nature habitat" preserveAspectRatio="xMidYMid slice"><rect width="1200" height="520" fill="${c.sky}"/><circle cx="947" cy="94" r="43" fill="#fff6da" opacity=".8"/><g fill="#fffdf1" opacity=".5"><path d="M110 72q25-22 53 0q24-12 42 7H95Z"/><path d="M690 52q27-23 50 1q21-14 38 10H676Z"/></g><path d="M0 259 114 150l118 86L397 69l191 181L778 139l149 101l141-103l132 118v265H0Z" fill="${c.far}"/><path d="m344 127 53-58 57 54-25-5-19 12-16-24-24 25Z" fill="#fbf4e1" opacity=".55"/><path d="M0 318q135-134 282-49q124-113 309-14q142-96 286-1q185-102 323 36v230H0Z" fill="${c.hills}"/><path d="M0 369q185-63 380-3q204-89 411-10q226-81 409 12v152H0Z" fill="${c.ground}"/>${habitatId === 'river' ? '<path d="M619 266q-129 49-51 74q96 27-61 71q-104 29-85 109h429q-111-55-64-83q92-47-69-94q-115-27-59-77Z" fill="#94c3ca"/><path d="M594 285q-57 21-28 34m101 62q-67 4-99 32m-61 64q79-15 141-5" fill="none" stroke="#d9eddf" stroke-width="5" stroke-linecap="round"/>' : '<path d="M695 315q-225 67-95 115q96 37 199 90H603q-154-52-96-102q58-47 188-103" fill="#f0e4bd" opacity=".7"/>'}${tree(66,218,1.9,c.foliage)}${tree(1141,206,2.2,c.foliage)}${tree(184,259,.95,c.foliage)}${tree(1036,282,.95,c.foliage)}${habitatId === 'crystal' ? crystals(269,321,1.8)+crystals(972,353,2.1)+crystals(1068,418,1.1) : ''}${habitatId === 'summit' ? '<path d="m830 355 14-48 35-24 44 20 23 47Z" fill="#a4a490"/><path d="m831 355 48-29 67 24" fill="none" stroke="#c6c5a9" stroke-width="5"/>' : ''}<ellipse cx="313" cy="434" rx="180" ry="46" fill="#e3dfb9" opacity=".8"/><ellipse cx="885" cy="368" rx="160" ry="36" fill="#e3dfb9" opacity=".75"/>${fern(38,465,1.6,c.foliage)}${fern(1157,466,1.8,c.foliage)}${grass(191,408)}${grass(723,470,1.1)}${grass(1015,410)}<g fill="#edc779"><circle cx="127" cy="421" r="5"/><circle cx="148" cy="434" r="4"/><circle cx="1094" cy="432" r="5"/><circle cx="1115" cy="416" r="4"/></g></svg>`;
}

export function islandMap() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" class="island-map-art" role="img" aria-label="Dinosaur island, with Fernwood in the southwest, Ripple River in the center, Crystal Cavern in the southeast, and Sunstone Summit in the northeast"><rect width="1200" height="700" fill="#c6ddd8"/><path d="M0 89q250 74 476-13t448 7t276-25M0 617q247-75 460 0t471-7t269 9" fill="none" stroke="#e1eeDF" stroke-width="4" opacity=".6"/><path d="M185 533q-73-7-47-101q-68-82 0-152q-21-99 94-121q37-73 152-49q120-84 212-18q118-59 204-19q87-46 159 41q110-9 111 98q93 76 26 157q72 86-20 165q-11 96-125 80q-83 85-218 24q-86 52-203 6q-139 37-227-41q-103 30-118-70Z" fill="#a5c8bd" stroke="#e9ead0" stroke-width="31"/><path d="M185 513q-73-7-47-101q-68-82 0-152q-21-99 94-121q37-73 152-49q120-84 212-18q118-59 204-19q87-46 159 41q110-9 111 98q93 76 26 157q72 86-20 165q-11 96-125 80q-83 85-218 24q-86 52-203 6q-139 37-227-41q-103 30-118-70Z" fill="#d3d9ac" stroke="#f1e9c9" stroke-width="7"/><path d="M253 185q57-39 112-7q51-48 107-6q44 62-23 99q-38 58-121 12q-71 19-90-32Z" fill="#bdc997"/><path d="M712 365q145-53 247 23q60 68 5 141q-91 49-191-3q-111 18-102-58Z" fill="#b9c5b4"/><path d="M640 200q-74 50-38 104q58 85-32 123q-87 51-42 132q22 35 30 69" fill="none" stroke="#93bdbe" stroke-width="43"/><path d="M637 201q-66 55-31 104q58 85-33 124q-85 50-41 129q23 39 29 69" fill="none" stroke="#b2d5cf" stroke-width="24"/><path d="M621 255l-3 9m-13 75l12 11m-38 77l-14 11m-36 88l4 16" fill="none" stroke="#e4ece0" stroke-width="4" stroke-linecap="round"/><path d="M267 475Q337 394 452 401q106-1 157-57q117-37 248 99M620 343q123-88 213-186" fill="none" stroke="#f1e3b8" stroke-width="19" stroke-linecap="round"/><path d="M267 475Q337 394 452 401q106-1 157-57q117-37 248 99M620 343q123-88 213-186" fill="none" stroke="#bea881" stroke-width="2" stroke-dasharray="2 11" stroke-linecap="round"/><g transform="translate(570 378) rotate(-34)"><rect x="-35" y="-29" width="70" height="58" rx="4" fill="#b99b70" stroke="#816f54" stroke-width="3"/><path d="M-27-28v56m13-56v56m14-56v56m14-56v56m13-56v56" stroke="#816f54" stroke-width="2"/><path d="M-39-24h78m-78 48h78" stroke="#e8c794" stroke-width="6"/></g><g fill="#91a38b" stroke="#d5d4b0" stroke-width="3" stroke-linejoin="round"><path d="m658 209 93-136 99 140Z"/><path d="m742 223 113-160 118 158Z"/><path d="m885 223 52-102 73 113Z"/></g><path d="m718 120 33-47 34 47-20-5-14 14-16-18Zm103-9 34-48 37 50-22-6-16 14-17-17" fill="#f4ecd3"/>${tree(204,304,.8,'#739366')}${tree(271,335,.95,'#69885e')}${tree(213,386,.68,'#608760')}${tree(362,298,.6,'#83a16a')}${tree(340,516,.7,'#819962')}${tree(170,466,.68,'#648660')}${tree(414,207,.85,'#8aab79')}${tree(338,152,.65,'#88a475')}${tree(502,172,.56,'#91aa78')}${tree(651,509,.66,'#829e75')}${tree(748,569,.45,'#829e75')}${tree(973,309,.72,'#8ea489')}${tree(1030,395,.54,'#89a284')}${crystals(816,409,.8)}${crystals(953,452,.9)}${crystals(906,537,.7)}${crystals(749,474,.55)}${grass(427,504,1.1)}${grass(361,437,.8)}${grass(710,281,.8)}${grass(661,169,.65)}${grass(514,238,.8)}<g fill="#e9c57d"><circle cx="379" cy="457" r="5"/><circle cx="396" cy="448" r="4"/><circle cx="354" cy="455" r="4"/><circle cx="700" cy="542" r="5"/><circle cx="710" cy="551" r="4"/></g><g fill="#91b5ad"><ellipse cx="99" cy="546" rx="15" ry="5"/><ellipse cx="1028" cy="612" rx="20" ry="6"/><ellipse cx="1107" cy="165" rx="13" ry="4"/></g><g fill="none" stroke="#f3f5df" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M64 205q13 7 25 0m18 2q13 7 25 0M1046 536q13 7 25 0m18 2q13 7 25 0M125 626q13 7 25 0m18 2q13 7 25 0M1016 83q13 7 25 0"/></g><g transform="translate(1093 76)" fill="none" stroke="#688b82" stroke-width="2"><circle r="26" opacity=".6"/><path d="m0-20 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" fill="#edf0d9"/><path d="M0-20 5-5 0 0-5-5Z" fill="#688b82"/></g></svg>`;
}
