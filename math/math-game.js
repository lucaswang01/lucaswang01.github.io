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
  const progressText = document.querySelector('#progress-text');
  const progressBar = document.querySelector('#progress-bar');
  const questionEl = document.querySelector('#question');
  const dice = document.querySelector('#dice');
  const form = document.querySelector('#answer-form');
  const answer = document.querySelector('#answer');
  const submit = document.querySelector('#submit');
  const feedback = document.querySelector('#feedback');
  const animals = document.querySelector('#animals');

  const animalFriends = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐨', '🐰', '🦁', '🐯', '🐵', '🦄', '🐧'];
  const state = { level: null, question: 0, current: null, mode: 'random', picked: 0, rolling: false };

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
    return { text: `${left} ${level.operator} ${right} = ?`, result };
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
