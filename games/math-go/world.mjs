// A locally drawn, camera-following world. The renderer never changes save data.
import { dinoArt, heroArt } from './art.mjs';

const REGION_IDS = ['fern', 'river', 'crystal', 'summit'];
const THEMES = {
  fern: { name: 'Fernwood Trail', ground: '#94b875', light: '#c3d89a', dark: '#6f9b63', leaf: '#347457', leafLight: '#5d9866', path: '#d9c79b', water: '#4d9fa0', glow: '#cfed91' },
  river: { name: 'Ripple River', ground: '#95bd94', light: '#c6dec0', dark: '#78a78a', leaf: '#327a73', leafLight: '#59a48c', path: '#d9ccb2', water: '#459bad', glow: '#a6e9ec' },
  crystal: { name: 'Crystal Hollow', ground: '#99a59e', light: '#c2c8b8', dark: '#778f8b', leaf: '#536e78', leafLight: '#79949e', path: '#c8c2bb', water: '#7189b7', glow: '#e0beff' },
  summit: { name: 'Sunstone Summit', ground: '#b6b782', light: '#ded5a4', dark: '#939b73', leaf: '#6e8860', leafLight: '#9ea875', path: '#e4cca0', water: '#88b4b6', glow: '#ffe49c' },
};

const TREES = [
  [82, 110, 1.45], [208, 146, 1.2], [352, 104, 1.55], [495, 160, 1.1], [654, 100, 1.5],
  [840, 118, 1.3], [1030, 110, 1.55], [1446, 156, 1.6], [1532, 286, 1.25],
  [115, 346, 1.2], [304, 327, 1.45], [495, 394, 1.2], [678, 330, 1.45],
  [1090, 336, 1.1], [1365, 355, 1], [80, 566, 1.45], [365, 538, 1.15],
  [635, 544, 1.4], [1085, 668, 1.6], [1309, 706, 1.35], [1500, 740, 1.25],
  [78, 943, 1.4], [368, 936, 1.2], [560, 920, 1.55], [735, 941, 1.2],
  [935, 904, 1.5], [1165, 938, 1.4], [1409, 908, 1.65],
];
const ROCKS = [[192, 420, 32], [429, 244, 26], [585, 834, 31], [923, 323, 29], [1226, 839, 41], [1418, 618, 32]];
const DINO_IDS = { fern: ['sprig', 'pebble', 'breeze'], river: ['brook', 'sprig', 'bloom'], crystal: ['pebble', 'bloom', 'crystal'], summit: ['breeze', 'crystal', 'ember'] };
const RANGER_NAMES = { fern: 'Ranger Rowan', river: 'Ranger Marina', crystal: 'Ranger Flint', summit: 'Ranger Sol' };
const ENCOUNTER_NAMES = {
  fern: ['A rustle in the ferns', 'The mossy bridge', 'Guardian of the canopy'],
  river: ['Stepping-stone crossing', 'Water-lily lagoon', 'Guardian of the lagoon'],
  crystal: ['The echo tunnel', 'A glimmer in the dark', 'Guardian of the crystals'],
  summit: ['Updraft lookout', 'The golden stairway', 'Guardian of the sunshine'],
};
const DIALOGUE = {
  fern: 'Welcome to Bramble Island! A drifting gloam has confused our dinosaur friends. Follow the sandy trail and help the two challengers first. Then the canopy guardian will meet you in the ancient stone circle. Your explorer and dinosaurs take turns in battle; solve math to gather the magic they share.',
  river: 'The river is rising, but the wooden bridge is safe. Look for it in the middle of the map. Leaf magic is strong against water creatures, and a balanced dinosaur party gives you more choices. There are two old supply chests hidden along every trail—take a detour and see what you find!',
  crystal: 'These crystals remember every act of courage. Stone is strong against air, while sunlight breaks through stone defenses. Healing a friend or shielding the next explorer can be wiser than another attack. Finish both trail battles to wake the crystal guardian in the northern stone circle.',
  summit: 'You have reached the trail above the clouds! Water magic helps against fire, but every element has a place on your team. The final guardian is waiting to the north. Restore this last region, and the entire island will shine again. Even after that, wandering packs are ready for more adventures.',
};

