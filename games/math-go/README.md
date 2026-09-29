# Math Go · Dino Galaxy RPG

Math Go is an original, free, single-player Grade 3 math RPG. It is a static website: no backend, account, database, analytics, advertising, remote JavaScript, paid currency, or premium tier.

## The game

Move the explorer with **Arrow keys** or **WASD** (or the on-screen direction pad). The world is larger than the viewport and the camera follows the party. Each of the seven regions across four planets has paths, obstacles, a ranger, two hidden supply chests, three story encounters, a repeatable roaming encounter, and a gate to the next region. Walk into an unresolved creature to begin a battle; press **E** or **Space** near characters, chests, camps, and completed creatures.

Battles take place in a full-screen, original 2.5D starlight arena. Canvas scenery adds a raised stone platform, depth layers, an ancient portal, crystals, aurora ribbons, and drifting lights, with a palette for each region. The explorer and up to two dinosaur companions face one to three enemies. Every living party member gets a turn before the enemy team responds. Each enemy attack, guardian roar, shield, burn, and healing tick plays as its own visual step, with health changing at impact. Each turn presents a compact four-card spell dock that favors effective elemental attacks: choose a spell, then click a glowing valid target to cast it. **All spells** opens every learned spell for the active teammate. Enemy intent labels, a turn-order ribbon, weakness hints, and boss warnings help players plan. Fireballs trail embers, water and wind spiral across the arena, vines lash enemies, rocks tumble, sunbeams shine, and arcane bolts burst into sparks. Characters breathe, cast, recoil, and celebrate; persistent bubbles show shields. Floating numbers include elemental advantages and blocked damage. Correct Grade 3 math restores six points of shared magic; spells spend that magic. Wrong answers do not advance the enemy turn and provide a hint. **Try another question** replaces a tricky problem with a different random question from the selected practice topic (or any topic in mixed mode). It is free, keeps the current turn and team safe, and grants no magic or stars until a question is solved. Skipping an unattempted problem does not count as a mistake; an earlier submitted attempt stays in the practice record. Every solved puzzle, including a successful retry, also earns one of three team stars. Three stars unlock **Dino Starburst**, a meteor shower that hits all enemies, costs no mana, consumes the active teammate’s turn, and resets the stars. Stars last for the current encounter and are included in saves.

The 25 regular spells plus the new shared team special cover Arcane, Leaf, Water, Fire, Stone, Air, and Sun elements. They include focused and whole-team attacks, elemental advantages, healing, regeneration, draining, shields, burns, and cooldowns. Guardians telegraph powerful whole-party moves. Sound and **Gentle effects** can be toggled directly in battle; reduced motion from the operating system is respected. Sounds are synthesized locally, and no media is downloaded. Winning awards XP and coins. Every 100 XP raises the team level, increases health and power, and can unlock new spells. The campaign contains 21 story encounters and seven repeatable roaming battles; the level cap remains 20.

The **Style** workshop offers five hairstyles, four hair colors, four outfits, and five clothes colors with a live preview. Save the look to wear it in both the world and battles. Five weapons unlock by level 6: the Wayfinder Staff keeps all 25 regular spells, while the Ember Saber, Tidecaller Wand, Stormstring Bow, and Moonstone Hammer specialize in two elements and each add two signature spells. Neutral attack, heal, shield, and capture-preparation magic remain available with every weapon. Equipment changes are allowed between battles.

The **Team** page lets players choose a trail buddy and an optional second companion from 13 dinosaurs. Six new species include Velociraptor, Pachycephalosaurus, Spinosaurus, Dilophosaurus, Therizinosaurus, and Protoceratops. All companions, weapons, styles, and four gear items are earned or chosen through play. No real money is accepted.

In battle, open **Catch** to use a Friend Orb on an uncollected wild dinosaur with 30% HP or less and no shield. Each attempt costs 3 MP and the active teammate’s turn. The displayed chance starts at 60%, rises to 85% at 15% HP, and improves by 15 percentage points after each miss, capped at 95%. **Gentle Tap** costs 1 MP, works for every teammate, and leaves at least 1 HP while calming burning embers. Captured dinosaurs leave the enemy team and remain in the collection even if the team retreats; select them from Team afterward. Capturing the last foe wins the encounter. Primary guardians cannot be caught, but their defeated story rewards still earn a dinosaur friend. Captures, chances, and battle progress survive saving and reloading.

