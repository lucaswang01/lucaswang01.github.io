import {
  HABITATS, DINOS, TOPICS, GEARS, MOVES, ADOPTION_COST, adoptDino,
  createSave, validateSave, parseSave, serializeSave, getLevel,
  isHabitatUnlocked, beginBattle, submitAnswer,
} from './core.mjs';
import { dinoArt, heroArt, sceneArt } from './art.mjs';

// A family access gate, not authentication: anything shipped to a browser is inspectable.
const ACCESS = 'THVjYXM=';
const SAVE_KEY = 'math-go-save-v1';
const ACCESS_KEY = 'math-go-access-v1';
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const importer = document.querySelector('#import-file');
const symbols = { leaf: '❧', water: '◉', stone: '◆', sun: '☀' };
const starters = ['sprig', 'brook', 'pebble'];
let state = null;
let view = 'map';
let habitatId = 'fern';
let unlocked = false;
let storageWarning = '';
let loadError = '';
let feedback = null;
let showHint = false;
let pendingImport = null;
let toastTimer;
let audioContext;
let replaceBrokenSave = false;
let saveConflict = false;

const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const dino = (id) => DINOS.find((item) => item.id === id);
const habitat = (id) => HABITATS.find((item) => item.id === id);
const completedHabitat = (id) => habitat(id).encounters.every((item) => state.completed.includes(item.id));
const topicName = (id) => id === 'mixed' ? 'Mixed Grade 3 practice' : TOPICS.find((item) => item.id === id)?.label;
const progress = (value, total) => `<div class="meter" role="progressbar" aria-label="Progress" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${total}"><span style="--fill:${Math.min(100, value / total * 100)}%"></span></div>`;
const button = (action, label, classes = '', extra = '') => `<button class="btn ${classes}" data-action="${action}" ${extra}>${label}</button>`;
const topicOptions = (current) => [{ id: 'mixed', label: 'Mixed Grade 3 practice' }, ...TOPICS].map((topic) => `<option value="${topic.id}" ${current === topic.id ? 'selected' : ''}>${topic.label}</option>`).join('');
function announce(message) { document.querySelector('#announcement').textContent = message; }
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 5200);
}
function persist(nextState = state) {
  state = validateSave(nextState);
  // Keep this tab playable in memory without overwriting another tab's adventure.
  if (saveConflict) return;
  try { localStorage.setItem(SAVE_KEY, serializeSave(state)); storageWarning = ''; }
  catch { storageWarning = 'This browser cannot autosave. Download your progress before leaving!'; }
}
function loadProgress() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) state = parseSave(saved);
  } catch (error) {
    loadError = 'We could not open the browser save. It has not been changed. Import a downloaded save, or choose to start over.';
  }
  if (state?.battle) { habitatId = state.battle.habitatId; view = 'battle'; }
  else if (state) habitatId = HABITATS.find((item) => isHabitatUnlocked(state, item.id) && !completedHabitat(item.id))?.id || 'summit';
}
function sound(win = false) {
  if (!state?.settings.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    [392, 494, win ? 784 : 587].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + index * .09;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.045, start + .015);
      gain.gain.exponentialRampToValueAtTime(.001, start + .2);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start); oscillator.stop(start + .21);
    });
  } catch { /* Sound is optional, including in browsers without Web Audio. */ }
}
function modal(title, content, actions) {
  dialog.innerHTML = `<h2 id="dialog-title">${title}</h2>${content}<div class="button-row">${button('close-dialog', 'Cancel', 'ghost')}${actions}</div>`;
  if (!dialog.open) dialog.showModal();
}
function heading(eyebrow, title, description, aside = '', className = '') {
  return `<header class="page-heading ${className}"><div><span class="eyebrow">${eyebrow}</span><h1 tabindex="-1">${title}</h1><p class="muted">${description}</p></div>${aside}</header>`;
}
function gateScreen() {
  return `<main class="gate"><section class="gate-art"><div class="gate-story"><span class="eyebrow">A little math. A big adventure.</span><h1>Wild friends.<br>Bright minds.</h1><p>A hidden island, curious dinosaurs, and an adventure powered by you. Welcome to Bramble Island.</p><span class="pill gold">Grade 3 · Always free</span></div></section>
    <section class="gate-form-wrap"><div class="gate-starter">${dinoArt('sprig')}</div><p class="wordmark">Math <span>Go</span></p><p class="muted">Your next adventure starts here.</p>
    <form id="gate-form"><div class="field"><label for="access-code">Family access code</label><input id="access-code" name="code" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-describedby="gate-error" placeholder="Enter your code"></div><button class="btn gold" type="submit">Let’s explore →</button><p id="gate-error" class="error" role="alert"></p></form>
    <p class="small muted">No account. No ads. No memberships.<br>Your adventure stays on your device.</p><a class="gate-link" href="../">← Back to the Games Room</a></section></main>`;
}
function setupScreen() {
  return `<main class="setup"><a href="../">← Games Room</a><h1>Every explorer needs a friend.</h1><p class="muted">Choose your first dinosaur. Together, you’ll help four wild habitats flourish.</p>
    ${loadError && !replaceBrokenSave ? `<div class="notice"><p>${loadError}</p><div class="button-row">${button('import', 'Import progress', 'small')}${button('recover-new', 'Start a new adventure', 'small ghost')}</div></div>` : ''}
    <form id="setup-form"><div class="setup-fields"><div class="field"><label for="explorer-name">Explorer nickname</label><input id="explorer-name" name="name" required maxlength="24" autocomplete="off" placeholder="What should we call you?"></div><div class="field"><label for="setup-topic">Math to practice</label><select id="setup-topic" name="topic">${topicOptions('mixed')}</select></div></div>
    <fieldset class="starter-fieldset"><legend>Pick a dinosaur companion</legend><div class="starter-grid">${starters.map((id, index) => `<label class="starter-card"><input type="radio" name="starter" value="${id}" data-starter="${id}" ${index === 0 ? 'checked' : ''}>${dinoArt(id)}<div><h3>${dino(id).name}</h3><p>${dino(id).description}</p></div></label>`).join('')}</div></fieldset>
    <div class="button-row"><button class="btn gold" type="submit" ${loadError && !replaceBrokenSave ? 'disabled' : ''}>Start my adventure →</button>${button('import', 'Import a saved adventure', 'ghost', 'type="button"')}</div><p id="setup-error" class="error" role="alert"></p><p class="small muted">Use a nickname, not a full name. Progress autosaves in this browser. Download a JSON save to keep a backup or switch devices.</p></form></main>`;
}
function shell(content) {
  const friend = dino(state.equipped);
  const links = [['map', '⌘', 'Island map'], ['companions', '❧', 'Dino friends'], ['gear', '◇', 'Trail gear'], ['journal', '▤', 'Field journal'], ['camp', '⌂', 'Base camp']];
  return `<header class="topbar"><a class="brand" href="../" aria-label="Back to Games Room"><span class="brand-badge">M</span><div><p class="wordmark">Math <span>Go</span></p><p class="brand-sub">THE BRAMBLE ISLAND ADVENTURE</p></div></a><div class="player-status"><span class="status-chip name">${esc(state.player.name)}</span><span class="status-chip">Level ${getLevel(state)}</span><span class="status-chip"><span class="coin">✦</span> ${state.coins} <span class="sr-only">leaf coins</span></span></div></header>
    <div class="shell"><aside class="sidebar"><nav class="nav-list" aria-label="Adventure">${links.map(([id, symbol, label]) => `<button class="nav-item" data-action="navigate" data-view="${id}" ${view === id || id === 'map' && ['battle', 'result'].includes(view) ? 'aria-current="page"' : ''}><span class="nav-symbol" aria-hidden="true">${symbol}</span>${label}</button>`).join('')}</nav><div class="companion-mini">${dinoArt(friend.id)}<strong>${friend.name} is by your side</strong><p>${symbols[friend.element]} ${friend.element} companion</p>${progress(state.xp % 120, 120)}<p>${state.xp} adventure XP</p></div><p class="side-footer">A whole island of possibility.<br>Everything earned through play.<br><a href="../">← Games Room</a></p></aside>
    <main class="content">${storageWarning ? `<div class="notice" role="alert">${storageWarning} ${button('export', 'Download now', 'small')}</div>` : ''}${state.battle && view !== 'battle' ? `<div class="welcome-note">Your challenge is paused. ${button('resume', 'Resume challenge →', 'small')}</div>` : ''}${content}</main></div>`;
}
function mapScreen() {
  const selected = habitat(habitatId);
  const done = state.completed.length;
  const allDone = done === 12;
  return `${heading('Your adventure awaits', `Let’s explore, ${esc(state.player.name)}.`, 'Follow the trails. Make new friends. Let your ideas grow.', '<span class="pill gold">Grade 3 explorer</span>')}
    ${!state.stats.answered ? '<div class="welcome-note"><strong>Welcome to Bramble Island!</strong> The sanctuary’s four nature beacons need your help. Start in Fernwood Trail: choose a move, solve a math puzzle, and power up your dinosaur. There’s no timer, and it’s always okay to try again.</div>' : ''}
    <div class="map-layout"><section class="map-panel" aria-label="Bramble Island habitats"><img class="map-backdrop" src="assets/island.webp" alt="A lush dinosaur island with a fern forest, waterfall, crystal grove, and golden mountain"><span class="map-label">BRAMBLE ISLAND · FIELD MAP</span>
    ${HABITATS.map((area, index) => { const open = isHabitatUnlocked(state, area.id); return `<button class="map-node ${open ? '' : 'locked'}" style="--x:${area.x}%;--y:${area.y}%" data-action="habitat" data-id="${area.id}" aria-label="${area.name}${open ? '' : ', locked'}" aria-pressed="${area.id === habitatId}"><span class="node-circle" aria-hidden="true">${completedHabitat(area.id) ? '✓' : open ? symbols[area.element] : '◇'}</span><span class="node-label">${index + 1}. ${area.name}</span></button>`; }).join('')}
    <div class="map-footer"><span>✦ ${HABITATS.filter((area) => completedHabitat(area.id)).length} / 4 nature beacons restored</span><span>One discovery at a time</span></div></section>
    <aside class="map-side"><section class="card quest-card"><span class="eyebrow">${allDone ? 'Sanctuary restored' : 'The island quest'}</span><h2>${allDone ? 'You made it bloom.' : 'Bring Bramble<br>back to life.'}</h2><p>${allDone ? 'All four beacons shine! Replay any trail for new math, extra coins, and more practice.' : 'Complete three friendly challenges in each habitat to restore its beacon and meet a new dinosaur.'}</p>${progress(done, 12)}<div class="quest-numbers"><span>${done} of 12 challenges</span><span>${Math.round(done / 12 * 100)}%</span></div></section>
    <section class="card habitat-card"><span class="eyebrow">${selected.subtitle}</span><h3>${selected.name}</h3><p>${selected.description}</p>${isHabitatUnlocked(state, selected.id) ? `<div class="encounter-list">${selected.encounters.map((encounter) => `<button class="encounter-button" data-action="encounter" data-id="${encounter.id}"><span class="mini-art">${dinoArt(encounter.dinoId)}</span><span><strong>${encounter.name}</strong><small>${state.completed.includes(encounter.id) ? '✓ Complete · Play again' : encounter.boss ? '★ Habitat guardian' : 'Friendly challenge'} →</small></span></button>`).join('')}</div>` : '<p class="notice">Complete all three challenges in the previous habitat to open this trail.</p>'}</section></aside></div>
    <div class="trail-cards"><div class="trail-card"><span class="trail-symbol">❧</span><div><strong>${state.collection.length} dinosaur friend${state.collection.length === 1 ? '' : 's'}</strong><small>There’s a whole herd to meet</small></div></div><div class="trail-card"><span class="trail-symbol">✎</span><div><strong>${topicName(state.topic)}</strong><small>Change topics at Base camp</small></div></div><div class="trail-card"><span class="trail-symbol">♡</span><div><strong>Take your time</strong><small>No timers. Every try helps you learn.</small></div></div></div>`;
}
function collectionScreen() {
  return `${heading('Better together', 'Your dinosaur friends', 'Every friend brings a different strength. Choose who joins your next challenge.')}
    <div class="collection-grid">${DINOS.map((friend) => {
      const owned = state.collection.includes(friend.id);
      const equipped = friend.id === state.equipped;
      return `<article class="card dino-card ${owned ? '' : 'locked'}"><span class="pill">${symbols[friend.element]} ${friend.element} friend</span>${dinoArt(friend.id)}<h3>${friend.name}</h3><p>${friend.description}</p>${owned ? button('equip-dino', equipped ? '✓ Adventuring together' : 'Choose companion', equipped ? 'light' : '', `data-id="${friend.id}" ${equipped || state.battle ? 'disabled' : ''}`) : !friend.unlockHabitat ? button('adopt-dino', `Befriend · ${ADOPTION_COST} coins`, 'light', `data-id="${friend.id}" ${state.coins < ADOPTION_COST || state.battle ? 'disabled' : ''}`) : `<span class="pill">Restore ${habitat(friend.unlockHabitat).name}</span>`}</article>`;
    }).join('')}</div><p class="small muted">Leaf coins are earned by completing challenges. You never buy them with money.${state.battle ? ' Finish or leave the current challenge before changing companions.' : ''}</p>`;
}
function gearScreen() {
  return `${heading('Pack for possibility', 'A little trail magic', 'Trade the leaf coins you earn for useful gear. No money, no memberships, ever.')}
    <div class="gear-grid">${GEARS.map((item) => { const owned = state.ownedGear.includes(item.id); const equipped = state.gear === item.id; return `<article class="card gear-card">${heroArt({ gear: item.id })}<div><span class="eyebrow">${equipped ? 'Equipped' : owned ? 'In your backpack' : 'Earn through play'}</span><h3>${item.name}</h3><p>${item.description}</p>${button('gear', equipped ? '✓ Equipped' : owned ? 'Equip gear' : `${item.cost} leaf coins`, owned ? 'light small' : 'small', `data-id="${item.id}" ${equipped || state.battle || !owned && state.coins < item.cost ? 'disabled' : ''}`)}</div></article>`; }).join('')}</div>
    <p class="small muted">One gear item at a time. Gear bonuses apply to your dinosaur’s next challenge.${state.battle ? ' Finish or leave your challenge before changing gear.' : ''}</p>`;
}
function health(name, value, max, enemy = false) {
  return `<div class="hp-chip ${enemy ? 'enemy' : ''}"><strong>${name}</strong>${progress(value, max)}<small>${value} / ${max} energy</small></div>`;
}
function questionModel(question) {
  const data = question.data;
  if (question.topic === 'fractions') return `<div class="fraction-model" aria-label="A leaf divided into ${data.denominator} equal pieces">${Array.from({ length: data.denominator }, (_, index) => `<span class="fraction-piece ${index < data.known ? 'green' : index < data.known + data.missing ? 'yellow' : ''}"></span>`).join('')}</div>`;
  if (question.topic === 'area') return '<p class="small muted">Area tells us how many square units cover a rectangle.</p>';
  return '';
}
function battleScreen() {
  if (!state.battle) { view = 'map'; return mapScreen(); }
  const battle = state.battle;
  const area = habitat(battle.habitatId);
  const encounter = area.encounters.find((item) => item.id === battle.encounterId);
  const friend = dino(state.equipped);
  const enemy = dino(encounter.dinoId);
  const waiting = feedback?.outcome === 'hit';
  const selectedMove = MOVES.find((item) => item.id === battle.selectedMove);
  return `${heading(area.name, encounter.name, encounter.description, button('leave-battle', 'Leave trail', 'ghost small'), 'battle-heading')}
    <div class="battle-layout"><section><div class="arena ${waiting ? 'spell-animation' : ''}"><div class="arena-scenery">${sceneArt(area.id)}</div><div class="hp-row">${health(friend.name, battle.playerHp, battle.playerMaxHp)}${health(enemy.name, battle.enemyHp, battle.enemyMaxHp, true)}</div><div class="arena-dinos"><div class="fighter">${dinoArt(friend.id, { className: 'idle' })}<div class="fighter-label">Your companion</div></div><div class="fighter enemy">${dinoArt(enemy.id)}<div class="fighter-label">${encounter.boss ? 'Habitat guardian' : 'Friendly challenger'}</div></div></div></div>
    <div class="move-list" role="group" aria-label="Choose a move">${MOVES.map((move, index) => `<button class="move" data-action="move" data-id="${move.id}" aria-pressed="${move.id === battle.selectedMove}" ${waiting ? 'disabled' : ''}><span aria-hidden="true">${['❧', '☀', '♡'][index]}</span><strong>${move.name}</strong><small>${move.damage} power${move.heal ? ` · +${move.heal} energy` : ''}</small></button>`).join('')}</div><p class="battle-info">${selectedMove.description} ${friend.element === 'leaf' && battle.selectedMove === 'strike' ? 'Your leaf friend adds 3 power!' : ''}</p><details class="battle-log"><summary>How to play</summary><p>Choose a move, then solve the puzzle to use it. Your challenger makes a friendly move afterward. Try Rest & Restore when your energy is low. Wrong answers never cost energy.</p></details></section>
    <section class="card question-card" aria-label="Math question">${waiting ? `<span class="eyebrow">Your idea powered a move!</span><h2>Nicely worked out.</h2><p class="battle-feedback" role="status">${esc(feedback.message)}</p><p class="small muted">Your challenger returned ${feedback.incoming} power. Take your time with the next puzzle.</p>${button('next-question', 'Next puzzle →', 'gold', 'id="next-question"')}` : `<span class="pill gold">${topicName(battle.question.topic)} · Turn ${battle.turn}</span><h2 id="question-prompt">${esc(battle.question.prompt)}</h2>${questionModel(battle.question)}<form id="answer-form"><label for="battle-answer">Your answer</label><input id="battle-answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]+" maxlength="7" autocomplete="off" required aria-describedby="question-prompt answer-error"><button class="btn gold" id="submit-answer" type="submit">Use ${selectedMove.name} →</button></form><p id="answer-error" class="error" role="alert"></p>${feedback?.outcome === 'incorrect' ? `<p class="battle-feedback wrong" role="status">${esc(feedback.message)}</p>` : ''}<div class="question-tools"><button class="text-button" data-action="hint" aria-expanded="${showHint}">${showHint ? 'Hide hint' : 'I’d like a hint'}</button><span class="muted">No rush ♡</span></div>${showHint ? `<div class="hint">${esc(battle.question.hint)}</div>` : ''}`}</section></div>`;
}
function resultScreen() {
  if (!feedback || !['win', 'retreat'].includes(feedback.outcome)) return mapScreen();
  const reward = feedback.reward;
  const friend = dino(reward?.creature || state.equipped);
  return `<section class="result"><span class="eyebrow">${reward?.campaignComplete ? 'All four beacons are shining' : reward?.creature ? 'A new friendship begins' : reward ? 'One more discovery' : 'A well-earned rest'}</span><div>${dinoArt(friend.id)}</div><h1 tabindex="-1">${reward?.campaignComplete ? 'You restored Bramble Island!' : reward?.creature ? `${friend.name} joined your herd!` : reward ? 'Trail complete!' : 'Let’s recharge.'}</h1><p>${esc(feedback.message)}</p>${reward ? `<div class="reward-row"><span class="pill gold">+${reward.xp} XP</span><span class="pill gold">+${reward.coins} leaf coins</span></div>` : '<p>Your progress is safe. Every new challenge starts at full energy.</p>'}${reward?.habitatComplete ? `<p class="welcome-note">${reward.campaignComplete ? 'The whole sanctuary is thriving. Keep exploring: every replay brings fresh puzzles. You can still collect friends and gear!' : 'A nature beacon is restored, and a new habitat is open on your map!'}</p>` : ''}<div class="button-row">${button('navigate', 'Back to the island →', 'gold', 'data-view="map"')}${reward?.creature ? button('navigate', 'Meet my new friend', 'light', 'data-view="companions"') : button('export', 'Download progress', 'light')}</div></section>`;
}
function journalScreen() {
  const stats = state.stats;
  return `${heading('Look how far you’ve come', 'Your field journal', 'A gentle record of your adventure. Learning matters more than a perfect score.')}
    <div class="journal-top"><div class="card journal-stat">Puzzles tried<strong>${stats.answered}</strong></div><div class="card journal-stat">First-try correct<strong>${stats.correct}</strong></div><div class="card journal-stat">Best first-try streak<strong>${stats.bestStreak}</strong></div></div>
    <section class="card"><h2>Growing your math skills</h2><p class="muted small">Each puzzle is counted once, even when you try again. Hints are always welcome.</p><table class="topic-table"><thead><tr><th scope="col">Topic</th><th scope="col">Puzzles tried</th><th scope="col">First-try correct</th></tr></thead><tbody>${TOPICS.map((topic) => `<tr><th scope="row">${topic.label}</th><td>${stats.byTopic[topic.id]?.answered || 0}</td><td>${stats.byTopic[topic.id]?.correct || 0}</td></tr>`).join('')}</tbody></table></section>`;
}
function campScreen() {
  return `${heading('Make yourself at home', 'Base camp', 'Your supplies, settings, and a safe place to save your adventure.')}
    <div class="camp-layout"><section class="card"><span class="eyebrow">Take your adventure with you</span><h2>Save & continue</h2><p>Progress autosaves in this browser. Download a JSON file for a backup, another device, or a different explorer. Clearing browser data removes the browser save.</p><div class="button-row">${button('export', '↓ Download progress', 'gold')}${button('import', '↑ Import progress', 'light')}</div><p class="small">An import asks before replacing your current adventure. No progress is sent to a server.</p></section>
    <section class="card"><span class="eyebrow">For explorers & grown-ups</span><h2>Practice your way</h2><form id="settings-form"><div class="field"><label for="practice-topic">Math topic</label><select id="practice-topic" name="topic">${topicOptions(state.topic)}</select></div><label class="checkbox-label"><input type="checkbox" name="sound" ${state.settings.sound ? 'checked' : ''}> Play gentle move sounds</label><p class="small">Topic changes apply after the current puzzle, if one is in progress. There are no timers or penalties for wrong answers.</p><button class="btn" type="submit">Save settings</button></form></section>
    <section class="card"><h2>The explorer’s handbook</h2><p><strong>1.</strong> Pick a habitat and a friendly challenge.<br><strong>2.</strong> Pick a move. Solve the math to power it.<br><strong>3.</strong> Complete three challenges to restore a beacon and meet its guardian.<br><strong>4.</strong> Spend earned leaf coins on friends or gear, and keep exploring!</p><p>Solar Burst is strong but lets your challenger hit harder. Rest & Restore trades power for energy. Friend traits and gear add bonuses.</p></section>
    <section class="card"><h2>A fresh trail</h2><p>Want to start another explorer? Download this adventure first. There is one autosave slot per browser.</p><div class="button-row">${button('new-adventure', 'Start a new adventure', 'ghost')}${button('lock', 'Lock game', 'ghost')}</div><p class="small">Always free. No ads, account, purchases, or online chat. This original mini-adventure has 12 replayable challenges.</p></section></div>`;
}
function render(focus = false) {
  if (!unlocked) app.innerHTML = gateScreen();
  else if (!state) app.innerHTML = setupScreen();
  else {
    const screens = { map: mapScreen, companions: collectionScreen, gear: gearScreen, battle: battleScreen, result: resultScreen, journal: journalScreen, camp: campScreen };
    app.innerHTML = shell((screens[view] || mapScreen)());
  }
  const questionPrompt = app.querySelector('#question-prompt');
  if (questionPrompt?.textContent.length > 28) questionPrompt.classList.add('word-problem');
  if (focus) {
    const target = app.querySelector('h1[tabindex], #battle-answer, #explorer-name, #access-code');
    target?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
function exportProgress() {
  if (!state) return;
  const blob = new Blob([serializeSave(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const name = state.player.name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 24) || 'explorer';
  anchor.href = url;
  anchor.download = `math-go-${name}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast('Your save download is ready. Keep it somewhere safe!');
}
function navigate(nextView) {
  view = nextView;
  if (nextView !== 'battle') feedback = null;
  render(true);
}
function startEncounter(encounterId) {
  if (state.battle) { toast('Resume or leave your current challenge first.'); view = 'battle'; render(true); return; }
  persist(beginBattle(state, habitatId, encounterId));
  feedback = null; showHint = false; view = 'battle'; render(true);
}

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control || control.disabled) return;
  const action = control.dataset.action;
  const id = control.dataset.id;
  try {
    if (action === 'close-dialog') { dialog.close(); pendingImport = null; }
    else if (action === 'import') { importer.value = ''; importer.click(); }
    else if (action === 'export') exportProgress();
    else if (action === 'confirm-import' && pendingImport) {
      saveConflict = false;
      persist(pendingImport); pendingImport = null; dialog.close(); loadError = ''; feedback = null; showHint = false;
      habitatId = state.battle?.habitatId || HABITATS.find((area) => isHabitatUnlocked(state, area.id) && !completedHabitat(area.id))?.id || 'summit';
      view = state.battle ? 'battle' : 'map'; render(true); toast('Adventure imported. Welcome back!');
    }
    else if (action === 'recover-new') modal('Start over?', '<p>The unreadable browser save will be replaced when you start a new adventure. If you have a downloaded backup, try importing it first.</p>', button('confirm-recover', 'Start over', 'danger'));
    else if (action === 'confirm-recover') { replaceBrokenSave = true; dialog.close(); render(true); }
    else if (!state) return;
    else if (action === 'navigate') navigate(control.dataset.view);
    else if (action === 'habitat') { habitatId = id; render(); document.querySelector(`[data-action="habitat"][data-id="${id}"]`)?.focus(); announce(`${habitat(id).name} selected.`); }
    else if (action === 'encounter') {
      const encounter = habitat(habitatId).encounters.find((item) => item.id === id);
      modal(encounter.name, `<div class="dialog-dino">${dinoArt(encounter.dinoId)}</div><p>${encounter.description}</p><p class="small">Choose a move, then answer math questions to power it. Wrong answers are safe to retry. You can pause whenever you like.</p>`, button('start-encounter', 'Let’s go →', 'gold', `data-id="${id}"`));
    }
    else if (action === 'start-encounter') { dialog.close(); startEncounter(id); }
    else if (action === 'resume') { view = 'battle'; render(true); }
    else if (action === 'move' && state.battle && feedback?.outcome !== 'hit') {
      // Keep a partly typed answer when choosing a different move.
      const typed = document.querySelector('#battle-answer')?.value || '';
      persist({ ...state, battle: { ...state.battle, selectedMove: id } }); render();
      document.querySelector('#battle-answer').value = typed;
      document.querySelector(`[data-action="move"][data-id="${id}"]`)?.focus();
    }
    else if (action === 'hint') {
      const typed = document.querySelector('#battle-answer')?.value || '';
      showHint = !showHint; render(); document.querySelector('#battle-answer').value = typed;
      document.querySelector('[data-action="hint"]')?.focus();
      if (showHint) announce(state.battle.question.hint);
    }
    else if (action === 'next-question') { feedback = null; showHint = false; render(); document.querySelector('#battle-answer')?.focus(); }
    else if (action === 'leave-battle') modal('Leave this challenge?', '<p>You keep all your earned friends, coins, and practice progress. This unfinished challenge will restart at full energy next time.</p>', button('confirm-leave', 'Leave challenge', 'gold'));
    else if (action === 'confirm-leave') { persist({ ...state, battle: null }); dialog.close(); feedback = null; navigate('map'); }
    else if (action === 'equip-dino' && !state.battle && state.collection.includes(id)) { persist({ ...state, equipped: id }); render(true); toast(`${dino(id).name} is ready to explore!`); }
    else if (action === 'adopt-dino' && !state.battle) { persist(adoptDino(state, id)); render(true); sound(true); toast(`${dino(id).name} joined your herd!`); }
    else if (action === 'gear' && !state.battle) {
      const item = GEARS.find((gear) => gear.id === id);
      const owned = state.ownedGear.includes(id);
      if (!item || !owned && state.coins < item.cost) return;
      persist({ ...state, gear: id, coins: state.coins - (owned ? 0 : item.cost), ownedGear: owned ? state.ownedGear : [...state.ownedGear, id] });
      render(true); toast(`${item.name} equipped!`);
    }
    else if (action === 'new-adventure') modal('A new explorer?', '<p>This replaces the browser’s current adventure. Download your progress first so you can return to it later.</p>', `${button('export', 'Download current save', 'light')}${button('confirm-new', 'Start fresh', 'danger')}`);
    else if (action === 'confirm-new') {
      saveConflict = false;
      try { localStorage.removeItem(SAVE_KEY); } catch { /* The storage warning appears on the next save. */ }
      state = null; feedback = null; loadError = ''; replaceBrokenSave = false; dialog.close(); render(true);
    }
    else if (action === 'lock') {
      try { sessionStorage.removeItem(ACCESS_KEY); } catch { /* Memory gate still locks. */ }
      // Keep an in-memory adventure even if persistent storage is unavailable.
      unlocked = false; render(true);
    }
  } catch (error) { toast(error.message); }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  if (form.id === 'gate-form') {
    if (String(data.get('code')).trim() !== atob(ACCESS)) {
      document.querySelector('#gate-error').textContent = 'That code doesn’t match. Try again (capital letters matter).';
      document.querySelector('#access-code').select(); return;
    }
    unlocked = true;
    try { sessionStorage.setItem(ACCESS_KEY, 'open'); } catch { /* The gate still works in memory. */ }
    if (!state) { saveConflict = false; loadProgress(); }
    render(true); return;
  }
  if (form.id === 'setup-form') {
    if (loadError && !replaceBrokenSave) return;
    try {
      persist(createSave({ name: String(data.get('name')).trim(), starter: data.get('starter'), topic: data.get('topic') }));
      loadError = ''; view = 'map'; habitatId = 'fern'; render(true);
    } catch (error) { document.querySelector('#setup-error').textContent = error.message; }
    return;
  }
  if (form.id === 'answer-form' && state?.battle && feedback?.outcome !== 'hit') {
    const value = String(data.get('answer')).trim();
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      document.querySelector('#answer-error').textContent = 'Enter a whole number, like 12.'; return;
    }
    try {
      feedback = submitAnswer(state, Number(value), state.battle.selectedMove);
      persist(feedback.state);
      if (feedback.outcome === 'win' || feedback.outcome === 'retreat') view = 'result';
      showHint = feedback.outcome === 'incorrect';
      if (feedback.outcome !== 'incorrect') sound(feedback.outcome === 'win');
      render(); announce(feedback.message);
      document.querySelector(feedback.outcome === 'incorrect' ? '#battle-answer' : feedback.outcome === 'hit' ? '#next-question' : '.result h1')?.focus();
    } catch (error) { document.querySelector('#answer-error').textContent = error.message; }
  }
  if (form.id === 'settings-form' && state) {
    persist({ ...state, topic: data.get('topic'), settings: { sound: data.get('sound') === 'on' } });
    toast('Settings saved. The topic applies after any puzzle already in progress.'); sound();
  }
});

importer.setAttribute('aria-label', 'Import progress');
importer.addEventListener('change', async () => {
  const file = importer.files?.[0];
  if (!file) return;
  try {
    if (file.size > 100_000) throw new Error('Choose a Math Go JSON file smaller than 100 KB.');
    pendingImport = parseSave(await file.text());
    modal('Continue this adventure?', `<p><strong>${esc(pendingImport.player.name)}</strong> · Level ${getLevel(pendingImport)}<br>${pendingImport.completed.length} trails completed · ${pendingImport.collection.length} dinosaur friends</p><p>${state ? 'Importing replaces your current browser progress. Download your current adventure first if you want to keep it.' : 'This adventure will become your browser autosave.'}</p>`, `${state ? button('export', 'Download current save', 'light') : ''}${button('confirm-import', 'Import this adventure', 'gold')}`);
  } catch (error) {
    pendingImport = null;
    modal('Could not import this file', `<p role="alert">${esc(error.message)}</p><p>Your current progress has not been changed.</p>`, '');
  }
});
// Another tab must not silently overwrite the adventure being played here.
window.addEventListener('storage', (event) => {
  if (event.key === SAVE_KEY && state) {
    saveConflict = true;
    storageWarning = 'Another tab changed the browser save. Autosave is paused here. Download this adventure to keep your changes.';
    render();
  }
});
window.addEventListener('beforeunload', (event) => {
  if (state && storageWarning) { event.preventDefault(); event.returnValue = ''; }
});
try { unlocked = sessionStorage.getItem(ACCESS_KEY) === 'open'; } catch { /* Ask for the code each visit if session storage is unavailable. */ }
if (unlocked) loadProgress();
render();
