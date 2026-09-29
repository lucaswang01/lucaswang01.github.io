import {
  ELEMENTS, SPELLS, DINOS, REGIONS, ENCOUNTERS, GEARS, TOPICS, ADOPTION_COST,
  createGame, normalizeGame, parseGame, serializeGame, getLevel, isRegionUnlocked,
  isEncounterUnlocked, startBattle, chargeMana, changeQuestion, castSpell, fleeBattle,
  grantTreasure, talkToRanger, buyGear, equipGear, setParty, adoptDino,
  updatePosition, knownSpells, TEAM_SPELL, enemyIntent, elementMultiplier,
  PLANETS, WEAPONS, HAIRSTYLES, HAIR_COLORS, OUTFITS, CLOTH_COLORS, STORY_COUNT, WEAPON_SPELLS, TAME_SPELL,
  customizeExplorer, captureInfo, captureEnemy,
} from './rpg-core.mjs';
import { dinoArt, heroArt } from './art.mjs';
import { mountWorld, WORLD_CONFIG } from './world.mjs';
import { mountBattleArena } from './battle-arena.mjs';

const ACCESS = 'THVjYXM=';
const SAVE_KEY = 'math-go-save-v2';
const LEGACY_KEY = 'math-go-save-v1';
const ACCESS_KEY = 'math-go-access-v1';
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const importer = document.querySelector('#import-file');
const starterIds = ['sprig', 'brook', 'pebble'];
const icons = { fire: '🔥', water: '💧', leaf: '🍃', stone: '◆', air: '💨', sun: '☀', neutral: '✦' };
let state = null;
let unlocked = false;
let view = 'world';
let worldController = null;
let storageWarning = '';
let saveConflict = false;
let loadError = '';
let migrationNote = '';
let pendingImport = null;
let replaceBrokenSave = false;
let selectedSpell = null;
let selectedTarget = null;
let mathOpen = false;
let mathFeedback = null;
let battleEvents = [];
let battleAnimation = null;
let battleBusy = false;
let arenaController = null;
let battleDisplay = null;
let spellbookOpen = false;
let captureOpen = false;
let gentleMotion = false;
try { gentleMotion = localStorage.getItem('math-go-gentle-motion') === 'true'; } catch {}
const reducedMotion = () => gentleMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAPTURE_SPELL = { id: 'catch', name: 'Friend Orb', element: 'neutral', target: 'enemy', effect: 'capture', description: 'Weaken a new wild dinosaur to 30% health, break its shield, then try a capture for 3 MP.' };
const allBattleSpells = [...SPELLS, ...WEAPON_SPELLS, TAME_SPELL, TEAM_SPELL, CAPTURE_SPELL];
const visibleBattle = () => battleDisplay || state.battle;
let lastResult = null;
let toastTimer;
let audioContext;
let suppressWorldSave = false;

const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const dino = (id) => DINOS.find((item) => item.id === id);
const region = (id) => REGIONS.find((item) => item.id === id);
const element = (id) => ELEMENTS.find((item) => item.id === id) || { name: id, color: '#76847b' };
const encounter = (id) => ENCOUNTERS.find((item) => item.id === id);
const topicName = (id) => id === 'mixed' ? 'Mixed Grade 3' : TOPICS.find((item) => item.id === id)?.label || id;
const button = (action, label, classes = '', extra = '') => `<button class="btn ${classes}" data-action="${action}" ${extra}>${label}</button>`;
const meter = (value, max, kind = '') => `<div class="meter ${kind}" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><span style="--fill:${Math.max(0, Math.min(100, value / max * 100))}%"></span></div>`;
const topicOptions = (current) => [{ id: 'mixed', label: 'Mixed Grade 3 practice' }, ...TOPICS].map((topic) => `<option value="${topic.id}" ${topic.id === current ? 'selected' : ''}>${topic.label}</option>`).join('');
function announce(message) { document.querySelector('#announcement').textContent = message; }
function toast(message) { const node = document.querySelector('#toast'); node.textContent = message; node.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 5000); }
function sound(kind = 'magic') {
  if (!state?.settings.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume();
    const notes = ({ win: [392, 523, 659, 784], hit: [240, 110], fire: [150, 210, 95], water: [392, 587, 784], leaf: [330, 494, 660], stone: [110, 82, 65], air: [740, 880, 1108], sun: [523, 659, 784], neutral: [440, 660, 880], ultimate: [392, 523, 659, 784, 1047] })[kind] || [440, 660];
    notes.forEach((frequency, index) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); const start = audioContext.currentTime + index * .075; oscillator.type = kind === 'hit' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.04, start + .012); gain.gain.exponentialRampToValueAtTime(.001, start + .18); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + .2); });
  } catch { /* Sound is optional. */ }
}
function persist(next = state) { state = normalizeGame(next); if (saveConflict) return; try { localStorage.setItem(SAVE_KEY, serializeGame(state)); storageWarning = ''; } catch { storageWarning = 'This browser cannot autosave. Download your adventure before leaving.'; } }
function loadProgress() {
  try {
    const modern = localStorage.getItem(SAVE_KEY); const legacy = modern ? null : localStorage.getItem(LEGACY_KEY);
    if (modern) state = parseGame(modern);
    else if (legacy) { state = parseGame(legacy); persist(state); migrationNote = 'Your original Math Go progress, dinosaurs, gear, coins, and practice history moved safely into the new RPG adventure. Any unfinished old-style challenge was returned to the trail.'; }
  } catch (error) { loadError = `We could not open the browser save: ${error.message}`; }
  if (state?.battle) { view = 'battle'; mathOpen = state.battle.mana < 2 && state.battle.stars < 3; battleEvents = [...state.battle.log]; }
}
function modal(title, content, actions = '') { dialog.innerHTML = `<h2 id="dialog-title">${title}</h2>${content}<div class="button-row">${button('close-dialog', 'Cancel', 'ghost')}${actions}</div>`; if (!dialog.open) dialog.showModal(); }