The **Planets** map opens Lunara after Bramble’s first guardian; its recommended level is 7. Defeating the Crater Colossus unlocks Cinderis (recommended level 11), then the Furnace Regent opens Zephyria (recommended level 15). Players can return to Bramble’s four regions to train. The new worlds have original moon-crater, volcanic, and cloud-garden scenery. Their bosses telegraph Meteor Stomp, Solar Eruption, and Tempest Spiral attacks, deal stronger damage below half health, and have extra durability. The Tempest Crown also restores some health every third round.

## Grade 3 practice

- Two- and three-digit addition and nonnegative subtraction.
- Single-digit multiplication and two-digit × single-digit multiplication.
- Exact division facts.
- Equal fraction pieces, quarter-hour elapsed time, and rectangular area.

Choose one topic or mixed practice at Base Camp. “Fraction pieces” is a focused missing-parts activity, not a complete Grade 3 fractions curriculum. The game is low-pressure practice and does not replace teaching.

## Saves and family access

The family access code is Base64-encoded in `app.mjs`. This is a convenience gate, **not secure authentication**: browser code is inspectable. Do not use it to protect sensitive data.

Version 2 progress autosaves to `localStorage` under `math-go-save-v2`. Existing Version 1 saves are migrated without losing completed encounters, XP, coins, companions, equipment, settings, or practice statistics. An unfinished Version 1 menu battle returns safely to the trail because the new battle state is structurally different. Older Version 2 saves receive the default explorer look, the original staff, and empty capture records; battle saves missing team stars load with zero stars. The existing level cap and original unit statistics are preserved for active-save compatibility. A cast saves its complete rules result before the visual sequence, so refreshing during an animation cannot duplicate a turn or its rewards.

Base Camp can download or upload a portable JSON save. Use a nickname, not personal information. Imports strictly validate the schema, IDs, bounds, progression, statistics, party state, spell cooldowns, combat values, and saved math; imported strings are never executed. The current browser game is replaced only after confirmation. Another-tab changes pause autosave in the older tab, and storage failures show a download warning.

## Development and tests

Serve the repository over HTTP because the game uses ES modules:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/games/math-go/`.

Rules and walkable-world tests need only Node.js 18+:

```sh
node --test games/math-go/tests/core.test.mjs games/math-go/tests/rpg-core.test.mjs games/math-go/tests/galaxy-core.test.mjs games/math-go/tests/world.test.mjs
```

The real-browser RPG suite uses Playwright plus Chrome and covers keyboard movement, party turns, math/mana/stars, all seven elemental effect families, healing/shields, the full spellbook, guardian telegraphs and animations, sound/motion controls, mid-cast reload, level rewards, migration, file saves, mobile controls and layout, wardrobe preview and persistence, weapon-specific spells, pet selection, planet travel, failed/successful capture, Gentle Tap, boss phases, and storage conflicts:

```sh
node games/math-go/tests/rpg-browser.mjs
```

The earlier Version 1 engine and tests remain in `core.mjs` and `tests/core.test.mjs` as the trusted question generator and migration reference.

## Files

- `app.mjs`, `rpg.css`: game interface, access gate, saves, menus, and responsive controls.
- `battle-arena.mjs`, `combat.css`: original perspective arena renderer, spell choreography, combat UI, and victory celebration. Canvas 2D creates a lightweight 2.5D presentation; it is not a WebGL 3D scene.
- `galaxy.mjs`, `galaxy.css`: shared customization, weapon, dinosaur, planet, and boss catalogs plus workshop, collection, star-map, and capture styles.
- `world.mjs`: original canvas overworlds, camera, movement, collisions, roaming encounters, companions, interactions, and touch controls.
- `rpg-core.mjs`: immutable RPG rules, progression, combat, spells, strict saves, and Version 1 migration.
- `core.mjs`: Grade 3 question generation and original Version 1 validation.
- `art.mjs`: original SVG explorer, dinosaurs, and scenery.
- `assets/island.webp`: original generated island artwork used on the entrance screen.
- `RESEARCH.md`: verified sources, unavailable-video disclosure, and design mapping.

## Research and originality

See [RESEARCH.md](RESEARCH.md) for the source-by-source notes. The mechanics research used Prodigy’s current official battle FAQ, official detailed battle guide, official pet-team guide, and official exploration overview. The official battle video could not initially be fetched online; a user-supplied local copy was later reviewed visually to study battle staging, compact spell selection, explicit targeting, and cast feedback. No artwork or interface assets were copied from it.

Math Go borrows broad RPG conventions—walkable exploration, party turns, mana, elemental strengths, cooldowns, experience, and collectible companions. Its Bramble Island and Dino Galaxy settings, story, characters, dinosaur art, map art, spell names, formulas, balance, UI, and code are original. It is not affiliated with Prodigy and uses none of its assets.
