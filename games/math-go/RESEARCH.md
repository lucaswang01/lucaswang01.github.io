# Math Go: reference research and original design

## Verified battle mechanics

Prodigy's official [Battling in Prodigy Math](https://prodigygame.zendesk.com/hc/en-us/articles/12910978061844-Battling-in-Prodigy-Math) article, marked updated July 21, 2026, describes encounters found while exploring its island. A battle team includes the player character and pets; all participate in turns. Correct math answers replenish the magic points needed for spells. Players choose spells and enemy targets, considering elemental matchups, power, aim, and recharge time. These mechanics make the central loop broader than selecting a question from a menu: exploration leads to an encounter, math replenishes a resource, and the player spends that resource on tactical actions. This source confirms the intended loop; it does not establish exact movement controls, encounter coordinates, damage formulas, or pacing for Math Go.

The official [Battle Remake — Player Guide](https://prodigygame.zendesk.com/hc/en-us/articles/13204482504852-Battle-Remake-Player-Guide), marked updated April 21, 2023, provides more detail. The battle display shows health, level, and elemental weakness. Teammates can attack, elemental matchups affect decisions, and healing is available through spells. Its targeting examples include one selected opponent, all opponents, repeated hits, and a random opponent. Spell cards expose information needed to plan future turns, including recharge status. Math Go adopts the general ideas of visible party status, targeted attacks, healing, and readable spell costs/cooldowns. Its names, artwork, elements, spell definitions, numbers, and rules are independently created; this older guide is a mechanics reference, not proof of every current commercial-game detail.

## Team management and exploration

The official [Select Pets for your Battle Team](https://prodigygame.zendesk.com/hc/en-us/articles/204255099-How-to-Select-Pets-for-your-Battle-Team) instructions, marked updated July 8, 2026, describe managing the active roster through a pet collection menu. Players can swap pets, remove a pet from the active team, or add a collected pet. The wizard remains a required member. This supports a distinct playable explorer accompanied by an editable dinosaur party in Math Go, with each companion able to act in combat rather than serving only as a visual bonus.

Prodigy's official [educator overview](https://www.prodigygame.com/main-en/nea) connects exploration, quests, math battles, rewards, and rescued pets. It also describes adaptive instruction and online social play. Math Go intentionally implements a smaller, single-player Grade 3 adventure. It does not claim to reproduce Prodigy's curriculum breadth, adaptive placement, multiplayer systems, live events, or teacher services.

## Video review

The official battle guide embeds [this battle walkthrough](https://www.youtube.com/watch?v=bn8MsKYc100). Direct online requests initially failed, but the user later supplied a local 95-second copy that was reviewed visually from beginning to end. It demonstrates a wide scenic battlefield, the full player and enemy teams remaining visible, a compact bottom spell dock, explicit target selection, individual party turns, weakness and health displays, spell-specific impact animation, floating damage, and attack categories such as focused, area, multi-hit, and random-target actions. Its math screen temporarily interrupts the battle and returns with a visible magic-refill transition. The video is a battle-system feature overview; it does not demonstrate overworld keyboard movement, encounter triggering, campaign progression, or XP leveling.

A [longer gameplay video](https://www.youtube.com/watch?v=Ov_H3ZuKBMA) was also located, but it was not accessible and no transcript was available. No claims are attributed to that footage.

## Math Go implementation decisions

- Explore original nature habitats with a moving explorer, visible dinosaur encounters, obstacles, local characters, and treasure. Keyboard and touch controls are Math Go choices, not a claim about Prodigy's input system.
- Keep the explorer and up to two collected dinosaurs on the active party. Give party members their own health, elemental spells, and turns.
- Require correct Grade 3 math to charge shared mana. Casting consumes mana; mistakes allow a hint and a retry without an enemy attack. Avoid a repeatable free attack that bypasses the math loop.
- Show targets, mana costs, elemental advantages, healing, and cooldowns clearly. Unlock original spells and improve character stats through earned experience.
- Keep every creature, spell, and upgrade obtainable through play. Use an encoded family access gate, browser autosave, and portable JSON downloads/imports; no account, database, paid tier, or online interaction is required.

These are design choices informed by the sources, not copies of their wording, characters, maps, art, proprietary code, or exact balance.


## September 29, 2026 — Combat presentation and agency

This pass focuses on an original, age-appropriate battle spectacle with decisions a nine-year-old can understand. These are design choices informed by game examples, not claims of measured learning or engagement improvements.

- [Prodigy: Battle Remake — Player Guide](https://prodigygame.zendesk.com/hc/en-us/articles/13204482504852-Battle-Remake-Player-Guide). Official guide read directly. Party turns, intentional target selection, elemental strengths, readable health values, and informative spell cards support strategic choices. Math Go now exposes every learned spell through a battle spellbook, prioritizes useful elemental attacks in the small dock, labels weaknesses, and shows enemy intentions and turn order.
- [Prodigy: Battling in Prodigy Math](https://prodigygame.zendesk.com/hc/en-us/articles/12910978061844-Battling-in-Prodigy-Math). Official search result describes using correct math to refill shared magic and using the whole party in battles. Math Go keeps math as the fuel and adds a visible three-star goal; a solved retry earns the same star, and wrong answers do not cause enemy attacks or remove earned stars.
- [Blizzard: Patch 7.3 New Combat Animations — It’s Magic!](https://worldofwarcraft.blizzard.com/en-us/news/20946579/patch-73-new-combat-animations-its-magic). Official search excerpt describes casting animations and updated spell effects. Direct page access returned HTTP 403; no embedded video was inspected. The broad inspiration is distinct casting and impact feedback. Math Go implements original fire trails, vines, water/wind spirals, stone projectiles, sunbeams, arcane bolts, protective bubbles, and a team meteor shower.
- [Blizzard: Pet Battles Q&A with Cory Stockton](https://worldofwarcraft.blizzard.com/en-us/news/7339047/pet-battles-qa-with-cory-stockton). Official search excerpt describes turn-based strategy and collection rewards. The existing collectible dinosaur party remains central; each enemy and companion gets visible choreography so the team feels present.

Implementation decisions:

- Use original Canvas 2D perspective scenery for a **2.5D** scene, with depth layers and region palettes. This avoids an external rendering dependency and keeps static hosting and local-only play intact. There are no imported Warcraft or Prodigy characters, art, sound, or code.
- Capture structured battle snapshots in the rules engine instead of inferring damage from English log strings. Animate actual player actions, enemy actions, burn damage, regeneration, and shields in order. Health bars update at impact.
- Make the shared special deterministic: three solved puzzles produce one Dino Starburst. No answer timer, chance-based reward, purchase, daily-pressure mechanic, or mistake penalty was added.
- Respect system reduced motion and a persistent in-game gentle-effects preference. The renderer uses capped pixel density and animation rate, skips hidden-tab painting, and destroys its animation frame and resize observer when leaving the scene.
- Save a move atomically before showing its animation. Old Version 2 saves default the new stars field to zero. Tests exercise mid-animation reloads, strict star validation, real enemy chronology, elemental effect families, and phone controls.


## Dino Galaxy expansion

This expansion implements the requested customization, collection, planetary exploration, and boss features as original game systems. It adds a saved appearance workshop, five weapons with distinct spell selections, two editable companion slots, six illustrated dinosaur species, and three planets. A catch attempt uses earned magic and a teammate turn; visible chances improve after failure. Gentle Tap prevents an accidental knockout, including from lingering embers. There are no paid attempts or random item purchases. Primary guardians remain challenges to defeat, and story rewards still grant companions.

The new bosses have named, scheduled attacks, a visible stronger phase below half health, and a healing pattern for the final boss. Their tells make added difficulty something players can plan around. Older saves retain their original combat statistics, equipment, collection, and progression, with defaults for the new fields. These choices respond to the requested gameplay; they are not claims about the exact mechanics of Pokémon or any other commercial game.