function gateScreen() {
  return `<main class="gate"><section class="gate-art"><div class="gate-story"><span class="eyebrow">A real math RPG adventure</span><h1>Roam wild.<br>Think boldly.</h1><p>Walk through Bramble Island, discover roaming creatures, and lead your explorer and dinosaur team into elemental battles.</p><span class="tag gold">Grade 3 · Free forever</span></div></section><section class="gate-form-wrap"><div class="gate-starter">${dinoArt('breeze')}</div><p class="wordmark">Math <span>Go</span></p><h2>Enter Bramble Island</h2><form id="gate-form"><label for="access-code">Family access code</label><input id="access-code" name="code" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required placeholder="Enter your code"><button class="btn gold wide" type="submit">Open the trail →</button><p id="gate-error" class="error" role="alert"></p></form><p class="small muted">No account, ads, online chat, or paid upgrades.<br>Your adventure stays on this device.</p><a href="../">← Games Room</a></section></main>`;
}
function setupScreen() {
  return `<main class="setup"><a href="../">← Games Room</a><span class="eyebrow">Begin a new legend</span><h1>Choose your first trail friend.</h1><p class="lede">Your explorer always joins battles. Your dinosaur companion brings its own element, spells, and turn.</p>${loadError && !replaceBrokenSave ? `<div class="notice"><p>${esc(loadError)} The existing browser data has not been changed.</p><div class="button-row">${button('import', 'Import a backup', 'small')}${button('recover-new', 'Start over', 'small ghost')}</div></div>` : ''}<form id="setup-form"><div class="setup-fields"><div><label for="explorer-name">Explorer nickname</label><input id="explorer-name" name="name" maxlength="24" autocomplete="off" required placeholder="What should we call you?"></div><div><label for="setup-topic">Math practice</label><select id="setup-topic" name="topic">${topicOptions('mixed')}</select></div></div><fieldset><legend>Dinosaur companion</legend><div class="starter-grid">${starterIds.map((id, index) => { const pet = dino(id); return `<label class="starter-card"><input type="radio" name="starter" value="${id}" ${index === 0 ? 'checked' : ''}>${dinoArt(id)}<span class="element ${pet.element}">${icons[pet.element]} ${element(pet.element).name}</span><h3>${pet.name}</h3><p>${pet.description}</p></label>`; }).join('')}</div></fieldset><div class="button-row"><button class="btn gold" type="submit" ${loadError && !replaceBrokenSave ? 'disabled' : ''}>Begin the adventure →</button>${button('import', 'Import progress', 'ghost', 'type="button"')}</div><p id="setup-error" class="error" role="alert"></p><p class="small muted">Use a nickname rather than a full name. Download portable JSON backups at Base Camp.</p></form></main>`;
}
function shell(content) {
  const level = getLevel(state); const xpInLevel = state.xp % 100;
  const nav = [['world', '⌘', 'Explore'], ['planets', '◎', 'Planets'], ['style', '♜', 'Style'], ['party', '♙', 'Team'], ['spells', '✦', 'Spells'], ['journal', '▤', 'Quests'], ['camp', '⌂', 'Camp']];
  return `<header class="topbar"><a class="brand" href="../"><span class="brand-badge">M</span><div><p class="wordmark">Math <span>Go</span></p><small>THE DINO GALAXY</small></div></a><div class="top-stats"><span class="top-chip"><b>LV ${level}</b>${meter(xpInLevel, 100, 'xp')}<small>${xpInLevel}/100 XP</small></span><span class="top-chip coin">✦ ${state.coins}</span></div></header><div class="game-shell"><aside class="game-nav"><nav aria-label="Game menus">${nav.map(([id, icon, label]) => `<button class="nav-item" data-action="navigate" data-view="${id}" ${view === id || id === 'world' && ['battle', 'result'].includes(view) ? 'aria-current="page"' : ''}><span>${icon}</span>${label}</button>`).join('')}</nav><div class="team-mini"><span>ACTIVE TEAM</span>${state.party.map((id) => `<div>${dinoArt(id)}<b>${dino(id).name}</b></div>`).join('')}</div><a class="small" href="../">← Games Room</a></aside><main class="game-main">${storageWarning ? `<div class="notice" role="alert">${storageWarning} ${button('export', 'Download now', 'small')}</div>` : ''}${migrationNote ? `<div class="notice success">${esc(migrationNote)} ${button('dismiss-migration', 'Got it', 'small ghost')}</div>` : ''}${state.battle && view !== 'battle' ? `<div class="notice battle-resume"><span>A battle is paused on the trail.</span>${button('resume-battle', 'Resume battle →', 'small gold')}</div>` : ''}${content}</main></div>`;
}
function currentQuest() {
  const here = region(state.world.regionId);
  for (const area of [here, ...REGIONS.filter((item) => item.id !== here.id)]) { if (!isRegionUnlocked(state, area.id)) continue; const next = area.encounterIds.find((id) => !state.completed.includes(id)); if (next) return { area, fight: encounter(next) }; }
  return null;
}
function worldScreen() {
  const area = region(state.world.regionId); const quest = currentQuest();
  return `<section class="world-page" id="world-root"><div class="world-heading"><div><span class="eyebrow">${esc(area.name)}</span><h1>Explore the wilds</h1><p>Move with arrow keys or WASD. Walk into a roaming enemy to battle.</p></div><div class="region-tabs" aria-label="Fast travel">${REGIONS.filter((item) => item.planetId === area.planetId).map((item) => `<button data-action="travel" data-id="${item.id}" ${!isRegionUnlocked(state, item.id) ? 'disabled' : ''} aria-pressed="${item.id === area.id}">${icons[item.element]} ${item.shortName || item.name}</button>`).join('')}</div></div><div class="world-frame"><canvas id="world-canvas" width="960" height="600" tabindex="0" aria-label="Walkable ${esc(area.name)}. Use arrow keys or WASD to move."></canvas><div class="world-hud quest"><span class="eyebrow">Current quest</span>${quest ? `<b>${quest.fight.name}</b><small>${quest.area.id === area.id ? 'Find the marked creature in this region.' : `Travel to ${quest.area.name}.`}</small>` : '<b>Dino galaxy restored!</b><small>Roam, find treasure, and replay battles.</small>'}</div><div class="world-hud controls"><span>Move</span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><span>Talk / open</span><kbd>E</kbd></div><div id="world-hint" class="world-hint" role="status">Click the world, then use arrow keys.</div><div class="dpad" aria-label="Touch movement"><button data-direction="up" aria-label="Move up">▲</button><button data-direction="left" aria-label="Move left">◀</button><button data-direction="down" aria-label="Move down">▼</button><button data-direction="right" aria-label="Move right">▶</button></div><button class="interact" data-action="interact">Talk / Open <kbd>E</kbd></button></div><div class="world-footer"><span><b>${state.completed.length}/${STORY_COUNT}</b> story encounters</span><span><b>${state.world.treasures.length}</b> treasure chests</span><span><b>${state.collection.length}</b> dinosaur friends</span><span><b>${topicName(state.topic)}</b> practice</span></div></section>`;
}
function unitArt(unit, enemy = false) { return unit.id === 'hero' ? heroArt({ ...state.appearance, weapon: state.weapon, gear: state.gear }) : dinoArt(unit.artId || unit.id, { variant: enemy ? 'enemy' : 'normal', label: unit.name }); }
function weaknessFor(elementId) { return ELEMENTS.find((item) => item.strongAgainst === elementId); }
function battleLoadout(spells) {
  const chosen = [];
  const add = (spell) => { if (spell && !chosen.some((item) => item.id === spell.id)) chosen.push(spell); };
  const score = (spell) => ['heal', 'regen', 'shield'].includes(spell.effect) ? spell.power : spell.power * Math.max(1, ...visibleBattle().enemies.filter((unit) => unit.hp > 0).map((unit) => elementMultiplier(spell.element, unit.element)));
  const strongest = (list) => [...list].sort((a, b) => score(b) - score(a))[0];
  add(spells.find((spell) => spell.id === 'guard'));
  add(strongest(spells.filter((spell) => ['heal', 'regen'].includes(spell.effect))));
  add(strongest(spells.filter((spell) => spell.target === 'all')));
  add(strongest(spells.filter((spell) => spell.target === 'enemy' && !['heal', 'regen', 'shield'].includes(spell.effect))));
  [...spells].sort((a, b) => score(b) - score(a)).forEach(add);
  return chosen.slice(0, 4);
}
function validTarget(spell, unit, side) {
  if (!spell || !unit || unit.hp <= 0) return false;
  if (spell.id === 'catch') return side === 'enemy' && visibleBattle().mana >= 3 && captureInfo({ ...state, battle: visibleBattle() }, unit.id).available;
  if (spell.target === 'enemy') return side === 'enemy';
  if (spell.target === 'ally') return side === 'ally';
  if (spell.target === 'self') return unit.id === visibleBattle().activeId;
  return false;
}
function impactMarkup(unit) {
  if (!battleAnimation?.targets.includes(unit.id)) return '';
  const label = battleAnimation.labels[unit.id] || '';
  return label ? `<strong class="impact-number ${['heal', 'regen', 'shield'].includes(battleAnimation.kind) ? 'helpful' : ''}">${esc(label)}</strong>` : '';
}
function unitCard(unit, side) {
  const battle = visibleBattle();
  const alive = unit.hp > 0; const active = battle.activeId === unit.id && !battleAnimation?.casterId.startsWith('enemy');
  const target = selectedTarget === unit.id || selectedTarget === 'all' && side === 'enemy';
  const selected = allBattleSpells.find((spell) => spell.id === selectedSpell); const selectable = validTarget(selected, unit, side);
  const casting = battleAnimation?.casterId === unit.id || battleAnimation?.kind === 'ultimate' && side === 'ally' && alive;
  const impact = battleAnimation?.targets.includes(unit.id); const weakness = weaknessFor(unit.element);
  const intent = side === 'enemy' ? enemyIntent(battle, unit) : null;
  const advantage = side === 'enemy' && selected && !['shield', 'heal', 'regen'].includes(selected.effect) ? elementMultiplier(selected.element, unit.element) : 1;
  const intention = intent?.roar ? `${intent.name} → team!` : intent ? `${intent.name} → ${battle.allies.find((ally) => ally.id === intent.targets[0])?.name || 'team'}` : '';
  return `<button class="battle-unit ${side} ${active ? 'active' : ''} ${target ? 'targeted' : ''} ${selectable ? 'selectable' : ''} ${casting ? 'casting' : ''} ${impact ? 'impact' : ''} ${alive ? '' : 'fainted'} ${battle.captured?.includes(unit.id) ? 'captured' : ''} ${intent?.enraged ? 'enraged' : ''} ${side === 'enemy' && encounter(battle.encounterId).boss && unit.id === 'enemy-1' ? 'boss-unit' : ''} ${unit.shield ? 'shielded' : ''}" style="--unit-color:${element(unit.element).color}" data-action="target" data-id="${unit.id}" ${alive && selectable && !battleBusy ? '' : 'disabled'} aria-pressed="${target}" aria-label="${selectable ? `Choose ${esc(unit.name)} as the target. ` : ''}${esc(unit.name)}, ${unit.hp} of ${unit.maxHp} health${intention ? `. Next: ${esc(intention)}` : ''}">
    ${intent ? `<span class="enemy-intent ${intent.roar ? 'danger' : ''}">${intent.enraged ? '⚡ Powered up · ' : ''}${esc(intention)}</span>` : `<span class="ally-role">${active ? '✦ YOUR TURN' : battle.acted.includes(unit.id) ? '✓ READY NEXT ROUND' : 'ON YOUR TEAM'}</span>`}
    <div class="unit-art"><span class="unit-shadow"></span><div class="unit-sprite">${unitArt(unit, side === 'enemy')}</div><span class="shield-orb" aria-hidden="true"></span>${impactMarkup(unit)}</div>
    <div class="unit-card"><span class="weakness">${advantage > 1 ? '✦ Super effective!' : advantage < 1 ? 'Resists this spell' : weakness ? `Weak to ${element(weakness.id).name}` : '✦ Explorer'}</span><b>${esc(unit.name)} <span>LV ${unit.level || getLevel(state)}</span></b>${meter(unit.hp, unit.maxHp, 'hp')}<small class="hp-text">${battle.captured?.includes(unit.id) ? '♥ BEFRIENDED' : `${unit.hp} / ${unit.maxHp} HP`}</small><span class="unit-status">${unit.shield ? `◆ ${unit.shield} shield ` : ''}${unit.status.burn ? '🔥 Burning ' : ''}${unit.status.regen ? '✚ Healing' : ''}</span></div></button>`;
}
function spellCard(spell, active) {
  const cooldown = active.cooldowns?.[spell.id] || 0; const affordable = visibleBattle().mana >= spell.cost; const chosen = selectedSpell === spell.id;
  const advantage = !['heal', 'regen', 'shield'].includes(spell.effect) && visibleBattle().enemies.some((enemy) => enemy.hp > 0 && elementMultiplier(spell.element, enemy.element) > 1);
  const type = spell.target === 'all' ? 'All enemies' : spell.effect === 'shield' ? 'Shield' : ['heal', 'regen'].includes(spell.effect) ? 'Heal' : 'Attack';
  return `<button class="spell-card ${spell.element} ${chosen ? 'chosen' : ''}" data-action="select-spell" data-id="${spell.id}" ${cooldown || !affordable || battleBusy ? 'disabled' : ''} aria-pressed="${chosen}" title="${esc(spell.description)}"><span class="spell-icon">${icons[spell.element]}</span><b>${esc(spell.name)}</b><small>${spell.cost} MP · ${type}</small>${cooldown ? `<strong>${cooldown} turns</strong>` : !affordable ? '<strong>Need magic</strong>' : advantage ? '<em>✦ Strong</em>' : ''}</button>`;
}
function battleScreen() {
  const battle = visibleBattle(); if (!battle) return resultScreen();
  const active = battle.allies.find((unit) => unit.id === battle.activeId) || battle.allies.find((unit) => unit.hp > 0);
  const learned = knownSpells(state, active.id), spells = battleLoadout(learned);
  const selected = allBattleSpells.find((spell) => spell.id === selectedSpell);
  const needsMath = !battleBusy && mathOpen;
  const area = region(battle.regionId), foe = encounter(battle.encounterId);
  const prompt = battleAnimation ? `${battleAnimation.casterId.startsWith('enemy') ? 'Enemy turn · ' : ''}${esc(battleAnimation.name)}!` : !selected ? `${esc(active.name)}: choose your magic` : selected.target === 'enemy' ? `Choose a glowing enemy for ${esc(selected.name)}` : selected.target === 'ally' ? `Choose a friend for ${esc(selected.name)}` : `${esc(selected.name)} is ready`;
  const castReady = selected && ['all', 'self'].includes(selected.target);
  const bossIntent = foe.boss ? enemyIntent(battle, battle.enemies[0]) : null;
  const roar = bossIntent?.roar;
  const order = battle.allies.filter((unit) => unit.hp > 0).map((unit) => `<span class="${unit.id === battle.activeId && !battleAnimation?.casterId.startsWith('enemy') ? 'current' : ''} ${battle.acted.includes(unit.id) ? 'done' : ''}">${icons[unit.element]} ${esc(unit.name)}</span>`).join('<i>›</i>');
  return `<section class="battle-page"><h1 class="sr-only">Battle: ${esc(foe.name)}</h1><div class="battle-scene cinematic ${reducedMotion() ? 'gentle-motion' : ''} ${battleBusy ? 'animating' : ''} ${battleAnimation?.kind === 'ultimate' ? 'ultimate-cast' : ''}" data-region="${area.id}" style="--battle-color:${element(area.element).color};--cast-duration:${battleAnimation?.duration || 1100}ms">
    <canvas class="arena-canvas" aria-hidden="true"></canvas><canvas class="effects-canvas" aria-hidden="true"></canvas>
    <header class="arena-heading"><div><span>${esc(area.name)} · ROUND ${battle.round}</span><b>${foe.boss ? '♛ ' : ''}${esc(foe.name)}</b></div><div class="arena-options">${button('battle-sound', state.settings.sound ? '♫ Sound on' : '♫ Sound off', 'ghost small', `aria-pressed="${state.settings.sound}"`)}${button('battle-motion', gentleMotion ? 'Gentle effects' : 'Full effects', 'ghost small', `aria-pressed="${gentleMotion}"`)}${button('flee', 'Leave battle', 'ghost small')}</div></header>
    <div class="turn-order" aria-label="Turn order">${order}<i>›</i><span class="enemy-turn ${battleAnimation?.casterId.startsWith('enemy') ? 'current' : ''}">Gloam team</span></div>
    ${roar ? `<div class="guardian-warning" role="status">⚠ ${esc(bossIntent.name)} this round! Shield your team before the enemies act.</div>` : ''}
    <div class="party-side">${battle.allies.map((unit) => unitCard(unit, 'ally')).join('')}</div><div class="enemy-side">${battle.enemies.map((unit) => unitCard(unit, 'enemy')).join('')}</div>
    ${battleAnimation ? `<div class="spell-flight ${battleAnimation.element}" role="status"><small>${battleAnimation.kind === 'ultimate' ? 'TEAM SPECIAL' : battleAnimation.casterId.startsWith('enemy') ? 'GLOAM ATTACK' : 'MAGIC UNLEASHED'}</small><b>${esc(battleAnimation.name)}</b></div>` : ''}
    <div class="battle-prompt ${selected ? 'targeting' : ''}" role="status">${prompt}</div>
    <section class="spell-dock" aria-label="Battle controls"><div class="dock-spells"><div class="dock-caption"><span>✦ ${active.id === 'hero' ? esc(WEAPONS.find((item) => item.id === state.weapon).name) : `${esc(active.name)}’s spells`}</span><button data-action="capture-menu" aria-expanded="${captureOpen}" ${battleBusy ? 'disabled' : ''}>◉ Catch</button><button data-action="spellbook" aria-expanded="${spellbookOpen}" ${battleBusy ? 'disabled' : ''}>${spellbookOpen ? 'Close spellbook' : `All ${learned.length} spells ↗`}</button></div><div class="spell-grid" id="spell-grid">${spells.map((spell) => spellCard(spell, active)).join('')}</div></div>
    <div class="dock-info"><span>TEAM MAGIC <b>${battle.mana}/${battle.maxMana} MP</b></span>${meter(battle.mana, battle.maxMana, 'mana')}<small>${selected ? esc(selected.description) : 'Solve a puzzle. Power a spell. Help your team!'}</small><div>${castReady ? `<button class="btn gold small" id="cast-spell" data-action="cast" ${battleBusy ? 'disabled' : ''}>Cast ${esc(selected.name)}</button>` : '<button id="cast-spell" hidden disabled></button>'}${button('charge', '+6 magic · Solve math', 'small', battleBusy || battle.mana === battle.maxMana ? 'disabled' : '')}</div></div>
    <button class="team-special ${battle.stars === 3 ? 'ready' : ''}" data-action="team-special" ${battle.stars < 3 || battleBusy ? 'disabled' : ''} aria-label="Dino Starburst. ${battle.stars} of 3 math stars. ${battle.stars === 3 ? 'Ready to select' : 'Solve puzzles to charge'}"><span class="star-pips" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${i < battle.stars ? 'filled' : ''}">★</i>`).join('')}</span><b>Dino Starburst</b><small>${battle.stars === 3 ? 'TEAM SPECIAL READY ↗' : `${battle.stars}/3 puzzles solved`}</small><em>Hits all enemies · no MP</em></button></section>
    ${captureOpen ? captureMenu(battle) : ''}
    ${spellbookOpen ? `<section class="battle-spellbook" aria-label="All learned spells"><div><b>Choose your magic</b><button data-action="spellbook" aria-label="Close spellbook">×</button></div><p>Match a foe’s weakness for a stronger hit.</p><div class="spell-grid">${learned.map((spell) => spellCard(spell, active)).join('')}</div></section>` : ''}
    ${battleEvents.length ? `<div class="battle-log" aria-live="polite">${battleEvents.slice(-3).map((entry) => `<p>${esc(entry)}</p>`).join('')}</div>` : ''}
    ${needsMath ? `<aside class="math-panel arena-math open" aria-label="Math challenge"><button class="math-close" data-action="close-math" aria-label="Close math challenge">×</button>${mathChallenge()}</aside>` : ''}</div></section>`;
}
function captureMenu(battle) {
  return `<section class="battle-spellbook capture-menu" aria-label="Catch a dinosaur"><div><b>◉ Make a new friend</b><button data-action="capture-menu" aria-label="Close capture menu">×</button></div><p>Get a wild dinosaur below 30% health and break its shield. A try costs 3 MP and your turn. Gentle Tap leaves at least 1 HP. A miss improves the next chance!</p><div class="capture-options">${battle.enemies.map((enemy) => { const info = captureInfo({ ...state, battle }, enemy.id); return `<article>${dinoArt(enemy.artId)}<div><b>${esc(dino(enemy.artId).name)}</b><small>${enemy.hp}/${enemy.maxHp} HP · ${esc(info.reason)}</small></div>${(enemy.hp > 1 || enemy.shield > 0) && !state.collection.includes(enemy.artId) && !(encounter(battle.encounterId).boss && enemy.id === 'enemy-1') ? button('gentle-target', 'Gentle tap · 1 MP', 'small', `data-id="${enemy.id}" ${battle.mana < 1 || battleBusy ? 'disabled' : ''}`) : ''}${button('capture-target', info.available ? battle.mana < 3 ? 'Need 3 MP' : `Try ${info.chance}%` : 'Not ready', 'small gold', `data-id="${enemy.id}" ${!info.available || battle.mana < 3 || battleBusy ? 'disabled' : ''}`)}</article>`; }).join('')}</div></section>`;
}
const optionList = (items, chosen) => items.map((item) => `<option value="${item.id}" ${item.id === chosen ? 'selected' : ''}>${esc(item.name)}</option>`).join('');
function styleScreen() {
  return `<section class="style-page">${pageHeading('Explorer workshop', 'Your look. Your magic.', 'Make this explorer yours. Try a new hairstyle, pick your clothes, and choose a weapon to change your spells.')}<form id="style-form"><fieldset ${state.battle ? 'disabled' : ''}><div class="style-layout"><aside class="style-preview panel"><span class="eyebrow">${esc(state.player.name)} · LEVEL ${getLevel(state)}</span><div id="style-preview-art">${heroArt({ ...state.appearance, weapon: state.weapon, gear: state.gear })}</div><p id="style-weapon-label">${WEAPONS.find((item) => item.id === state.weapon).name}</p><button class="btn gold wide" type="submit">Save my explorer</button><small>${state.battle ? 'Finish or leave your battle to change equipment.' : 'Looks are free. Weapons unlock as you level up.'}</small></aside><div><section class="panel wardrobe-controls"><h2>A style of your own</h2><div class="appearance-fields">${[['hair', 'Hairstyle', HAIRSTYLES], ['hairColor', 'Hair color', HAIR_COLORS], ['outfit', 'Clothes', OUTFITS], ['color', 'Clothes color', CLOTH_COLORS]].map(([key, label, items]) => `<div><label for="look-${key}">${label}</label><select id="look-${key}" name="${key}">${optionList(items, state.appearance[key])}</select></div>`).join('')}</div></section><section class="weapon-workshop"><h2>Choose your weapon</h2><div class="weapon-grid">${WEAPONS.map((item) => `<label class="weapon-choice ${item.level > getLevel(state) ? 'locked' : ''}"><input type="radio" name="weapon" value="${item.id}" ${state.weapon === item.id ? 'checked' : ''} ${item.level > getLevel(state) ? 'disabled' : ''}><div class="weapon-art">${heroArt({ ...state.appearance, weapon: item.id })}</div><span class="eyebrow">${item.level > getLevel(state) ? `Unlock at level ${item.level}` : 'Ready to equip'}</span><h3>${item.name}</h3><p>${item.description}</p><small>${item.signatures.map((id) => WEAPON_SPELLS.find((spell) => spell.id === id).name).join(' + ') || 'Every regular explorer spell'}</small></label>`).join('')}</div></section></div></div></fieldset></form></section>`;
}
function planetScreen() {
  return `<section class="galaxy-page">${pageHeading('The Dino Galaxy', 'A whole universe of friends.', 'Travel through the star gates. Discover strange landscapes, befriend new dinosaurs, and face each planet’s guardian.')}<div class="galaxy-banner"><div class="galaxy-orbit" aria-hidden="true">✦</div><div><span class="eyebrow">YOUR STAR LOG</span><h2>${state.completed.length}/${STORY_COUNT} adventures · ${state.collection.length}/${DINOS.length} friends</h2><p>New planets open as you defeat guardians. Bramble’s canopy guardian opens the first star gate.</p></div></div><div class="planet-grid">${PLANETS.map((planet) => { const open = isRegionUnlocked(state, planet.entry), current = region(state.world.regionId).planetId === planet.id; const petIds = DINOS.filter((pet) => pet.planet === planet.id).slice(0, 3); return `<article class="planet-card ${planet.id} ${open ? '' : 'planet-locked'}" style="--planet-color:${planet.color}"><div class="planet-window"><div class="planet-sphere" aria-hidden="true"></div><span>${open ? current ? 'YOU ARE HERE' : 'STAR GATE OPEN' : 'STAR GATE LOCKED'}</span></div><div class="planet-details"><span class="eyebrow">${planet.subtitle} · Recommended LV ${planet.level}</span><h2>${planet.name}</h2><p>${planet.description}</p><div class="planet-pets">${petIds.map((pet) => dinoArt(pet.id)).join('')}</div>${open ? `<div class="planet-destinations">${planet.regions.map((id) => button('travel', `Explore ${region(id).name} →`, 'small gold', `data-id="${id}" ${state.battle || !isRegionUnlocked(state, id) ? 'disabled' : ''}`)).join('')}</div>` : `<p class="planet-requirement">Defeat ${esc(encounter(planet.requires).name)} to open this gate.</p>`}</div></article>`; }).join('')}</div></section>`;
}
function mathChallenge() {
  const question = state.battle.question;
  return `<span class="eyebrow">Charge the spellbook · +6 MP + 1 star</span><span class="tag gold">${topicName(question.topic)}</span><h2>${esc(question.prompt)}</h2><form id="charge-form"><label for="battle-answer">Your answer</label><input id="battle-answer" name="answer" inputmode="numeric" pattern="[0-9]+" maxlength="7" autocomplete="off" required><button class="btn gold wide" id="charge-magic" type="submit">Charge magic →</button><button class="btn ghost wide" type="button" data-action="change-question">↻ Try another question</button><p id="answer-error" class="error" role="alert"></p></form>${mathFeedback ? `<div class="math-feedback ${mathFeedback.correct ? 'correct' : 'retry'}"><b>${mathFeedback.correct ? 'Magic charged!' : 'Keep thinking—your team is safe.'}</b><p>${esc(mathFeedback.message)}</p>${mathFeedback.explanation ? `<p>${esc(mathFeedback.explanation)}</p>` : ''}</div>` : ''}<details class="hint"><summary>I’d like a hint</summary><p>${esc(question.hint)}</p></details><small>Stuck? Try another question for free. Solve one to earn magic and a team star!</small>`;
}
function resultScreen() {
  const won = lastResult?.outcome === 'win'; const reward = lastResult?.reward;
  return `<section class="result-page ${reducedMotion() ? 'gentle-motion' : ''} ${won ? 'victory' : ''}">${won ? `<div class="victory-confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--i:${i};--x:${(i * 37) % 100}%">${i % 3 ? '✦' : '◆'}</i>`).join('')}</div><div class="victory-medal" aria-hidden="true">✦</div>` : ''}<div class="result-rays"></div><div class="result-party">${heroArt({ ...state.appearance, weapon: state.weapon, gear: state.gear })}${state.party.map((id) => dinoArt(id)).join('')}</div><span class="eyebrow">${won ? reward?.campaignComplete ? 'Dino galaxy restored' : 'Battle won' : 'The team needs a rest'}</span><h1>${won ? reward?.newLevel > reward?.oldLevel ? `Level up! You reached level ${reward.newLevel}.` : 'Victory belongs to your team!' : 'Rest, regroup, return.'}</h1><p>${esc(lastResult?.message || 'Your adventure continues.')}</p>${won ? `<div class="rewards"><span>✦ +${reward.coins} coins</span><span>★ +${reward.xp} XP</span>${reward.creature ? `<span>♙ ${esc(dino(reward.creature).name)} joined</span>` : ''}</div>${reward.unlockedSpells?.length ? `<div class="unlock-box"><b>New spell${reward.unlockedSpells.length > 1 ? 's' : ''} unlocked!</b>${reward.unlockedSpells.map((id) => { const spell = SPELLS.find((item) => item.id === id); return `<span>${icons[spell.element]} ${spell.name}</span>`; }).join('')}</div>` : ''}` : ''}<div class="button-row">${button('return-world', 'Return to the trail →', 'gold')}${button('navigate', 'View spellbook', 'ghost', 'data-view="spells"')}</div></section>`;
}
function pageHeading(kicker, title, copy) { return `<header class="page-heading"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></header>`; }
function partyScreen() {
  const owned = DINOS.filter((pet) => state.collection.includes(pet.id));
  return `<section>${pageHeading('Your adventure team', `${state.collection.length} dinosaur friends`, 'Choose a trail buddy and a second companion. Both follow your explorer and take their own turns in battle.')}<div class="hero-card panel">${heroArt({ ...state.appearance, weapon: state.weapon, gear: state.gear })}<div><span class="eyebrow">${esc(WEAPONS.find((item) => item.id === state.weapon).name)}</span><h2>${esc(state.player.name)}</h2><form id="party-form"><fieldset ${state.battle ? 'disabled' : ''}><div class="buddy-slots"><div><label for="buddy-one">Trail buddy</label><select id="buddy-one" name="first">${optionList(owned, state.party[0])}</select></div><div><label for="buddy-two">Second companion</label><select id="buddy-two" name="second"><option value="">None</option>${optionList(owned, state.party[1])}</select></div></div><button class="btn gold" type="submit">Save team</button><p id="party-error" class="error" role="alert"></p></fieldset></form>${state.battle ? '<small>Finish or leave this battle before changing your team.</small>' : ''}</div></div><h2>The dinosaur field guide</h2><p>Catch new wild friends with a Friend Orb when they have 30% health or less. Defeating a planet guardian also earns a friend.</p><div class="collection-grid">${DINOS.map((pet) => { const collected = state.collection.includes(pet.id), active = state.party.includes(pet.id); return `<article class="pet-card panel ${collected ? '' : 'undiscovered'}">${dinoArt(pet.id)}<span class="element ${pet.element}">${icons[pet.element]} ${element(pet.element).name}</span><h3>${pet.name}</h3><small>${pet.species || 'Bramble dinosaur'} · ${PLANETS.find((planet) => planet.id === pet.planet).name}</small><p>${pet.description}</p>${collected ? button('toggle-party', active ? '✓ On battle team' : state.party.length >= 2 ? 'Choose in team slots above' : 'Add to team', active ? 'light' : '', `data-id="${pet.id}" ${state.battle || !active && state.party.length >= 2 ? 'disabled' : ''}`) : starterIds.includes(pet.id) ? button('adopt', `Befriend · ${ADOPTION_COST} coins`, 'light', `data-id="${pet.id}" ${state.battle || state.coins < ADOPTION_COST ? 'disabled' : ''}`) : `<span class="tag">Catch in the wild${pet.unlockHabitat ? ' or earn from guardian' : ''}</span>`}${state.caught.includes(pet.id) ? '<span class="caught-stamp">◉ Captured friend</span>' : ''}</article>`; }).join('')}</div></section>`;
}
function spellsScreen() {
  const level = getLevel(state);
  const activeIds = new Set(knownSpells(state).map((spell) => spell.id));
  return `<section>${pageHeading('The explorer’s spellbook', `${activeIds.size} spells ready`, 'Your weapon changes your magic. Visit Style to switch weapons, or level up to unlock more spells. Gentle Tap helps you catch new friends.')}<div class="element-chart panel"><b>Element strengths</b>${ELEMENTS.map((item) => `<span class="element ${item.id}">${icons[item.id]} ${item.name}${item.strongAgainst ? ` → strong against ${element(item.strongAgainst).name}` : ' · no weakness'}</span>`).join('')}</div><div class="spellbook-grid">${[...SPELLS, TAME_SPELL, ...WEAPON_SPELLS].map((spell) => `<article class="spell-book-card panel ${!activeIds.has(spell.id) ? 'locked' : ''}" style="--element:${element(spell.element).color}"><span class="spell-icon">${icons[spell.element]}</span><div><span class="eyebrow">${spell.level > level ? `Unlocks at level ${spell.level}` : `${element(spell.element).name} · ${spell.cost} MP`}</span><h3>${spell.name}</h3><p>${spell.description}</p>${WEAPONS.find((item) => item.signatures.includes(spell.id)) ? `<small>Weapon: ${WEAPONS.find((item) => item.signatures.includes(spell.id)).name}</small>` : ''}<small>${spell.target} target · ${spell.cooldown ? `${spell.cooldown}-turn recharge` : 'no recharge'}</small></div></article>`).join('')}</div></section>`;
}
function journalScreen() {
  const quest = currentQuest(); const accuracy = state.stats.answered ? Math.round(state.stats.correct / state.stats.answered * 100) : 0;
  return `<section>${pageHeading('Quest journal', quest ? quest.fight.name : 'The sanctuary is restored', quest ? `${quest.area.name}: ${quest.fight.description}` : 'All story battles are complete. Roam freely and replay encounters to keep growing.')}<div class="stat-grid"><div class="panel"><small>LEVEL</small><strong>${getLevel(state)}</strong><span>${state.xp} total XP</span></div><div class="panel"><small>STORY</small><strong>${state.completed.length}/${STORY_COUNT}</strong><span>encounters complete</span></div><div class="panel"><small>MATH</small><strong>${accuracy}%</strong><span>first-try accuracy</span></div><div class="panel"><small>BEST STREAK</small><strong>${state.stats.bestStreak}</strong><span>puzzles in a row</span></div></div><div class="region-journal">${REGIONS.map((area) => `<article class="panel ${isRegionUnlocked(state, area.id) ? '' : 'locked'}"><span class="element ${area.element}">${icons[area.element]} ${element(area.element).name}</span><h2>${area.name}</h2><p>${area.description}</p><ol>${area.encounterIds.map((id) => { const fight = encounter(id); return `<li class="${state.completed.includes(id) ? 'done' : ''}">${state.completed.includes(id) ? '✓' : '○'} ${fight.name}${fight.boss ? ' · Guardian' : ''}</li>`; }).join('')}</ol></article>`).join('')}</div><section class="panel math-record"><h2>Math practice record</h2><table><thead><tr><th>Topic</th><th>Tried</th><th>First-try correct</th></tr></thead><tbody>${TOPICS.map((topic) => `<tr><th>${topic.label}</th><td>${state.stats.byTopic[topic.id]?.answered || 0}</td><td>${state.stats.byTopic[topic.id]?.correct || 0}</td></tr>`).join('')}</tbody></table></section></section>`;
}
function campScreen() {
  return `<section>${pageHeading('Base Camp', 'Rest, prepare, and save', 'Change your practice, equip trail gear, or pack your adventure into a JSON save file.')}<div class="camp-grid"><section class="panel"><span class="eyebrow">Trail gear</span><h2>Equipment</h2><div class="gear-list">${GEARS.map((item) => { const owned = state.ownedGear.includes(item.id); const active = state.gear === item.id; return `<article><div>${heroArt({ ...state.appearance, weapon: state.weapon, gear: item.id })}</div><span><b>${item.name}</b><small>${item.description}</small></span>${button('gear', active ? 'Equipped' : owned ? 'Equip' : `${item.cost} coins`, 'small', `data-id="${item.id}" ${active || !owned && state.coins < item.cost ? 'disabled' : ''}`)}</article>`; }).join('')}</div></section><section class="panel"><span class="eyebrow">Practice settings</span><h2>Choose the math</h2><form id="settings-form"><label for="practice-topic">Grade 3 topic</label><select id="practice-topic" name="topic">${topicOptions(state.topic)}</select><label class="check"><input type="checkbox" name="sound" ${state.settings.sound ? 'checked' : ''}> Play gentle battle sounds</label><button class="btn" type="submit">Save settings</button></form><p class="small muted">Changes apply after the current question. Wrong answers are safe to retry and show a hint.</p></section><section class="panel"><span class="eyebrow">Portable progress</span><h2>Save file</h2><p>Autosave stays in this browser. Download a JSON backup to move devices or keep more than one explorer.</p><div class="button-row">${button('export', '↓ Download progress', 'gold')}${button('import', '↑ Import progress', 'light')}</div><p class="small muted">Imports are validated and never replace this adventure without confirmation.</p></section><section class="panel"><span class="eyebrow">Explorer controls</span><h2>Adventure options</h2><div class="button-row">${button('lock', 'Lock game', 'ghost')}${button('new-game', 'New explorer', 'danger ghost')}</div><p class="small muted">No accounts, purchases, advertising, or online chat. Everything is earned through play.</p></section></div></section>`;
}
function render(focus = false, scrollTop = false) {
  worldController?.destroy(); worldController = null;
  arenaController?.destroy(); arenaController = null;
  if (!unlocked) app.innerHTML = gateScreen(); else if (!state) app.innerHTML = setupScreen(); else { const screens = { planets: planetScreen, style: styleScreen, world: worldScreen, battle: battleScreen, result: resultScreen, party: partyScreen, spells: spellsScreen, journal: journalScreen, camp: campScreen }; app.innerHTML = shell((screens[view] || worldScreen)()); if (view === 'world') mountWorldView(); }
  if (unlocked && state && view === 'battle' && document.querySelector('.battle-scene')) arenaController = mountBattleArena({ root: document.querySelector('.battle-scene'), regionId: visibleBattle().regionId, reducedMotion: reducedMotion(), animation: battleAnimation, duration: battleAnimation?.duration });
  if (scrollTop) window.scrollTo(0, 0);
  if (focus) requestAnimationFrame(() => app.querySelector('h1, #world-canvas, #battle-answer, #explorer-name, #access-code')?.focus({ preventScroll: true }));
}
function mountWorldView() {
  const canvas = document.querySelector('#world-canvas'); const hint = document.querySelector('#world-hint');
  worldController = mountWorld({ canvas, state, onPosition: (position) => { if (suppressWorldSave || position.regionId !== state.world.regionId) return; try { persist(updatePosition(state, position)); } catch (error) { toast(error.message); } }, onEncounter: (id) => beginEncounter(id), onInteract: (object) => interactWith(object), onGate: (regionId) => travelTo(regionId), onHint: (message) => { hint.textContent = message; } });
  canvas.addEventListener('pointerdown', () => canvas.focus());
  document.querySelectorAll('[data-direction]').forEach((control) => { const direction = control.dataset.direction; const press = (event) => { event.preventDefault(); worldController?.setDirection(direction, true); }; const release = (event) => { event.preventDefault(); worldController?.setDirection(direction, false); }; control.addEventListener('pointerdown', press); control.addEventListener('pointerup', release); control.addEventListener('pointercancel', release); control.addEventListener('pointerleave', release); });
}
function beginEncounter(id) {
  if (!state || state.battle || !isEncounterUnlocked(state, id)) { toast('This guardian is waiting for you to finish the earlier encounters.'); return; }
  try { persist(startBattle(state, id)); selectedSpell = null; selectedTarget = null; captureOpen = false; mathOpen = true; mathFeedback = null; battleEvents = [`A wild ${encounter(id).name} appeared!`]; view = 'battle'; render(true, true); } catch (error) { toast(error.message); }
}
function interactWith(object) {
  try {
    if (object.type === 'chest') { const before = state.coins; persist(grantTreasure(state, object.id)); render(); toast(`Treasure found! +${state.coins - before} leaf coins.`); sound('win'); }
    else if (object.type === 'npc') { persist(talkToRanger(state, object.id)); modal(object.name || 'Trail Ranger', `<p>${esc(object.dialogue || 'Elemental strengths and a balanced team can turn a difficult battle around.')}</p><p class="small">Tip: correct math fills shared magic for your explorer and both dinosaurs.</p>`, button('close-dialog', 'Thanks!', 'gold')); }
    else if (object.type === 'beacon' && object.id.endsWith('-camp')) { view = 'camp'; render(true, true); }
    else if (object.type === 'beacon') modal(object.name || 'Ancient beacon', `<p>${state.completed.length === STORY_COUNT ? 'Every habitat beacon shines across the Dino Galaxy. Your team can keep exploring, catching friends, and growing.' : 'The galaxy sanctuary is waiting for all seven habitat beacons to be restored.'}</p>`, button('close-dialog', 'Continue exploring', 'gold'));
    else if (object.type === 'enemy') beginEncounter(object.encounterId || object.id);
  } catch (error) { toast(error.message); }
}
function stopWorld() { suppressWorldSave = true; worldController?.destroy(); worldController = null; suppressWorldSave = false; }
function travelTo(id) { if (!isRegionUnlocked(state, id)) { toast('Restore the earlier habitat before entering this trail.'); worldController?.setState(state); return; } stopWorld(); const spawn = WORLD_CONFIG[id]?.spawn || { x: 220, y: 760 }; persist(updatePosition(state, { regionId: id, x: spawn.x, y: spawn.y })); view = 'world'; render(true, true); announce(`Traveled to ${region(id).name}.`); }
function exportProgress() { const blob = new Blob([serializeGame(state)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `math-go-${state.player.name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 24) || 'explorer'}-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10_000); toast('Progress downloaded. Keep the JSON file somewhere safe.'); }
function chooseTargetFor(spell) { if (!spell || !state.battle) return null; if (spell.target === 'self') return state.battle.activeId; if (spell.target === 'all') return 'all'; const units = spell.target === 'ally' ? state.battle.allies : state.battle.enemies; return units.find((unit) => unit.hp > 0)?.id || null; }
function updateBattleHealth(battle) {
  for (const unit of [...battle.allies, ...battle.enemies]) {
    const node = app.querySelector(`[data-action="target"][data-id="${unit.id}"]`);
    if (!node) continue;
    node.classList.toggle('fainted', unit.hp === 0); node.classList.toggle('captured', battle.captured?.includes(unit.id)); node.classList.toggle('shielded', unit.shield > 0);
    node.querySelector('.hp-text').textContent = battle.captured?.includes(unit.id) ? '♥ BEFRIENDED' : `${unit.hp} / ${unit.maxHp} HP`;
    node.querySelector('.meter').setAttribute('aria-valuenow', unit.hp);
    node.querySelector('.meter span').style.setProperty('--fill', `${unit.hp / unit.maxHp * 100}%`);
    node.querySelector('.unit-status').textContent = `${unit.shield ? `◆ ${unit.shield} shield ` : ''}${unit.status.burn ? '🔥 Burning ' : ''}${unit.status.regen ? '✚ Healing' : ''}`;
  }
}
async function animateCast(spell, targetId) {
  if (!spell || battleBusy || !state?.battle) return;
  let result;
  try { result = spell.id === 'catch' ? captureEnemy(state, targetId) : castSpell(state, spell.id, targetId || chooseTargetFor(spell)); }
  catch (error) { toast(error.message); return; }
  clearTimeout(toastTimer); document.querySelector('#toast').hidden = true;
  battleBusy = true; spellbookOpen = false; captureOpen = false; mathOpen = false; battleDisplay = structuredClone(state.battle);
  // Save the atomic rules result immediately. Reloading during a cinematic never duplicates rewards.
  persist(result.state);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (const frame of result.timeline) {
    const duration = reducedMotion() ? 220 : ['ultimate', 'capture'].includes(frame.kind) ? 1550 : frame.casterId.startsWith('enemy') ? 900 : 1100;
    battleAnimation = { ...frame, duration };
    render(); sound(frame.kind === 'ultimate' ? 'ultimate' : frame.element);
    await wait(duration * .56);
    updateBattleHealth(frame.battle);
    await wait(duration * .44);
    battleDisplay = frame.battle;
  }
  battleEvents = result.events || []; battleAnimation = null; battleDisplay = null; battleBusy = false; selectedSpell = null; selectedTarget = null; mathFeedback = null;
  if (result.capture?.success) toast(`${dino(result.capture.id).name} joined! Choose your new friend on the Team page.`);
  if (result.outcome === 'ongoing') { mathOpen = state.battle.mana < 2 && state.battle.stars < 3; render(); announce(battleEvents.at(-1) || `${spell.name} cast.`); }
  else { lastResult = { ...result, message: result.events?.at(-1) || (result.outcome === 'win' ? 'The wild creatures are calm again.' : 'Your team made it back safely.') }; view = 'result'; sound(result.outcome === 'win' ? 'win' : 'hit'); render(true, true); }
}

document.addEventListener('click', (event) => {
  if (battleBusy) { event.preventDefault(); return; }
  const control = event.target.closest('[data-action]'); if (!control || control.disabled) return; const action = control.dataset.action; const id = control.dataset.id;
  try {
    if (action === 'close-dialog') { dialog.close(); pendingImport = null; }
    else if (action === 'import') { importer.value = ''; importer.click(); }
    else if (action === 'export') exportProgress();
    else if (action === 'recover-new') modal('Replace the unreadable save?', '<p>Import a backup first if you have one. Starting over replaces browser progress only after setup.</p>', button('confirm-recover', 'Start over', 'danger'));
    else if (action === 'confirm-recover') { replaceBrokenSave = true; dialog.close(); render(true, true); }
    else if (action === 'confirm-import' && pendingImport) { stopWorld(); saveConflict = false; selectedSpell = null; selectedTarget = null; mathFeedback = null; lastResult = null; persist(pendingImport); pendingImport = null; loadError = ''; dialog.close(); view = state.battle ? 'battle' : 'world'; mathOpen = Boolean(state.battle && state.battle.mana < 2 && state.battle.stars < 3); spellbookOpen = false; captureOpen = false; battleEvents = state.battle ? [...state.battle.log] : []; render(true, true); toast('Adventure imported. Welcome back!'); }
    else if (!state) return;
    else if (action === 'dismiss-migration') { migrationNote = ''; render(); }
    else if (action === 'navigate') { captureOpen = false; const requested = control.dataset.view; view = requested === 'world' && state.battle ? 'battle' : requested; if (view !== 'battle') { mathFeedback = null; battleEvents = []; } render(true, true); }
    else if (action === 'resume-battle') { view = 'battle'; render(true, true); }
    else if (action === 'travel') travelTo(id);
    else if (action === 'interact') worldController?.interact();
    else if (action === 'battle-sound') { persist({ ...state, settings: { ...state.settings, sound: !state.settings.sound } }); render(); sound('magic'); }
    else if (action === 'battle-motion') { gentleMotion = !gentleMotion; try { localStorage.setItem('math-go-gentle-motion', String(gentleMotion)); } catch {} render(); }
    else if (action === 'capture-menu') { captureOpen = !captureOpen; spellbookOpen = false; mathOpen = false; selectedSpell = captureOpen ? 'catch' : null; render(); }
    else if (action === 'gentle-target') animateCast(TAME_SPELL, id);
    else if (action === 'capture-target') animateCast(CAPTURE_SPELL, id);
    else if (action === 'spellbook') { captureOpen = false; spellbookOpen = !spellbookOpen; mathOpen = false; render(); document.querySelector(spellbookOpen ? '.battle-spellbook [data-action=spellbook]' : '.dock-caption [data-action=spellbook]')?.focus(); }
    else if (action === 'team-special') { captureOpen = false; selectedSpell = TEAM_SPELL.id; selectedTarget = 'all'; render(); document.querySelector('#cast-spell')?.focus(); }
    else if (action === 'charge') { captureOpen = false; spellbookOpen = false; mathOpen = true; mathFeedback = null; render(); document.querySelector('#battle-answer')?.focus(); }
    else if (action === 'close-math') { mathOpen = false; render(); document.querySelector('[data-action=charge]')?.focus(); }
    else if (action === 'change-question') { persist(changeQuestion(state)); mathFeedback = null; mathOpen = true; render(); announce('Here is a new question. Your team and magic are unchanged.'); document.querySelector('#battle-answer')?.focus(); }
    else if (action === 'select-spell') { const spell = allBattleSpells.find((item) => item.id === id); spellbookOpen = false; selectedSpell = id; selectedTarget = ['all', 'self'].includes(spell.target) ? chooseTargetFor(spell) : null; render(); document.querySelector(`[data-action="select-spell"][data-id="${id}"]`)?.focus(); }
    else if (action === 'target') { const spell = allBattleSpells.find((item) => item.id === selectedSpell); if (!spell) { toast('Choose a spell from the cards first.'); return; } if (!validTarget(spell, state.battle.allies.concat(state.battle.enemies).find((unit) => unit.id === id), state.battle.enemies.some((unit) => unit.id === id) ? 'enemy' : 'ally')) return; selectedTarget = id; animateCast(spell, id); }
    else if (action === 'cast') { const spell = allBattleSpells.find((item) => item.id === selectedSpell); if (spell) animateCast(spell, selectedTarget || chooseTargetFor(spell)); }
    else if (action === 'flee') modal('Return to Base Camp?', '<p>Your completed quests and rewards stay safe. This battle restarts next time.</p>', button('confirm-flee', 'Return to camp', 'gold'));
    else if (action === 'confirm-flee') { persist(fleeBattle(state)); lastResult = { outcome: 'lose', message: 'Your team returned to camp and recovered.' }; dialog.close(); view = 'result'; render(true, true); }
    else if (action === 'return-world') { lastResult = null; battleEvents = []; view = 'world'; render(true, true); }
    else if (action === 'toggle-party') { const next = state.party.includes(id) ? state.party.filter((item) => item !== id) : [...state.party, id]; if (!next.length) { toast('Keep at least one dinosaur on your team.'); return; } persist(setParty(state, next)); render(true); toast('Battle team updated.'); }
    else if (action === 'adopt') { persist(adoptDino(state, id)); render(true); toast(`${dino(id).name} joined your collection!`); sound('win'); }
    else if (action === 'gear') { const item = GEARS.find((gear) => gear.id === id); persist(state.ownedGear.includes(id) ? equipGear(state, id) : equipGear(buyGear(state, id), id)); render(true); toast(`${item.name} equipped.`); }
    else if (action === 'lock') { try { sessionStorage.removeItem(ACCESS_KEY); } catch {} unlocked = false; render(true, true); }
    else if (action === 'new-game') modal('Start a new explorer?', '<p>Download this adventure first if you want to return. Your browser has one autosave slot.</p>', `${button('export', 'Download current save', 'light')}${button('confirm-new', 'Start fresh', 'danger')}`);
    else if (action === 'confirm-new') { stopWorld(); saveConflict = false; storageWarning = ''; try { localStorage.removeItem(SAVE_KEY); } catch {} state = null; lastResult = null; selectedSpell = null; selectedTarget = null; mathFeedback = null; loadError = ''; replaceBrokenSave = false; dialog.close(); render(true, true); }
  } catch (error) { toast(error.message); }
});

document.addEventListener('submit', (event) => {
  event.preventDefault(); if (battleBusy) return; const form = event.target; const data = new FormData(form);
  if (form.id === 'gate-form') { if (String(data.get('code')).trim() !== atob(ACCESS)) { document.querySelector('#gate-error').textContent = 'That code does not match. Capital letters matter.'; document.querySelector('#access-code').select(); return; } unlocked = true; try { sessionStorage.setItem(ACCESS_KEY, 'open'); } catch {} if (!state) loadProgress(); render(true, true); return; }
  if (form.id === 'setup-form') { try { persist(createGame({ name: String(data.get('name')).trim(), starter: data.get('starter'), topic: data.get('topic') })); view = 'world'; loadError = ''; render(true, true); } catch (error) { document.querySelector('#setup-error').textContent = error.message; } }
  else if (form.id === 'charge-form' && state?.battle) { const value = String(data.get('answer')).trim(); if (!/^\d+$/.test(value)) { document.querySelector('#answer-error').textContent = 'Enter a whole number, like 24.'; return; } try { const result = chargeMana(state, Number(value)); persist(result.state); mathFeedback = result; mathOpen = !result.correct; if (result.correct) { sound('magic'); battleEvents = [result.message]; toast(state.battle.stars === 3 ? '★ Dino Starburst ready! Choose the glowing team special.' : `${result.message} Team stars ${state.battle.stars}/3.`); } render(); announce(result.message); document.querySelector(result.correct ? '#spell-grid button:not(:disabled)' : '#battle-answer')?.focus(); } catch (error) { document.querySelector('#answer-error').textContent = error.message; } }
  else if (form.id === 'style-form') { try { const appearance = Object.fromEntries(['hair', 'hairColor', 'outfit', 'color'].map((key) => [key, data.get(key)])); persist(customizeExplorer(state, appearance, data.get('weapon'))); render(); toast('New look, new adventure! Your explorer is ready.'); } catch (error) { toast(error.message); } }
  else if (form.id === 'party-form') { try { const first = data.get('first'), second = data.get('second'); if (first === second) throw new Error('Choose a different second companion, or choose None.'); persist(setParty(state, second ? [first, second] : [first])); render(); toast('Your new team is ready to explore!'); } catch (error) { document.querySelector('#party-error').textContent = error.message; } }
  else if (form.id === 'settings-form') { persist({ ...state, topic: data.get('topic'), settings: { sound: data.get('sound') === 'on' } }); toast('Practice settings saved.'); sound('magic'); }
});

importer.setAttribute('aria-label', 'Import progress');
importer.addEventListener('change', async () => {
  const file = importer.files?.[0]; if (!file || battleBusy) return;
  try { if (file.size > 512_000) throw new Error('Choose a Math Go JSON file smaller than 512 KB.'); pendingImport = parseGame(await file.text()); modal('Continue this adventure?', `<p><b>${esc(pendingImport.player.name)}</b> · Level ${getLevel(pendingImport)}<br>${pendingImport.completed.length} story encounters · ${pendingImport.collection.length} dinosaur friends</p><p>${state ? 'Importing replaces browser progress after confirmation. Download your current game first if you want both.' : 'This becomes the browser autosave.'}</p>`, `${state ? button('export', 'Download current save', 'light') : ''}${button('confirm-import', 'Import adventure', 'gold')}`); }
  catch (error) { pendingImport = null; modal('Could not import this file', `<p role="alert">${esc(error.message)}</p><p>Your current adventure has not changed.</p>`); }
});
window.addEventListener('storage', (event) => { if (event.key === SAVE_KEY && state) { saveConflict = true; storageWarning = 'Another tab changed the browser save. Autosave is paused here; download this tab before leaving.'; if (!battleBusy) render(); } });
window.addEventListener('beforeunload', (event) => { if (state && storageWarning) { event.preventDefault(); event.returnValue = ''; } });
try { unlocked = sessionStorage.getItem(ACCESS_KEY) === 'open'; } catch {}
if (unlocked) loadProgress();
render();

// Preview a draft without altering the equipped appearance or autosave.
document.addEventListener('change', (event) => {
  const form = event.target.closest('#style-form'); if (!form || state.battle) return;
  const data = new FormData(form), appearance = Object.fromEntries(['hair', 'hairColor', 'outfit', 'color'].map((key) => [key, data.get(key)]));
  document.querySelector('#style-preview-art').innerHTML = heroArt({ ...appearance, weapon: data.get('weapon'), gear: state.gear });
  document.querySelector('#style-weapon-label').textContent = WEAPONS.find((item) => item.id === data.get('weapon')).name;
});