export const WORLD_CONFIG = Object.freeze(Object.fromEntries(REGION_IDS.map((id, index) => [id, Object.freeze({
  id, name: THEMES[id].name, width: 1600, height: 1000, spawn: { x: 220, y: 760 },
  objects: [
    { id: `${id}-ranger`, type: 'npc', x: 260, y: 620, name: RANGER_NAMES[id], label: 'Talk', dialogue: DIALOGUE[id], color: ['plum', 'blue', 'rust', 'gold'][index] },
    { id: `${id}-camp`, type: 'beacon', x: 170, y: 685, name: 'Explorer camp', label: 'Camp' },
    { id: `${id}-1`, type: 'enemy', x: 470, y: 760, dinoId: DINO_IDS[id][0], name: ENCOUNTER_NAMES[id][0], patrol: 17, boss: false },
    { id: `${id}-2`, type: 'enemy', x: 970, y: 520, dinoId: DINO_IDS[id][1], name: ENCOUNTER_NAMES[id][1], patrol: 24, boss: false },
    { id: `${id}-3`, type: 'enemy', x: 1230, y: 270, dinoId: DINO_IDS[id][2], name: ENCOUNTER_NAMES[id][2], patrol: 9, boss: true },
    { id: `${id}-roam`, type: 'enemy', x: 610, y: 238, dinoId: DINO_IDS[id][1], name: 'Wandering challenger', patrol: 25, boss: false, roaming: true },
    { id: `${id}-chest-1`, type: 'chest', x: 390, y: 180, name: 'Hidden supply chest' },
    { id: `${id}-chest-2`, type: 'chest', x: 1110, y: 780, name: 'Ancient supply chest' },
    ...(index < 3 ? [{ id: `${id}-exit`, type: 'gate', x: 1450, y: 500, destination: REGION_IDS[index + 1], name: `To ${THEMES[REGION_IDS[index + 1]].name}`, forward: true }] : [{ id: 'summit-shrine', type: 'beacon', x: 1450, y: 500, name: 'Sunstone sanctuary', label: 'Sanctuary' }]),
    ...(index > 0 ? [{ id: `${id}-entrance`, type: 'gate', x: 95, y: 775, destination: REGION_IDS[index - 1], name: `To ${THEMES[REGION_IDS[index - 1]].name}`, forward: false }] : []),
  ],
})])));

function config(regionId) { return WORLD_CONFIG[regionId] || WORLD_CONFIG.fern; }
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function isCleared(state, id) { return Boolean(state?.completed?.includes(id)); }
function regionCleared(state, id) { return [1, 2, 3].every(n => isCleared(state, `${id}-${n}`)); }
function guardianOpen(state, regionId) { return [1, 2].every(n => isCleared(state, `${regionId}-${n}`)); }

export function getWorldObjects(regionId, state = {}) {
  return config(regionId).objects.map(object => ({ ...object,
    completed: object.type === 'enemy' && isCleared(state, object.id),
    opened: object.type === 'chest' && Boolean(state.world?.treasures?.includes(object.id)),
    talked: object.type === 'npc' && Boolean(state.world?.talked?.includes(object.id)),
    locked: (object.type === 'enemy' && object.boss && !guardianOpen(state, regionId)) || (object.type === 'gate' && object.forward && !regionCleared(state, regionId)),
  }));
}

function treePositions(regionId) {
  // River banks remain clear around the bridge. A canopy is decoration; only its trunk is solid.
  return TREES.filter(([x]) => regionId !== 'river' || x < 710 || x > 950);
}

function overlapsRect(x, y, radius, rect) {
  return Math.hypot(x - clamp(x, rect.x, rect.x + rect.w), y - clamp(y, rect.y, rect.y + rect.h)) < radius;
}

export function canMove(regionId, x, y, radius = 18) {
  if (![x, y, radius].every(Number.isFinite) || radius < 0 || !WORLD_CONFIG[regionId]) return false;
  const { width, height } = config(regionId);
  if (x < 45 + radius || y < 65 + radius || x > width - 45 - radius || y > height - 30 - radius) return false;
  if (treePositions(regionId).some(([tx, ty, scale]) => Math.hypot(x - tx, y - ty) < radius + 19 * scale)) return false;
  if (ROCKS.some(([rx, ry, size]) => Math.hypot(x - rx, y - ry) < radius + size * .67)) return false;
  if (regionId === 'river') {
    // Two river sections leave the wooden bridge completely traversable.
    if (overlapsRect(x, y, radius, { x: 766, y: 0, w: 128, h: 635 }) || overlapsRect(x, y, radius, { x: 766, y: 785, w: 128, h: 215 })) return false;
  } else if (regionId === 'fern' && Math.hypot((x - 900) / 1.4, y - 180) < radius + 63) return false;
  else if (regionId === 'crystal' && overlapsRect(x, y, radius, { x: 765, y: 100, w: 100, h: 240 })) return false;
  return true;
}

