(() => {
  'use strict';

  const config = window.MATH_GAME_CONFIG;
  const levelsPanel = document.querySelector('#levels-panel');
  const levelsEl = document.querySelector('#levels');
  const setupPanel = document.querySelector('#setup-panel');
  const setupTitle = document.querySelector('#setup-title');
  const pickRow = document.querySelector('#pick-row');
  const pickedNumber = document.querySelector('#picked-number');
  const gamePanel = document.querySelector('#game-panel');
  const completePanel = document.querySelector('#complete-panel');
  const gameTitle = document.querySelector('#game-title');
  const illustrationLink = document.querySelector('#illustration-link');
  const progressText = document.querySelector('#progress-text');
  const progressBar = document.querySelector('#progress-bar');
  const questionEl = document.querySelector('#question');
  const dice = document.querySelector('#dice');
  const form = document.querySelector('#answer-form');
  const answer = document.querySelector('#answer');
  const submit = document.querySelector('#submit');
  const feedback = document.querySelector('#feedback');
  const animals = document.querySelector('#animals');
  const manipulative = document.querySelector('#manipulative');

  const animalFriends = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐨', '🐰', '🦁', '🐯', '🐵', '🦄', '🐧'];
  const state = { level: null, question: 0, current: null, mode: 'random', picked: 0, rolling: false };
  let selectedStickId = null;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function hideAll() {
    levelsPanel.hidden = true;
    setupPanel.hidden = true;
    gamePanel.hidden = true;
    completePanel.hidden = true;
  }

  function showLevels() {
    hideAll();
    levelsPanel.hidden = false;
  }

  function makeProblem() {
    const level = state.level;
    let left = randomInt(level.left[0], level.left[1]);
    let right = randomInt(level.right[0], level.right[1]);

    if (level.special === 'times-table' && state.mode === 'picked') left = state.picked;
    if (level.operator === '-' && right > left) [left, right] = [right, left];

    const result = level.operator === '+' ? left + right : level.operator === '-' ? left - right : left * right;
    return { left, right, operator: level.operator, text: `${left} ${level.operator} ${right} = ?`, result };
  }

  function stick(id, label) {
    return `<button class="counting-stick" id="${id}" type="button" draggable="true" aria-label="${label}"></button>`;
  }

  function updateAdditionCounts() {
    const boxes = [...manipulative.querySelectorAll('.addition-box')];
    boxes.forEach(box => {
      const count = box.querySelectorAll('.counting-stick').length;
      box.querySelector('.box-count').textContent = `${count} of ${box.dataset.goal}`;
    });
    const complete = boxes.every(box => box.querySelectorAll('.counting-stick').length === Number(box.dataset.goal));
    const hint = manipulative.querySelector('.stick-hint');
    hint.textContent = complete ? `Great! Count all ${state.current.result} sticks, then enter the answer.` : 'Drag a stick, or tap a stick and then tap a rectangle.';
    hint.classList.toggle('complete', complete);
  }

  function moveAdditionStick(stickEl, destination) {
    if (!stickEl || !destination || stickEl.parentElement === destination) return;
    const goal = Number(destination.dataset.goal);
    if (Number.isFinite(goal) && destination.querySelectorAll('.counting-stick').length >= goal) return;
    destination.append(stickEl);
    manipulative.querySelectorAll('.counting-stick').forEach(item => item.classList.remove('selected'));
    updateAdditionCounts();
  }

  function updateSubtractionCount() {
    const crossed = manipulative.querySelectorAll('.subtraction-stick.crossed').length;
    const status = manipulative.querySelector('.cross-status');
    status.textContent = `${crossed} crossed out`;
    status.classList.toggle('complete', crossed === state.current.right);
    manipulative.querySelector('.stick-hint').textContent = crossed === state.current.right ? 'Great! Count the sticks that are not crossed out, then enter the answer.' : `Click ${state.current.right} ${state.current.right === 1 ? 'stick' : 'sticks'} to cross them out. Click again to undo.`;
  }

  function renderManipulative() {
    if (!manipulative) return;
    selectedStickId = null;
    const kind = state.level.manipulative;
    manipulative.hidden = !kind;
    if (!kind) {
      manipulative.replaceChildren();
      return;
    }

    if (kind === 'addition-sticks') {
      const sticks = Array.from({ length: 20 }, (_, index) => stick(`stick-${state.question}-${index}`, `Stick ${index + 1}`)).join('');
      manipulative.innerHTML = `
        <div class="manipulative-title"><strong>Build the two groups</strong><button class="mini-button" type="button" data-reset-sticks>Reset sticks</button></div>
        <p class="stick-hint">Drag a stick, or tap a stick and then tap a rectangle.</p>
        <div class="stick-zone stick-bank" data-zone="bank" aria-label="Stick basket" tabindex="0">${sticks}<span class="zone-label">Stick basket</span></div>
        <div class="addition-boxes">
          <div class="stick-zone addition-box" data-zone="left" data-goal="${state.current.left}" tabindex="0"><span class="zone-label">First group: ${state.current.left}</span><span class="box-count">0 of ${state.current.left}</span></div>
          <span class="box-operator">+</span>
          <div class="stick-zone addition-box" data-zone="right" data-goal="${state.current.right}" tabindex="0"><span class="zone-label">Second group: ${state.current.right}</span><span class="box-count">0 of ${state.current.right}</span></div>
        </div>`;
      updateAdditionCounts();
      return;
    }

    const sticks = Array.from({ length: state.current.left }, (_, index) => `<button class="subtraction-stick" type="button" aria-pressed="false" aria-label="Stick ${index + 1}"></button>`).join('');
    manipulative.innerHTML = `
      <div class="manipulative-title"><strong>Cross out the sticks you subtract</strong></div>
      <p class="stick-hint"></p>
      <div class="subtraction-box">${sticks}</div>
      <p class="cross-status" aria-live="polite"></p>`;
    updateSubtractionCount();
  }

  function revealQuestion() {
    state.current = makeProblem();
    state.question += 1;
    questionEl.textContent = state.current.text;
    progressText.textContent = `Question ${state.question} of 10`;
    progressBar.style.width = `${state.question * 10}%`;
    dice.hidden = true;
    questionEl.hidden = false;
    submit.disabled = false;
    state.rolling = false;
    renderManipulative();
    answer.focus();
  }

  function nextQuestion() {
    answer.value = '';
    feedback.textContent = '';
    feedback.className = 'feedback';

    if (state.level.special === 'times-table') {
      state.rolling = true;
      submit.disabled = true;
      questionEl.hidden = true;
      dice.hidden = false;
      window.setTimeout(revealQuestion, 550);
    } else {
      revealQuestion();
    }
  }

  function startGame(level, mode = 'random', picked = 0) {
    state.level = level;
    state.question = 0;
    state.mode = mode;
    state.picked = picked;
    hideAll();
    gamePanel.hidden = false;
    gameTitle.textContent = level.title;
    illustrationLink.hidden = !level.illustration;
    if (level.illustration) illustrationLink.href = level.illustration;
    nextQuestion();
  }

  function chooseLevel(level) {
    if (level.special === 'times-table') {
      state.level = level;
      hideAll();
      setupPanel.hidden = false;
      setupTitle.textContent = level.title;
      pickRow.hidden = true;
    } else {
      startGame(level);
    }
  }

  function finish() {
    hideAll();
    completePanel.hidden = false;
    const first = animalFriends[randomInt(0, animalFriends.length - 1)];
    let second = animalFriends[randomInt(0, animalFriends.length - 1)];
    while (second === first) second = animalFriends[randomInt(0, animalFriends.length - 1)];
    animals.textContent = `${first} ${second}`;
  }

  config.levels.forEach(level => {
    const button = document.createElement('button');
    button.className = 'level';
    button.type = 'button';
    button.innerHTML = `<strong>Level ${level.id}: ${level.title}</strong><span>${level.description}</span>`;
    button.addEventListener('click', () => chooseLevel(level));
    levelsEl.append(button);
  });

  if (manipulative) {
    manipulative.addEventListener('dragstart', event => {
      const stickEl = event.target.closest('.counting-stick');
      if (!stickEl) return;
      event.dataTransfer.setData('text/plain', stickEl.id);
      event.dataTransfer.effectAllowed = 'move';
      stickEl.classList.add('selected');
    });
    manipulative.addEventListener('dragover', event => {
      if (event.target.closest('.stick-zone')) event.preventDefault();
    });
    manipulative.addEventListener('drop', event => {
      const zone = event.target.closest('.stick-zone');
      if (!zone) return;
      event.preventDefault();
      moveAdditionStick(document.getElementById(event.dataTransfer.getData('text/plain')), zone);
      selectedStickId = null;
    });
    manipulative.addEventListener('click', event => {
      if (event.target.closest('[data-reset-sticks]')) {
        renderManipulative();
        return;
      }

      const subtractionStick = event.target.closest('.subtraction-stick');
      if (subtractionStick) {
        const crossed = subtractionStick.classList.toggle('crossed');
        subtractionStick.setAttribute('aria-pressed', String(crossed));
        updateSubtractionCount();
        return;
      }

      const stickEl = event.target.closest('.counting-stick');
      if (stickEl) {
        manipulative.querySelectorAll('.counting-stick').forEach(item => item.classList.remove('selected'));
        if (selectedStickId === stickEl.id) {
          selectedStickId = null;
        } else {
          selectedStickId = stickEl.id;
          stickEl.classList.add('selected');
        }
        return;
      }

      const zone = event.target.closest('.stick-zone');
      if (zone && selectedStickId) {
        moveAdditionStick(document.getElementById(selectedStickId), zone);
        selectedStickId = null;
      }
    });
    manipulative.addEventListener('keydown', event => {
      const zone = event.target.closest('.stick-zone');
      if (zone && selectedStickId && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        moveAdditionStick(document.getElementById(selectedStickId), zone);
        selectedStickId = null;
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (state.rolling || !state.current) return;
    const value = Number(answer.value);
    if (answer.value.trim() === '' || !Number.isFinite(value)) return;

    if (value !== state.current.result) {
      feedback.textContent = 'Almost! Try that one again.';
      feedback.className = 'feedback try';
      answer.select();
      return;
    }

    feedback.textContent = 'Correct! ⭐';
    feedback.className = 'feedback good';
    submit.disabled = true;
    if (state.question === 10) {
      window.setTimeout(finish, 650);
    } else {
      window.setTimeout(nextQuestion, 500);
    }
  });

  document.querySelector('#random-mode').addEventListener('click', () => startGame(state.level, 'random'));
  document.querySelector('#pick-mode').addEventListener('click', () => {
    pickRow.hidden = false;
    pickedNumber.focus();
  });
  document.querySelector('#start-picked').addEventListener('click', () => startGame(state.level, 'picked', Number(pickedNumber.value)));
  document.querySelectorAll('[data-show-levels]').forEach(button => button.addEventListener('click', showLevels));
  document.querySelector('#play-again').addEventListener('click', () => chooseLevel(state.level));
})();
