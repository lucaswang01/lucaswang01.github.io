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
