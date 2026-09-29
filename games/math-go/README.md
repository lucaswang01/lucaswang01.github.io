# Math Go · Bramble Island RPG

Math Go is an original, free, single-player Grade 3 math RPG. It is a static website: no backend, account, database, analytics, advertising, remote JavaScript, paid currency, or premium tier.

## The game

Move the explorer with **Arrow keys** or **WASD** (or the on-screen direction pad). The world is larger than the viewport and the camera follows the party. Each of the four regions has paths, obstacles, a ranger, two hidden supply chests, three story encounters, a repeatable roaming encounter, and a gate to the next region. Walk into an unresolved creature to begin a battle; press **E** or **Space** near characters, chests, camps, and completed creatures.

Battles take place in a full-screen, original 2.5D starlight arena. Canvas scenery adds a raised stone platform, depth layers, an ancient portal, crystals, aurora ribbons, and drifting lights, with a palette for each region. The explorer and up to two dinosaur companions face one to three enemies. Every living party member gets a turn before the enemy team responds. Each enemy attack, guardian roar, shield, burn, and healing tick plays as its own visual step, with health changing at impact. Each turn presents a compact four-card spell dock that favors effective elemental attacks: choose a spell, then click a glowing valid target to cast it. **All spells** opens every learned spell for the active teammate. Enemy intent labels, a turn-order ribbon, weakness hints, and boss warnings help players plan. Fireballs trail embers, water and wind spiral across the arena, vines lash enemies, rocks tumble, sunbeams shine, and arcane bolts burst into sparks. Characters breathe, cast, recoil, and celebrate; persistent bubbles show shields. Floating numbers include elemental advantages and blocked damage. Correct Grade 3 math restores six points of shared magic; spells spend that magic. Wrong answers do not advance the enemy turn and provide a hint. Every solved puzzle, including a successful retry, also earns one of three team stars. Three stars unlock **Dino Starburst**, a meteor shower that hits all enemies, costs no mana, consumes the active teammate’s turn, and resets the stars. Stars last for the current encounter and are included in saves.

The 25 regular spells plus the new shared team special cover Arcane, Leaf, Water, Fire, Stone, Air, and Sun elements. They include focused and whole-team attacks, elemental advantages, healing, regeneration, draining, shields, burns, and cooldowns. Guardians telegraph powerful whole-party moves. Sound and **Gentle effects** can be toggled directly in battle; reduced motion from the operating system is respected. Sounds are synthesized locally, and no media is downloaded. Winning awards XP and coins. Every 100 XP raises the team level, increases health and power, and can unlock new spells. The original campaign contains 12 story encounters and four repeatable roaming battles; the level cap is 20.

All seven original dinosaurs and four gear items are earned through play. The explorer is always present; collected dinosaurs can be swapped into the two companion slots. No real money is accepted.

## Grade 3 practice

- Two- and three-digit addition and nonnegative subtraction.
- Single-digit multiplication and two-digit × single-digit multiplication.
- Exact division facts.
- Equal fraction pieces, quarter-hour elapsed time, and rectangular area.

Choose one topic or mixed practice at Base Camp. “Fraction pieces” is a focused missing-parts activity, not a complete Grade 3 fractions curriculum. The game is low-pressure practice and does not replace teaching.

## Saves and family access

The family access code is Base64-encoded in `app.mjs`. This is a convenience gate, **not secure authentication**: browser code is inspectable. Do not use it to protect sensitive data.

Version 2 progress autosaves to `localStorage` under `math-go-save-v2`. Existing Version 1 saves are migrated without losing completed encounters, XP, coins, companions, equipment, settings, or practice statistics. An unfinished Version 1 menu battle returns safely to the trail because the new battle state is structurally different. Older Version 2 battle saves load with zero team stars. A cast saves its complete rules result before the visual sequence, so refreshing during an animation cannot duplicate a turn or its rewards.

Base Camp can download or upload a portable JSON save. Use a nickname, not personal information. Imports strictly validate the schema, IDs, bounds, progression, statistics, party state, spell cooldowns, combat values, and saved math; imported strings are never executed. The current browser game is replaced only after confirmation. Another-tab changes pause autosave in the older tab, and storage failures show a download warning.

## Development and tests

Serve the repository over HTTP because the game uses ES modules:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/games/math-go/`.

Rules and walkable-world tests need only Node.js 18+:

```sh
node --test games/math-go/tests/rpg-core.test.mjs games/math-go/tests/world.test.mjs
```

The real-browser RPG suite uses Playwright plus Chrome and covers keyboard movement, party turns, math/mana/stars, all seven elemental effect families, healing/shields, the full spellbook, guardian telegraphs and animations, sound/motion controls, mid-cast reload, level rewards, migration, file saves, mobile controls and layout, and storage conflicts:

```sh
node games/math-go/tests/rpg-browser.mjs
```

The earlier Version 1 engine and tests remain in `core.mjs` and `tests/core.test.mjs` as the trusted question generator and migration reference.

## Files

- `app.mjs`, `rpg.css`: game interface, access gate, saves, menus, and responsive controls.
- `battle-arena.mjs`, `combat.css`: original perspective arena renderer, spell choreography, combat UI, and victory celebration. Canvas 2D creates a lightweight 2.5D presentation; it is not a WebGL 3D scene.
- `world.mjs`: original canvas overworlds, camera, movement, collisions, roaming encounters, companions, interactions, and touch controls.
- `rpg-core.mjs`: immutable RPG rules, progression, combat, spells, strict saves, and Version 1 migration.
- `core.mjs`: Grade 3 question generation and original Version 1 validation.
- `art.mjs`: original SVG explorer, dinosaurs, and scenery.
- `assets/island.webp`: original generated island artwork used on the entrance screen.
- `RESEARCH.md`: verified sources, unavailable-video disclosure, and design mapping.

## Research and originality

See [RESEARCH.md](RESEARCH.md) for the source-by-source notes. The mechanics research used Prodigy’s current official battle FAQ, official detailed battle guide, official pet-team guide, and official exploration overview. The official battle video could not initially be fetched online; a user-supplied local copy was later reviewed visually to study battle staging, compact spell selection, explicit targeting, and cast feedback. No artwork or interface assets were copied from it.

Math Go borrows broad RPG conventions—walkable exploration, party turns, mana, elemental strengths, cooldowns, experience, and collectible companions. Its Bramble Island setting, story, characters, dinosaur art, map art, spell names, formulas, balance, UI, and code are original. It is not affiliated with Prodigy and uses none of its assets.
