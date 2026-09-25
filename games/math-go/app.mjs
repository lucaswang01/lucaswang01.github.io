import {
  ELEMENTS, SPELLS, DINOS, REGIONS, ENCOUNTERS, GEARS, TOPICS, ADOPTION_COST,
  createGame, normalizeGame, parseGame, serializeGame, getLevel, isRegionUnlocked,
  isEncounterUnlocked, startBattle, chargeMana, castSpell, fleeBattle,
  grantTreasure, talkToRanger, buyGear, equipGear, setParty, adoptDino,
  updatePosition, knownSpells,
} from './rpg-core.mjs';
import { dinoArt, heroArt } from './art.mjs';
import { mountWorld, WORLD_CONFIG } from './world.mjs';

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
let battleEffect = '';
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
    const notes = kind === 'win' ? [392, 523, 659, 784] : kind === 'hit' ? [520, 260] : [440, 660];
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
  if (state?.battle) view = 'battle';
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
  const nav = [['world', '⌘', 'Explore'], ['party', '♙', 'Team'], ['spells', '✦', 'Spells'], ['journal', '▤', 'Quests'], ['camp', '⌂', 'Camp']];
  return `<header class="topbar"><a class="brand" href="../"><span class="brand-badge">M</span><div><p class="wordmark">Math <span>Go</span></p><small>BRAMBLE ISLAND RPG</small></div></a><div class="top-stats"><span class="top-chip"><b>LV ${level}</b>${meter(xpInLevel, 100, 'xp')}<small>${xpInLevel}/100 XP</small></span><span class="top-chip coin">✦ ${state.coins}</span></div></header><div class="game-shell"><aside class="game-nav"><nav aria-label="Game menus">${nav.map(([id, icon, label]) => `<button class="nav-item" data-action="navigate" data-view="${id}" ${view === id || id === 'world' && ['battle', 'result'].includes(view) ? 'aria-current="page"' : ''}><span>${icon}</span>${label}</button>`).join('')}</nav><div class="team-mini"><span>ACTIVE TEAM</span>${state.party.map((id) => `<div>${dinoArt(id)}<b>${dino(id).name}</b></div>`).join('')}</div><a class="small" href="../">← Games Room</a></aside><main class="game-main">${storageWarning ? `<div class="notice" role="alert">${storageWarning} ${button('export', 'Download now', 'small')}</div>` : ''}${migrationNote ? `<div class="notice success">${esc(migrationNote)} ${button('dismiss-migration', 'Got it', 'small ghost')}</div>` : ''}${state.battle && view !== 'battle' ? `<div class="notice battle-resume"><span>A battle is paused on the trail.</span>${button('resume-battle', 'Resume battle →', 'small gold')}</div>` : ''}${content}</main></div>`;
}
function currentQuest() {
  for (const area of REGIONS) { if (!isRegionUnlocked(state, area.id)) continue; const next = area.encounterIds.find((id) => !state.completed.includes(id)); if (next) return { area, fight: encounter(next) }; }
  return null;
}
function worldScreen() {
  const area = region(state.world.regionId); const quest = currentQuest();
  return `<section class="world-page" id="world-root"><div class="world-heading"><div><span class="eyebrow">${esc(area.name)}</span><h1>Explore the wilds</h1><p>Move with arrow keys or WASD. Walk into a roaming enemy to battle.</p></div><div class="region-tabs" aria-label="Fast travel">${REGIONS.map((item) => `<button data-action="travel" data-id="${item.id}" ${!isRegionUnlocked(state, item.id) ? 'disabled' : ''} aria-pressed="${item.id === area.id}">${icons[item.element]} ${item.shortName || item.name}</button>`).join('')}</div></div><div class="world-frame"><canvas id="world-canvas" width="960" height="600" tabindex="0" aria-label="Walkable ${esc(area.name)}. Use arrow keys or WASD to move."></canvas><div class="world-hud quest"><span class="eyebrow">Current quest</span>${quest ? `<b>${quest.fight.name}</b><small>${quest.area.id === area.id ? 'Find the marked creature in this region.' : `Travel to ${quest.area.name}.`}</small>` : '<b>Bramble Island restored!</b><small>Roam, find treasure, and replay battles.</small>'}</div><div class="world-hud controls"><span>Move</span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><span>Talk / open</span><kbd>E</kbd></div><div id="world-hint" class="world-hint" role="status">Click the world, then use arrow keys.</div><div class="dpad" aria-label="Touch movement"><button data-direction="up" aria-label="Move up">▲</button><button data-direction="left" aria-label="Move left">◀</button><button data-direction="down" aria-label="Move down">▼</button><button data-direction="right" aria-label="Move right">▶</button></div><button class="interact" data-action="interact">Talk / Open <kbd>E</kbd></button></div><div class="world-footer"><span><b>${state.completed.length}/12</b> story encounters</span><span><b>${state.world.treasures.length}</b> treasure chests</span><span><b>${state.collection.length}</b> dinosaur friends</span><span><b>${topicName(state.topic)}</b> practice</span></div></section>`;
}
function unitArt(unit, enemy = false) { return unit.id === 'hero' ? heroArt({ gear: state.gear }) : dinoArt(unit.artId || unit.id, { variant: enemy ? 'enemy' : 'normal', label: unit.name }); }
function weaknessFor(elementId) { return ELEMENTS.find((item) => item.strongAgainst === elementId); }
function unitCard(unit, side) {
  const alive = unit.hp > 0; const active = state.battle.activeId === unit.id; const target = selectedTarget === unit.id;
  const weakness = weaknessFor(unit.element);
  return `<button class="battle-unit ${side} ${active ? 'active' : ''} ${target ? 'targeted' : ''} ${alive ? '' : 'fainted'}" data-action="target" data-id="${unit.id}" ${alive ? '' : 'disabled'} aria-pressed="${target}"><div class="unit-art">${unitArt(unit, side === 'enemy')}</div><div class="unit-card"><span class="element ${unit.element}">${icons[unit.element]} ${element(unit.element).name}</span><b>${esc(unit.name)} · LV ${unit.level || getLevel(state)}</b>${meter(unit.hp, unit.maxHp, 'hp')}<small>${unit.hp}/${unit.maxHp} HP · ${weakness ? `weak to ${weakness.name}` : 'no elemental weakness'}</small>${unit.shield ? `<em>◆ ${unit.shield} shield</em>` : ''}</div></button>`;
}
function spellCard(spell, active) {
  const cooldown = active.cooldowns?.[spell.id] || 0; const affordable = state.battle.mana >= spell.cost; const chosen = selectedSpell === spell.id;
  return `<button class="spell-card ${spell.element} ${chosen ? 'chosen' : ''}" data-action="select-spell" data-id="${spell.id}" ${cooldown || !affordable ? 'disabled' : ''} aria-pressed="${chosen}"><span class="spell-icon">${icons[spell.element]}</span><span><b>${spell.name}</b><small>${spell.description}</small><em>${spell.cost} MP · ${spell.target === 'all' ? 'all enemies' : spell.target} ${spell.cooldown ? `· ${spell.cooldown}-turn recharge` : ''}</em></span>${cooldown ? `<strong>${cooldown} turn${cooldown === 1 ? '' : 's'}</strong>` : !affordable ? '<strong>Need MP</strong>' : ''}</button>`;
}
function battleScreen() {
  const battle = state.battle; if (!battle) return resultScreen();
  const active = battle.allies.find((unit) => unit.id === battle.activeId) || battle.allies.find((unit) => unit.hp > 0);
  let spells = knownSpells(state, active.id); if (spells[0] && typeof spells[0] === 'string') spells = spells.map((id) => SPELLS.find((spell) => spell.id === id));
  const selected = SPELLS.find((spell) => spell.id === selectedSpell); const offensiveCosts = spells.filter((spell) => spell.effect !== 'shield').map((spell) => spell.cost); const needsMath = mathOpen || battle.mana < Math.min(...offensiveCosts);
  const area = region(battle.regionId); const foe = encounter(battle.encounterId);
  const mathPanel = needsMath ? mathChallenge() : `<span class="eyebrow">Math powers magic</span><h2>Need more MP?</h2><p>You have enough magic for a spell. Solve another Grade 3 puzzle anytime to refill 6 MP.</p>${button('charge', 'Solve a math puzzle', 'gold')}`;
  return `<section class="battle-page"><header class="battle-title"><div><span class="eyebrow">${esc(area.name)} · Round ${battle.round}</span><h1>${esc(foe.name)}</h1><p>${esc(active.name)}’s turn. Charge magic with math, then choose a spell and target.</p></div>${button('flee', 'Return to camp', 'ghost small')}</header><div class="battle-scene ${battleEffect}" style="--battle-color:${element(foe.element || area.element).color}"><div class="battle-sky"><span></span><span></span><span></span></div><div class="party-side">${battle.allies.map((unit) => unitCard(unit, 'ally')).join('')}</div><div class="versus">VS</div><div class="enemy-side">${battle.enemies.map((unit) => unitCard(unit, 'enemy')).join('')}</div></div><div class="battle-resource"><div><b>Shared magic</b><small>Correct math restores 6 MP for the whole team.</small></div>${meter(battle.mana, battle.maxMana, 'mana')}<strong>${battle.mana}/${battle.maxMana} MP</strong>${button('charge', needsMath ? 'Math challenge open' : 'Solve math for +6 MP', needsMath ? 'gold small' : 'small')}</div><div class="battle-console"><section class="turn-panel"><div class="caster"><div>${unitArt(active)}</div><span><small>NOW CASTING</small><b>${esc(active.name)}</b><em>${icons[active.element]} ${element(active.element).name} magic</em></span></div><h2>Choose a spell</h2><div class="spell-grid" id="spell-grid">${spells.map((spell) => spellCard(spell, active)).join('')}</div><div class="cast-row"><p>${selected ? `<b>${selected.name}:</b> ${selected.target === 'enemy' ? 'Choose a glowing enemy target.' : selected.target === 'ally' ? 'Choose a teammate to help.' : selected.target === 'all' ? 'This hits every enemy.' : 'This affects the caster.'}` : 'Pick a spell to see its targets.'}</p><button class="btn gold" id="cast-spell" data-action="cast" ${!selected || !selectedTarget && ['enemy', 'ally'].includes(selected?.target) ? 'disabled' : ''}>Cast spell →</button></div>${battleEvents.length ? `<div class="battle-log" aria-live="polite"><b>Battle log</b>${battleEvents.slice(-5).map((entry) => `<p>${esc(entry)}</p>`).join('')}</div>` : ''}</section><aside class="math-panel ${needsMath ? 'open' : ''}">${mathPanel}</aside></div></section>`;
}
function mathChallenge() {
  const question = state.battle.question;
  return `<span class="eyebrow">Charge the spellbook · +6 MP</span><span class="tag gold">${topicName(question.topic)}</span><h2>${esc(question.prompt)}</h2><form id="charge-form"><label for="battle-answer">Your answer</label><input id="battle-answer" name="answer" inputmode="numeric" pattern="[0-9]+" maxlength="7" autocomplete="off" required><button class="btn gold wide" id="charge-magic" type="submit">Charge magic →</button><p id="answer-error" class="error" role="alert"></p></form>${mathFeedback ? `<div class="math-feedback ${mathFeedback.correct ? 'correct' : 'retry'}"><b>${mathFeedback.correct ? 'Magic charged!' : 'Keep thinking—your team is safe.'}</b><p>${esc(mathFeedback.message)}</p>${mathFeedback.explanation ? `<p>${esc(mathFeedback.explanation)}</p>` : ''}</div>` : ''}<details class="hint"><summary>I’d like a hint</summary><p>${esc(question.hint)}</p></details><small>No timer. A wrong answer never gives the enemy a turn.</small>`;
}
function resultScreen() {
  const won = lastResult?.outcome === 'win'; const reward = lastResult?.reward;
  return `<section class="result-page"><div class="result-rays"></div><div class="result-party">${heroArt({ gear: state.gear })}${state.party.map((id) => dinoArt(id)).join('')}</div><span class="eyebrow">${won ? reward?.campaignComplete ? 'Bramble Island restored' : 'Battle won' : 'The team needs a rest'}</span><h1>${won ? reward?.newLevel > reward?.oldLevel ? `Level up! You reached level ${reward.newLevel}.` : 'Victory belongs to your team!' : 'Rest, regroup, return.'}</h1><p>${esc(lastResult?.message || 'Your adventure continues.')}</p>${won ? `<div class="rewards"><span>✦ +${reward.coins} coins</span><span>★ +${reward.xp} XP</span>${reward.creature ? `<span>♙ ${esc(dino(reward.creature).name)} joined</span>` : ''}</div>${reward.unlockedSpells?.length ? `<div class="unlock-box"><b>New spell${reward.unlockedSpells.length > 1 ? 's' : ''} unlocked!</b>${reward.unlockedSpells.map((id) => { const spell = SPELLS.find((item) => item.id === id); return `<span>${icons[spell.element]} ${spell.name}</span>`; }).join('')}</div>` : ''}` : ''}<div class="button-row">${button('return-world', 'Return to the trail →', 'gold')}${button('navigate', 'View spellbook', 'ghost', 'data-view="spells"')}</div></section>`;
}
function pageHeading(kicker, title, copy) { return `<header class="page-heading"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></header>`; }
function partyScreen() {
  return `<section>${pageHeading('Your adventure team', 'Explorer + two dinosaur friends', 'Every party member gets a turn. Build a balanced team for elemental battles.')}<div class="hero-card panel">${heroArt({ gear: state.gear })}<div><span class="eyebrow">Party leader · always active</span><h2>${esc(state.player.name)}</h2><p>Your explorer learns spells from every element as the party levels up.</p><span class="tag">Level ${getLevel(state)}</span></div></div><h2>Dinosaur collection</h2><div class="collection-grid">${DINOS.map((pet) => { const owned = state.collection.includes(pet.id); const active = state.party.includes(pet.id); return `<article class="pet-card panel ${owned ? '' : 'locked'}">${dinoArt(pet.id)}<span class="element ${pet.element}">${icons[pet.element]} ${element(pet.element).name}</span><h3>${pet.name}</h3><p>${pet.description}</p>${owned ? button('toggle-party', active ? '✓ On battle team' : state.party.length >= 2 ? 'Team is full' : 'Add to team', active ? 'light' : '', `data-id="${pet.id}" ${state.battle || !active && state.party.length >= 2 ? 'disabled' : ''}`) : !pet.unlockHabitat ? button('adopt', `Befriend · ${ADOPTION_COST} coins`, 'light', `data-id="${pet.id}" ${state.coins < ADOPTION_COST ? 'disabled' : ''}`) : `<span class="tag">Restore ${region(pet.unlockHabitat)?.name || pet.unlockHabitat}</span>`}</article>`; }).join('')}</div></section>`;
}
function spellsScreen() {
  const level = getLevel(state);
  return `<section>${pageHeading('The explorer’s spellbook', `${SPELLS.filter((spell) => spell.level <= level).length} spells discovered`, 'Level up to unlock stronger attacks, healing, shields, multi-target magic, and new tactics.')}<div class="element-chart panel"><b>Element strengths</b>${ELEMENTS.map((item) => `<span class="element ${item.id}">${icons[item.id]} ${item.name}${item.strongAgainst ? ` → strong against ${element(item.strongAgainst).name}` : ' · no weakness'}</span>`).join('')}</div><div class="spellbook-grid">${SPELLS.map((spell) => `<article class="spell-book-card panel ${spell.level > level ? 'locked' : ''}" style="--element:${element(spell.element).color}"><span class="spell-icon">${icons[spell.element]}</span><div><span class="eyebrow">${spell.level > level ? `Unlocks at level ${spell.level}` : `${element(spell.element).name} · ${spell.cost} MP`}</span><h3>${spell.name}</h3><p>${spell.description}</p><small>${spell.target} target · ${spell.cooldown ? `${spell.cooldown}-turn recharge` : 'no recharge'}</small></div></article>`).join('')}</div></section>`;
}
function journalScreen() {
  const quest = currentQuest(); const accuracy = state.stats.answered ? Math.round(state.stats.correct / state.stats.answered * 100) : 0;
  return `<section>${pageHeading('Quest journal', quest ? quest.fight.name : 'The sanctuary is restored', quest ? `${quest.area.name}: ${quest.fight.description}` : 'All story battles are complete. Roam freely and replay encounters to keep growing.')}<div class="stat-grid"><div class="panel"><small>LEVEL</small><strong>${getLevel(state)}</strong><span>${state.xp} total XP</span></div><div class="panel"><small>STORY</small><strong>${state.completed.length}/12</strong><span>encounters complete</span></div><div class="panel"><small>MATH</small><strong>${accuracy}%</strong><span>first-try accuracy</span></div><div class="panel"><small>BEST STREAK</small><strong>${state.stats.bestStreak}</strong><span>puzzles in a row</span></div></div><div class="region-journal">${REGIONS.map((area) => `<article class="panel ${isRegionUnlocked(state, area.id) ? '' : 'locked'}"><span class="element ${area.element}">${icons[area.element]} ${element(area.element).name}</span><h2>${area.name}</h2><p>${area.description}</p><ol>${area.encounterIds.map((id) => { const fight = encounter(id); return `<li class="${state.completed.includes(id) ? 'done' : ''}">${state.completed.includes(id) ? '✓' : '○'} ${fight.name}${fight.boss ? ' · Guardian' : ''}</li>`; }).join('')}</ol></article>`).join('')}</div><section class="panel math-record"><h2>Math practice record</h2><table><thead><tr><th>Topic</th><th>Tried</th><th>First-try correct</th></tr></thead><tbody>${TOPICS.map((topic) => `<tr><th>${topic.label}</th><td>${state.stats.byTopic[topic.id]?.answered || 0}</td><td>${state.stats.byTopic[topic.id]?.correct || 0}</td></tr>`).join('')}</tbody></table></section></section>`;
}
function campScreen() {
  return `<section>${pageHeading('Base Camp', 'Rest, prepare, and save', 'Change your practice, equip trail gear, or pack your adventure into a JSON save file.')}<div class="camp-grid"><section class="panel"><span class="eyebrow">Trail gear</span><h2>Equipment</h2><div class="gear-list">${GEARS.map((item) => { const owned = state.ownedGear.includes(item.id); const active = state.gear === item.id; return `<article><div>${heroArt({ gear: item.id })}</div><span><b>${item.name}</b><small>${item.description}</small></span>${button('gear', active ? 'Equipped' : owned ? 'Equip' : `${item.cost} coins`, 'small', `data-id="${item.id}" ${active || !owned && state.coins < item.cost ? 'disabled' : ''}`)}</article>`; }).join('')}</div></section><section class="panel"><span class="eyebrow">Practice settings</span><h2>Choose the math</h2><form id="settings-form"><label for="practice-topic">Grade 3 topic</label><select id="practice-topic" name="topic">${topicOptions(state.topic)}</select><label class="check"><input type="checkbox" name="sound" ${state.settings.sound ? 'checked' : ''}> Play gentle battle sounds</label><button class="btn" type="submit">Save settings</button></form><p class="small muted">Changes apply after the current question. Wrong answers are safe to retry and show a hint.</p></section><section class="panel"><span class="eyebrow">Portable progress</span><h2>Save file</h2><p>Autosave stays in this browser. Download a JSON backup to move devices or keep more than one explorer.</p><div class="button-row">${button('export', '↓ Download progress', 'gold')}${button('import', '↑ Import progress', 'light')}</div><p class="small muted">Imports are validated and never replace this adventure without confirmation.</p></section><section class="panel"><span class="eyebrow">Explorer controls</span><h2>Adventure options</h2><div class="button-row">${button('lock', 'Lock game', 'ghost')}${button('new-game', 'New explorer', 'danger ghost')}</div><p class="small muted">No accounts, purchases, advertising, or online chat. Everything is earned through play.</p></section></div></section>`;
}
function render(focus = false, scrollTop = false) {
  worldController?.destroy(); worldController = null;
  if (!unlocked) app.innerHTML = gateScreen(); else if (!state) app.innerHTML = setupScreen(); else { const screens = { world: worldScreen, battle: battleScreen, result: resultScreen, party: partyScreen, spells: spellsScreen, journal: journalScreen, camp: campScreen }; app.innerHTML = shell((screens[view] || worldScreen)()); if (view === 'world') mountWorldView(); }
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
  try { persist(startBattle(state, id)); selectedSpell = null; selectedTarget = null; mathOpen = true; mathFeedback = null; battleEvents = [`A wild ${encounter(id).name} appeared!`]; view = 'battle'; render(true, true); } catch (error) { toast(error.message); }
}
function interactWith(object) {
  try {
    if (object.type === 'chest') { const before = state.coins; persist(grantTreasure(state, object.id)); render(); toast(`Treasure found! +${state.coins - before} leaf coins.`); sound('win'); }
    else if (object.type === 'npc') { persist(talkToRanger(state, object.id)); modal(object.name || 'Trail Ranger', `<p>${esc(object.dialogue || 'Elemental strengths and a balanced team can turn a difficult battle around.')}</p><p class="small">Tip: correct math fills shared magic for your explorer and both dinosaurs.</p>`, button('close-dialog', 'Thanks!', 'gold')); }
    else if (object.type === 'beacon' && object.id.endsWith('-camp')) { view = 'camp'; render(true, true); }
    else if (object.type === 'beacon') modal(object.name || 'Ancient beacon', `<p>${state.completed.length === 12 ? 'Every habitat beacon shines. Bramble Island is peaceful again—and your team can keep exploring and growing.' : 'The sanctuary is waiting for all four habitat beacons to be restored.'}</p>`, button('close-dialog', 'Continue exploring', 'gold'));
    else if (object.type === 'enemy') beginEncounter(object.encounterId || object.id);
  } catch (error) { toast(error.message); }
}
function stopWorld() { suppressWorldSave = true; worldController?.destroy(); worldController = null; suppressWorldSave = false; }
function travelTo(id) { if (!isRegionUnlocked(state, id)) { toast('Restore the earlier habitat before entering this trail.'); worldController?.setState(state); return; } stopWorld(); const spawn = WORLD_CONFIG[id]?.spawn || { x: 220, y: 760 }; persist(updatePosition(state, { regionId: id, x: spawn.x, y: spawn.y })); render(true, true); announce(`Traveled to ${region(id).name}.`); }
function exportProgress() { const blob = new Blob([serializeGame(state)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `math-go-${state.player.name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 24) || 'explorer'}-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10_000); toast('Progress downloaded. Keep the JSON file somewhere safe.'); }
function chooseTargetFor(spell) { if (!spell || !state.battle) return null; if (spell.target === 'self') return state.battle.activeId; if (spell.target === 'all') return 'all'; const units = spell.target === 'ally' ? state.battle.allies : state.battle.enemies; return units.find((unit) => unit.hp > 0)?.id || null; }

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]'); if (!control || control.disabled) return; const action = control.dataset.action; const id = control.dataset.id;
  try {
    if (action === 'close-dialog') { dialog.close(); pendingImport = null; }
    else if (action === 'import') { importer.value = ''; importer.click(); }
    else if (action === 'export') exportProgress();
    else if (action === 'recover-new') modal('Replace the unreadable save?', '<p>Import a backup first if you have one. Starting over replaces browser progress only after setup.</p>', button('confirm-recover', 'Start over', 'danger'));
    else if (action === 'confirm-recover') { replaceBrokenSave = true; dialog.close(); render(true, true); }
    else if (action === 'confirm-import' && pendingImport) { stopWorld(); saveConflict = false; selectedSpell = null; selectedTarget = null; mathFeedback = null; lastResult = null; persist(pendingImport); pendingImport = null; loadError = ''; dialog.close(); view = state.battle ? 'battle' : 'world'; render(true, true); toast('Adventure imported. Welcome back!'); }
    else if (!state) return;
    else if (action === 'dismiss-migration') { migrationNote = ''; render(); }
    else if (action === 'navigate') { const requested = control.dataset.view; view = requested === 'world' && state.battle ? 'battle' : requested; if (view !== 'battle') { mathFeedback = null; battleEvents = []; } render(true, true); }
    else if (action === 'resume-battle') { view = 'battle'; render(true, true); }
    else if (action === 'travel') travelTo(id);
    else if (action === 'interact') worldController?.interact();
    else if (action === 'charge') { mathOpen = true; mathFeedback = null; render(); document.querySelector('#battle-answer')?.focus(); }
    else if (action === 'select-spell') { selectedSpell = id; selectedTarget = chooseTargetFor(SPELLS.find((spell) => spell.id === id)); render(); document.querySelector(`[data-action="select-spell"][data-id="${id}"]`)?.focus(); }
    else if (action === 'target') { selectedTarget = id; render(); document.querySelector(`[data-action="target"][data-id="${id}"]`)?.focus(); }
    else if (action === 'cast') {
      const spell = SPELLS.find((item) => item.id === selectedSpell); if (!spell) return; const result = castSpell(state, selectedSpell, selectedTarget || chooseTargetFor(spell)); persist(result.state); battleEvents = result.events || []; battleEffect = `cast-${spell.element}`; selectedSpell = null; selectedTarget = null; mathFeedback = null;
      if (result.outcome === 'ongoing') { mathOpen = state.battle.mana < 2; sound('magic'); render(); setTimeout(() => { battleEffect = ''; }, 650); }
      else { lastResult = { ...result, message: result.events?.at(-1) || (result.outcome === 'win' ? 'The wild creatures are calm again.' : 'Your team made it back safely.') }; view = 'result'; sound(result.outcome === 'win' ? 'win' : 'hit'); render(true, true); }
    }
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
  event.preventDefault(); const form = event.target; const data = new FormData(form);
  if (form.id === 'gate-form') { if (String(data.get('code')).trim() !== atob(ACCESS)) { document.querySelector('#gate-error').textContent = 'That code does not match. Capital letters matter.'; document.querySelector('#access-code').select(); return; } unlocked = true; try { sessionStorage.setItem(ACCESS_KEY, 'open'); } catch {} if (!state) loadProgress(); render(true, true); return; }
  if (form.id === 'setup-form') { try { persist(createGame({ name: String(data.get('name')).trim(), starter: data.get('starter'), topic: data.get('topic') })); view = 'world'; loadError = ''; render(true, true); } catch (error) { document.querySelector('#setup-error').textContent = error.message; } }
  else if (form.id === 'charge-form' && state?.battle) { const value = String(data.get('answer')).trim(); if (!/^\d+$/.test(value)) { document.querySelector('#answer-error').textContent = 'Enter a whole number, like 24.'; return; } try { const result = chargeMana(state, Number(value)); persist(result.state); mathFeedback = result; mathOpen = !result.correct; if (result.correct) { sound('magic'); battleEvents = [result.message]; } render(); announce(result.message); document.querySelector(result.correct ? '#spell-grid button:not(:disabled)' : '#battle-answer')?.focus(); } catch (error) { document.querySelector('#answer-error').textContent = error.message; } }
  else if (form.id === 'settings-form') { persist({ ...state, topic: data.get('topic'), settings: { sound: data.get('sound') === 'on' } }); toast('Practice settings saved.'); sound('magic'); }
});

importer.setAttribute('aria-label', 'Import progress');
importer.addEventListener('change', async () => {
  const file = importer.files?.[0]; if (!file) return;
  try { if (file.size > 512_000) throw new Error('Choose a Math Go JSON file smaller than 512 KB.'); pendingImport = parseGame(await file.text()); modal('Continue this adventure?', `<p><b>${esc(pendingImport.player.name)}</b> · Level ${getLevel(pendingImport)}<br>${pendingImport.completed.length} story encounters · ${pendingImport.collection.length} dinosaur friends</p><p>${state ? 'Importing replaces browser progress after confirmation. Download your current game first if you want both.' : 'This becomes the browser autosave.'}</p>`, `${state ? button('export', 'Download current save', 'light') : ''}${button('confirm-import', 'Import adventure', 'gold')}`); }
  catch (error) { pendingImport = null; modal('Could not import this file', `<p role="alert">${esc(error.message)}</p><p>Your current adventure has not changed.</p>`); }
});
window.addEventListener('storage', (event) => { if (event.key === SAVE_KEY && state) { saveConflict = true; storageWarning = 'Another tab changed the browser save. Autosave is paused here; download this tab before leaving.'; render(); } });
window.addEventListener('beforeunload', (event) => { if (state && storageWarning) { event.preventDefault(); event.returnValue = ''; } });
try { unlocked = sessionStorage.getItem(ACCESS_KEY) === 'open'; } catch {}
if (unlocked) loadProgress();
render();