export function movePosition(regionId, position, dx, dy) {
  if (![position?.x, position?.y, dx, dy].every(Number.isFinite)) return { ...config(regionId).spawn };
  let { x, y } = position;
  // Substeps prevent tunneling through trunks, rocks, or narrow water edges after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 7));
  if (steps > 10000) return { x, y };
  for (let step = 0; step < steps; step++) {
    if (canMove(regionId, x + dx / steps, y)) x += dx / steps;
    if (canMove(regionId, x, y + dy / steps)) y += dy / steps;
  }
  return { x, y };
}

function seeded(seed) {
  let n = seed;
  return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function rounded(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function line(ctx, points, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function label(ctx, text, x, y, { color = '#f9f5db', background = '#243d34e8', size = 13, maxWidth = 240 } = {}) {
  ctx.save(); ctx.font = `700 ${size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
  const width = Math.min(ctx.measureText(text).width + 22, maxWidth);
  rounded(ctx, x - width / 2, y - size - 6, width, size + 16, 8, background);
  ctx.fillStyle = color; ctx.fillText(text, x, y + 2, maxWidth - 16); ctx.restore();
}

function drawTree(ctx, x, y, scale, theme) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ellipse(ctx, 9, 4, 54, 17, '#294d3630');
  line(ctx, [[0, 1], [-2, -61]], '#715c43', 15);
  line(ctx, [[-1, -32], [-29, -58]], '#715c43', 7);
  line(ctx, [[0, -41], [27, -70]], '#715c43', 6);
  [[-29, -62, 35, 29], [27, -69, 39, 33], [0, -91, 41, 33], [-3, -47, 43, 29]].forEach(([a,b,c,d]) => ellipse(ctx,a,b,c,d,theme.leaf));
  ellipse(ctx, -13, -99, 28, 17, theme.leafLight); ellipse(ctx, -35, -70, 19, 15, theme.leafLight);
  line(ctx, [[-30,-91],[-14,-98],[0,-96]], '#d5e5a644', 5);
  ctx.restore();
}

function drawRock(ctx, x, y, size, regionId) {
  const purple = regionId === 'crystal';
  ellipse(ctx, x + 3, y + 6, size, size * .4, '#253c382d');
  ctx.fillStyle = purple ? '#848da2' : '#919b86'; ctx.beginPath();
  [[-1,-.8],[.67,-.45],[.91,.15],[.5,.48],[-.65,.32],[-.91,-.06]].forEach(([a,b],i) => i ? ctx.lineTo(x+a*size,y+b*size) : ctx.moveTo(x+a*size,y+b*size)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = purple ? '#b7bed0' : '#bac3a7'; ctx.beginPath(); ctx.moveTo(x-size, y);ctx.lineTo(x-size*.25,y-size*.75);ctx.lineTo(x+size*.3,y-size*.27);ctx.closePath();ctx.fill();
}

function drawCrystal(ctx, x, y, size = 1) {
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ellipse(ctx, 4, 5, 31, 11, '#526d8030');
  [[-19,-3,.65],[0,0,1],[20,4,.6]].forEach(([x,y,s],i) => {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle = ['#b4afd9','#b0d9dd','#d0afe2'][i];ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(-18,-43);ctx.lineTo(0,-68);ctx.lineTo(17,-42);ctx.lineTo(13,0);ctx.closePath();ctx.fill();
    ctx.fillStyle = '#ffffff54';ctx.beginPath();ctx.moveTo(0,-68);ctx.lineTo(1,0);ctx.lineTo(13,0);ctx.lineTo(17,-42);ctx.closePath();ctx.fill();ctx.restore();
  });ctx.restore();
}

function drawCamp(ctx, x, y, theme) {
  ellipse(ctx, x + 2, y + 3, 69, 27, '#485e3725');
  ctx.fillStyle = '#c9aa6b';ctx.beginPath();ctx.moveTo(x-53,y);ctx.lineTo(x,y-80);ctx.lineTo(x+57,y);ctx.closePath();ctx.fill();
  ctx.fillStyle = '#e2ca8f';ctx.beginPath();ctx.moveTo(x-53,y);ctx.lineTo(x,y-80);ctx.lineTo(x+8,y);ctx.closePath();ctx.fill();
  ctx.fillStyle = '#537660';ctx.beginPath();ctx.moveTo(x-15,y);ctx.lineTo(x+3,y-49);ctx.lineTo(x+28,y);ctx.closePath();ctx.fill();
  line(ctx,[[x-62,y+2],[x-53,y],[x,y-84],[x+60,y],[x+69,y+5]],'#8a7858',3);
  line(ctx,[[x,y-84],[x,y-104]],'#785c42',3);
  ctx.fillStyle=theme.glow;ctx.beginPath();ctx.moveTo(x,y-104);ctx.lineTo(x+30,y-99);ctx.lineTo(x,y-88);ctx.fill();
}

function makeGround(regionId) {
  const ground = document.createElement('canvas'); ground.width = 1600; ground.height = 1000;
  const ctx = ground.getContext('2d'); const theme = THEMES[regionId]; const rng = seeded(REGION_IDS.indexOf(regionId) * 1293 + 541);
  ctx.fillStyle = theme.ground; ctx.fillRect(0, 0, 1600, 1000);
  for (let i = 0; i < 90; i++) ellipse(ctx, rng()*1600, rng()*1000, 35+rng()*100, 18+rng()*55, i%3 ? `${theme.light}25` : `${theme.dark}1c`);
  // Broad interconnecting paths make exploration legible without forcing a single corridor.
  const paths = [[[95,775],[230,760],[470,760],[675,710],[833,710],[1000,616],[1200,570],[1450,500]], [[470,760],[460,625],[535,470],[610,238],[390,180]], [[1000,616],[970,520],[1130,423],[1230,270]], [[1100,602],[1110,780]], [[230,760],[260,620]]];
  paths.forEach(points=> { line(ctx,points,`${theme.dark}65`,92);line(ctx,points,theme.path,77);line(ctx,points,`${theme.light}4d`,55); });
  for(let i=0;i<150;i++) {
    const x=rng()*1510+45,y=rng()*900+65;
    ctx.globalAlpha=.4;ellipse(ctx,x,y,1+rng()*3,1+rng()*1.5,theme.dark);ctx.globalAlpha=1;
  }
  if(regionId==='river') {
    rounded(ctx,743,-20,174,1050,72,'#738f7875');rounded(ctx,758,-20,144,1050,65,theme.water);
    for(let i=0;i<28;i++) { const x=778+rng()*85,y=rng()*1000;line(ctx,[[x,y],[x+14,y+2],[x+25,y]],'#c6f0ec70',2); }
    rounded(ctx,735,637,190,146,5,'#75664c');
    for(let i=0;i<12;i++) rounded(ctx,737+i*15.5,640,14,140,2,i%2?'#c4a16d':'#d3b883');
    line(ctx,[[729,640],[931,640]],'#796345',9);line(ctx,[[729,780],[931,780]],'#796345',9);
    [742,794,848,914].forEach(x=> {rounded(ctx,x-4,627,8,25,2,'#69563e');rounded(ctx,x-4,766,8,25,2,'#69563e');});
    label(ctx,'RIVER CROSSING',831,613,{size:11,background:'#286a66d9'});
  } else if(regionId==='fern') {
    ellipse(ctx,900,180,113,81,'#658e6355');ellipse(ctx,900,180,101,73,theme.water);ellipse(ctx,890,170,87,61,'#65b6ab');
    [[855,164],[935,191],[884,215]].forEach(([x,y])=>{ellipse(ctx,x,y,11,5,'#b4ca79');ellipse(ctx,x+2,y-2,4,3,'#edd6b2');});
  } else if(regionId==='crystal') {
    rounded(ctx,742,78,146,287,42,'#687b8470');rounded(ctx,763,99,104,244,26,'#506778');
    for(let i=0;i<11;i++) ellipse(ctx,780+rng()*61,110+rng()*212,3,2,'#b9dbed88');
    [[722,140,1.2],[900,244,1.4],[90,800,1.3],[1290,160,1.2],[1160,896,1.3]].forEach(([x,y,s])=>drawCrystal(ctx,x,y,s));
  }
  // The guardian clearing is visibly special before it becomes available.
  ellipse(ctx,1230,280,123,77,'#30493823');ellipse(ctx,1230,280,111,67,`${theme.path}cc`);
  ctx.strokeStyle = '#f7edd27a';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(1230,280,95,54,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<10;i++){ const a=i*Math.PI/5;drawRock(ctx,1230+Math.cos(a)*113,280+Math.sin(a)*69,12,regionId); }
  for(let i=0;i<260;i++) {
    const x=rng()*1490+50,y=rng()*885+75;
    if(!canMove(regionId,x,y,3) || paths.some(points=>points.some(([px,py])=>Math.hypot(x-px,y-py)<80))) continue;
    line(ctx,[[x-4,y],[x-7,y-7],[x,y-2],[x+5,y-9]],`${theme.dark}ae`,2);
    if(i%4===0){ellipse(ctx,x,y-10,3,3,i%8===0?'#f5d480':'#ebc5bb');ellipse(ctx,x+4,y-7,2,2,'#f4e9c1');}
  }
  // Shore/border grass frames the playable island; these margins are also collidable.
  line(ctx,[[28,50],[28,980]],theme.dark,46);line(ctx,[[1573,40],[1573,990]],theme.dark,46);
  line(ctx,[[30,990],[1570,990]],theme.dark,43);
  return ground;
}

function loadSprite(svg) {
  const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; return image;
}
function isTextFocus() {
  const el=document.activeElement;
  return Boolean(el?.matches('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

/** Mount exactly one world while its canvas is visible. Call destroy before navigation. */
export function mountWorld({ canvas, state, onPosition = () => {}, onEncounter = () => {}, onInteract = () => {}, onGate = () => {}, onHint = () => {} }) {
  if (!canvas?.getContext) throw new Error('A canvas is required to mount the world.');
  let currentState=state,regionId=state.world?.regionId || 'fern';
  if (!WORLD_CONFIG[regionId]) regionId='fern';
  const ctx=canvas.getContext('2d');
  let position=canMove(regionId,state.world?.x,state.world?.y)?{x:state.world.x,y:state.world.y}:{...config(regionId).spawn};
  let lastSaved={...position}, petPositions=[{x:position.x-65,y:position.y+12},{x:position.x-105,y:position.y+26}];
  let ground=makeGround(regionId), objects=getWorldObjects(regionId,currentState), destroyed=false, frozen=false, frameId=0;
  let lastFrame=0,lastPositionTime=0,age=0,lastHint='',cooldown=1.4,nearest=null,walking=false,facing=1,cssWidth=960,cssHeight=600,dpr=1,zoom=1;
  const keys=new Set(), touch=new Set();
  const sprites=new Map();
  const obtainSprite=(id)=> {
    if(!sprites.has(id)) sprites.set(id,loadSprite(id.startsWith('hero:') ? heroArt({color:id.split(':')[1],gear:id.split(':')[2]||'field'}) : dinoArt(id)));
    return sprites.get(id);
  };
  const heroSprite=()=>obtainSprite(`hero:${currentState.player?.color||'teal'}:${currentState.gear||'field'}`);
  const notifyHint=(text)=>{if(text!==lastHint){lastHint=text;onHint(text);}};
  const savePosition=()=> { if(!destroyed && (distance(position,lastSaved)>.1)) {lastSaved={...position};onPosition({regionId,...position});} };
  const blocked=()=>document.hidden||Boolean(document.querySelector('dialog[open]'))||isTextFocus();

  function resize() {
    const box=canvas.getBoundingClientRect();cssWidth=Math.max(240,box.width||960);cssHeight=Math.max(220,box.height||600);dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(cssWidth*dpr);canvas.height=Math.round(cssHeight*dpr);
    zoom=cssWidth<600?.78:1;
  }
  canvas.tabIndex=canvas.hasAttribute('tabindex')?canvas.tabIndex:0;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${THEMES[regionId].name}. Use arrow keys or W A S D to walk. E or Space talks or opens chests. Walk toward wild dinosaurs to battle.`);
  const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;resizeObserver?.observe(canvas);window.addEventListener('resize',resize);resize();

  const keyDirections={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
  function keydown(event) {
    if(blocked()||event.ctrlKey||event.metaKey||event.altKey) return;
    const direction=keyDirections[event.code];
    if(direction){event.preventDefault();keys.add(direction);}
    else if((event.code==='KeyE'||event.code==='Space')&&!event.repeat&&!document.activeElement?.matches('button,a')){event.preventDefault();interact();}
  }
  function keyup(event){const direction=keyDirections[event.code];if(direction)keys.delete(direction);}
  function clearKeys(){keys.clear();touch.clear();}
  window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',clearKeys);
  const focusCanvas=()=>canvas.focus({preventScroll:true});canvas.addEventListener('pointerdown',focusCanvas);

  function liveObjects() {
    return objects.map((object,index)=> {
      if(object.type!=='enemy')return object;
      const phase=index*1.7,amount=object.locked?0:object.patrol;
      const x=object.x+Math.sin(age*.64+phase)*amount,y=object.y+Math.cos(age*.49+phase)*amount*.55;
      return canMove(regionId,x,y,20)?{...object,x,y}:object;
    });
  }

  function actionFor(object) {
    if (!object || frozen || blocked()) return;
    if(object.type==='enemy') {
      if(object.locked){notifyHint('Defeat both trail challengers before meeting this guardian.');return;}
      frozen=true;clearKeys();savePosition();onEncounter(object.id);
    } else if(object.type==='gate') {
      if(object.locked){notifyHint('Defeat this region’s guardian to open the next trail.');return;}
      frozen=true;clearKeys();savePosition();onGate(object.destination);
    } else if(object.type==='chest'&&object.opened) notifyHint('You already found the treasure in this chest. Keep exploring!');
    else {clearKeys();savePosition();onInteract({...object});}
  }
  function interact() {
    if(frozen||blocked())return;
    const choices=liveObjects().filter(o=>distance(position,o)<(o.type==='gate'?105:100)).sort((a,b)=>distance(position,a)-distance(position,b));
    actionFor(choices[0]);
    if(!choices.length)notifyHint('Walk closer to a ranger, a treasure chest, or a trail gate.');
  }

  function drawSprite(image,x,y,width,height,flip=1,bob=0) {
    if(!image?.complete||!image.naturalWidth)return;
    ctx.save();ctx.translate(x,y+bob);ctx.scale(flip,1);ctx.drawImage(image,-width/2,-height+8,width,height);ctx.restore();
  }
  function drawChest(object) {
    const{x,y,opened}=object;
    ellipse(ctx,x+2,y+3,33,12,'#344e3430');rounded(ctx,x-27,y-25,54,28,5,opened?'#877c59':'#956541');
    rounded(ctx,x-28,y-(opened?48:38),56,opened?15:23,8,opened?'#b4a479':'#c59a59');
    [x-19,x+13].forEach(px=>rounded(ctx,px,y-37,7,39,2,'#e8ca76'));
    rounded(ctx,x-6,y-24,12,14,3,'#ffe4a0');
    if(!opened){ctx.globalAlpha=.55+Math.sin(age*3)*.2;ellipse(ctx,x,y-35,5,5,'#fff3b3');ctx.globalAlpha=1;}
    label(ctx,opened?'Opened':'Treasure',x,y-59,{size:11,background:opened?'#53684ed9':'#635032ed'});
  }
  function drawGate(object) {
    const{x,y,locked}=object, theme=THEMES[regionId];
    ellipse(ctx,x,y+6,54,23,'#40554335');
    rounded(ctx,x-38,y-78,15,86,5,'#849586');rounded(ctx,x+23,y-78,15,86,5,'#849586');
    rounded(ctx,x-44,y-93,88,22,7,'#adba9d');
    if(!locked){const glow=ctx.createRadialGradient(x,y-35,4,x,y-35,52);glow.addColorStop(0,`${theme.glow}b0`);glow.addColorStop(1,`${theme.glow}00`);ellipse(ctx,x,y-35,52,67,glow);}
    ctx.strokeStyle=locked?'#b8ac87':theme.glow;ctx.lineWidth=3;ctx.setLineDash(locked?[5,5]:[]);ctx.strokeRect(x-19,y-67,38,64);ctx.setLineDash([]);
    label(ctx,locked?'Trail sealed':object.name,x,y-107,{size:12,background:'#314e41ef'});
    if(locked)label(ctx,'Win the guardian battle',x,y+31,{size:10,background:'#324639b8'});
  }
  function drawBeacon(object) {
    if(object.id.endsWith('-camp')){drawCamp(ctx,object.x,object.y,THEMES[regionId]);return;}
    const{x,y}=object;
    ellipse(ctx,x,y+4,61,26,'#555e4138');rounded(ctx,x-34,y-30,68,36,8,'#a8a184');rounded(ctx,x-23,y-75,46,48,7,'#ccc09a');
    const light=ctx.createRadialGradient(x,y-93,4,x,y-93,62);light.addColorStop(0,'#fff1b6bb');light.addColorStop(1,'#ffe79a00');ellipse(ctx,x,y-93,62,62,light);
    ellipse(ctx,x,y-93,18,18,'#ffe3a0');label(ctx,object.name,x,y-134,{size:12});
  }
  function drawObject(object) {
    const{x,y}=object;
    if(object.type==='chest')drawChest(object);
    else if(object.type==='gate')drawGate(object);
    else if(object.type==='beacon')drawBeacon(object);
    else if(object.type==='npc') {
      drawSprite(obtainSprite(`hero:${object.color}:field`),x,y,91,84,1,Math.sin(age*1.4)*1.5);
      label(ctx,object.name,x,y-88,{size:12,background:'#355662e8'});
      if(!object.talked)label(ctx,'!',x,y-122,{size:18,background:'#f6d378',color:'#314a37'});
    } else if(object.type==='enemy') {
      if(!object.completed&&!object.locked){const aura=ctx.createRadialGradient(x,y-22,3,x,y-22,55);aura.addColorStop(0,'#8971b537');aura.addColorStop(1,'#8971b500');ellipse(ctx,x,y-22,60,48,aura);}
      if(object.boss){ctx.strokeStyle=object.locked?'#eee8c28c':'#f7d984';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+1,54,22,0,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=object.locked?.66:1;
      drawSprite(obtainSprite(object.dinoId),x,y,object.boss?135:111,object.boss?123:102,-1,Math.sin(age*2.2+x)*2);ctx.globalAlpha=1;
      label(ctx,object.locked?'Guardian · sealed':object.completed?'Friendly rematch':object.name,x,y-(object.boss?125:102),{size:11,background:object.completed?'#476d4ce8':object.boss?'#644b66ee':'#654b3de8'});
      if(!object.completed&&!object.locked){ellipse(ctx,x+42,y-75,10,10,'#f6d476');ctx.fillStyle='#634530';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('!',x+42,y-70);}
    }
  }
  function drawMinimap(viewWidth,viewHeight) {
    // This miniature is intentionally a guide rather than a fast-travel control.
    const width=cssWidth<500?124:160,height=width*1000/1600,x=cssWidth-width-13,y=13;
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);rounded(ctx,x-5,y-5,width+10,height+25,10,'#1f3d33d9');
    ctx.drawImage(ground,x,y,width,height);ctx.strokeStyle='#e8edc76e';ctx.lineWidth=1;ctx.strokeRect(x,y,width,height);
    const sx=width/1600,sy=height/1000;
    objects.forEach(o=>{ctx.fillStyle=o.type==='enemy'?(o.locked?'#afbba1':o.completed?'#d1e5c3':'#f3a878'):o.type==='gate'?'#d4ebec':o.type==='chest'?(o.opened?'#647c61':'#ffe49d'):'#f0e9cf';ctx.beginPath();ctx.arc(x+o.x*sx,y+o.y*sy,o.type==='enemy'&&o.boss?3:2,0,Math.PI*2);ctx.fill();});
    ctx.strokeStyle='#fff8df';ctx.lineWidth=1;ctx.strokeRect(x+clamp(position.x-viewWidth/2,0,Math.max(0,1600-viewWidth))*sx,y+clamp(position.y-viewHeight/2,0,Math.max(0,1000-viewHeight))*sy,Math.min(width,viewWidth*sx),Math.min(height,viewHeight*sy));
    ellipse(ctx,x+position.x*sx,y+position.y*sy,4,4,'#ffffff');ellipse(ctx,x+position.x*sx,y+position.y*sy,2,2,'#227b79');
    ctx.font='700 9px "Trebuchet MS",sans-serif';ctx.fillStyle='#e9edcf';ctx.textAlign='center';ctx.fillText('YOU •  TRAILS  •  TREASURE',x+width/2,y+height+13);ctx.restore();
  }

  function draw() {
    const viewWidth=cssWidth/zoom,viewHeight=cssHeight/zoom,cameraX=clamp(position.x-viewWidth/2,0,Math.max(0,1600-viewWidth)),cameraY=clamp(position.y-viewHeight/2,0,Math.max(0,1000-viewHeight));
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssWidth,cssHeight);ctx.scale(zoom,zoom);ctx.translate(-cameraX,-cameraY);ctx.drawImage(ground,0,0);
    const actual=liveObjects(),party=(currentState.party?.length?currentState.party:[currentState.equipped||'sprig']).slice(0,2);
    const renderables=[...actual.map(object=>({y:object.y,draw:()=>drawObject(object)})),...treePositions(regionId).map(([x,y,s])=>({y,draw:()=>drawTree(ctx,x,y,s,THEMES[regionId])})),...ROCKS.map(([x,y,r])=>({y,draw:()=>drawRock(ctx,x,y,r,regionId)}))];
    party.forEach((id,i)=>{const p=petPositions[i];renderables.push({y:p.y,draw:()=>drawSprite(obtainSprite(id),p.x,p.y,83,76,facing,walking?Math.sin(age*13+i)*2:Math.sin(age*2+i)*1)});});
    renderables.push({y:position.y,draw:()=>{
      ellipse(ctx,position.x,position.y+1,27,12,'#f5efb552');ctx.strokeStyle='#fff6c8aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(position.x,position.y+1,28,12,0,0,Math.PI*2);ctx.stroke();
      drawSprite(heroSprite(),position.x,position.y,96,88,facing,walking?Math.sin(age*15)*3:Math.sin(age*2)*1);
      label(ctx,currentState.player?.name||'Explorer',position.x,position.y-96,{size:12,background:'#204e42df'});
    }});
    renderables.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
    // Tiny drifting leaves, fireflies, or crystal motes add life without hiding the path.
    for(let i=0;i<16;i++){const x=(i*173+age*(regionId==='summit'?10:3))%1600,y=(i*97+Math.sin(age*.6+i)*15)%960;ctx.globalAlpha=.3+Math.sin(age+i)*.12;ellipse(ctx,x,y,2,regionId==='fern'?4:2,THEMES[regionId].glow);}ctx.globalAlpha=1;
    if(nearest && !frozen)label(ctx,nearest.locked?'Trail challenge required':`E · ${nearest.type==='enemy'?'Rematch':nearest.type==='chest'?'Open chest':nearest.type==='npc'?'Talk':nearest.type==='gate'?'Travel':'Visit'}`,position.x,position.y+41,{size:12,background:'#203f35f0'});
    drawMinimap(viewWidth,viewHeight);
    canvas.dataset.playerX=position.x.toFixed(1);canvas.dataset.playerY=position.y.toFixed(1);canvas.dataset.region=regionId;canvas.dataset.moving=String(walking);
  }

  function tick(time) {
    if(destroyed)return;
    const dt=lastFrame?Math.min((time-lastFrame)/1000,.05):0;lastFrame=time;age+=dt;cooldown=Math.max(0,cooldown-dt);
    walking=false;
    if(!frozen&&!blocked()) {
      const has=d=>keys.has(d)||touch.has(d);let dx=Number(has('right'))-Number(has('left')),dy=Number(has('down'))-Number(has('up'));
      const length=Math.hypot(dx,dy);if(length){dx/=length;dy/=length;const next=movePosition(regionId,position,dx*230*dt,dy*230*dt);walking=distance(position,next)>.05;position=next;if(dx)facing=dx>0?1:-1;}
      const actual=liveObjects();nearest=actual.filter(o=>distance(position,o)<(o.type==='gate'?105:94)).sort((a,b)=>distance(position,a)-distance(position,b))[0]||null;
      if(nearest){
        const hint=nearest.locked?(nearest.type==='enemy'?'Defeat the two trail challengers to awaken the guardian.':'Defeat this region’s guardian to open the next trail.'):nearest.type==='enemy'?(nearest.completed?'This friend is ready for a rematch. Press E.':'A wild challenger! Walk closer to begin battle.'):nearest.type==='npc'?`${nearest.name} has a quest. Press E to talk.`:nearest.type==='chest'?(nearest.opened?'An opened treasure chest.': 'A treasure chest! Press E to open it.'):nearest.type==='gate'?`${nearest.name}. Press E to travel.`:'Explorer camp. Press E to visit.';
        notifyHint(hint);
      } else notifyHint('Arrow keys or W A S D to explore · E to talk and open chests');
      if(cooldown<=0){const encounter=actual.find(o=>o.type==='enemy'&&!o.locked&&!o.completed&&distance(position,o)<57);if(encounter)actionFor(encounter);}
    } else {clearKeys();nearest=null;}
    petPositions.forEach((p,i)=>{const leader=i?petPositions[i-1]:position;const gap=distance(p,leader);if(gap>52){const blend=Math.min(1,dt*(gap>150?8:4));p.x+=(leader.x-p.x)*blend;p.y+=(leader.y-p.y)*blend;}});
    if(time-lastPositionTime>600&&!frozen){savePosition();lastPositionTime=time;}
    draw();frameId=requestAnimationFrame(tick);
  }
  frameId=requestAnimationFrame(tick);

  return {
    destroy(){if(destroyed)return;savePosition();destroyed=true;cancelAnimationFrame(frameId);resizeObserver?.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearKeys);document.removeEventListener('visibilitychange',clearKeys);canvas.removeEventListener('pointerdown',focusCanvas);clearKeys();},
    setState(next){currentState=next;const nextRegion=next.world?.regionId||regionId;if(nextRegion!==regionId&&WORLD_CONFIG[nextRegion]){regionId=nextRegion;ground=makeGround(regionId);position=canMove(regionId,next.world?.x,next.world?.y)?{x:next.world.x,y:next.world.y}:{...config(regionId).spawn};petPositions=[{x:position.x-65,y:position.y+12},{x:position.x-105,y:position.y+26}];cooldown=1.4;}objects=getWorldObjects(regionId,currentState);frozen=false;},
    setDirection(direction,pressed){if(!['up','down','left','right'].includes(direction))return;if(pressed&&!blocked())touch.add(direction);else touch.delete(direction);},
    interact,
    getPosition(){return {regionId,...position};},
  };
}
