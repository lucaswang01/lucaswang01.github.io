# Math Go · Bramble Island

An original, free, single-player Grade 3 dinosaur math adventure. It is a static page: no backend, build step, account, database, analytics, advertising, paid upgrades, or remote JavaScript dependencies.

## Play

Open the **Games Room → Math Go**, enter the family access code, and choose a nickname and one of three dinosaur companions. Select a habitat, start a friendly challenge, pick a move, and solve the math puzzle to power it. Wrong answers leave both dinosaurs' energy unchanged and offer a hint. There are no timers.

Complete three challenges in each of four habitats. Each restored habitat unlocks another dinosaur and the next area. The 12-challenge campaign is replayable with new randomized math. Earn leaf coins for gear and the other starter companions. Seven original companions and four gear items are available; everything is earned through play.

**Base camp** offers topic selection, optional synthesized sounds, save downloads/imports, and starting a new explorer. **Field journal** records puzzles tried and first-try correct counts, counting each puzzle once even if retried. Hints do not lower a score.

## Grade 3 practice

- Two- and three-digit addition and nonnegative subtraction.
- Single-digit multiplication and two-digit × single-digit multiplication.
- Division facts with whole-number answers.
- Equal fraction pieces, elapsed time in minutes, and rectangle area.

Choose one topic or mixed practice. This first version is a finite adventure with randomized questions, not an adaptive curriculum, multiplayer service, or full commercial-game replacement. There are no online interactions with strangers.

## Saves and the access gate

The family code is Base64-encoded in `app.mjs`. **This is a convenience gate, not secure authentication.** A static client-side code can be decoded or bypassed. Never use this design to protect sensitive information.

Progress autosaves to `localStorage` under `math-go-save-v1`; access is remembered for the browser session. A JSON export contains only the explorer nickname and game state, including a current challenge. Use a nickname instead of personal information. Export regularly: clearing site data, switching browsers, or private browsing may remove the browser copy. There is one autosave slot per browser/origin, so use separate JSON files for multiple children.

Browsers cannot silently write to arbitrary files. Download/upload is the portable JSON workflow, not a server file or database. Import validates the schema, version, IDs, ranges, progression, topic statistics, and saved-question math; no imported strings are executed. Imports over 100 KB are rejected. The current adventure is replaced only after a confirmation; the dialog offers a backup download first. An unreadable browser save is preserved until the user explicitly chooses to replace it. Storage failures show a warning; another-tab changes suspend this tab's autosave so it cannot blindly overwrite the newer save.

The save format is `math-go`, version `1`. Since this is a local family game, JSON validation is for safety and consistency, not anti-cheating or tamper-proofing.

## Develop and test

Serve the repository with any static HTTP server, for example from the repository root:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/games/math-go/`. Use HTTP rather than opening `index.html` as a `file://` URL because the game uses ES modules. The existing GitHub Pages host serves it without a build step.

Pure game-rule tests (Node.js 18+; no packages):

```sh
node --test games/math-go/tests/core.test.mjs
```

Browser regression tests use Playwright and Chrome. See the test script for local runtime discovery; set `CHROME_PATH` when Chrome is installed elsewhere:

```sh
node games/math-go/tests/browser-smoke.mjs
```

## Files

- `index.html`, `style.css`, `theme.css`: responsive game shell and styling.
- `app.mjs`: UI, encoded gate, autosave, import/export, synthesized sound.
- `core.mjs`: deterministic-testable math, battles, progression, strict save normalization.
- `art.mjs`: original code-native SVG dinosaurs, explorer, scenery, and fallback map.
- `assets/island.webp`: original generated storybook island artwork, optimized for the web.
- `tests/`: rules and real-browser regression tests.

## Research and original art

Researched Prodigy's official [game overview](https://www.prodigygame.com/main-en/blog/what-is-prodigy-math-game) and [battle guide](https://prodigygame.zendesk.com/hc/en-us/articles/12910978061844-Battling-in-Prodigy-Math). The broad inspiration is math-powered turn-based challenges, exploration, collectible companions, and earned rewards. Math Go has its own setting, characters, art, wording, and rules; it is not affiliated with Prodigy and uses none of its assets.

The island backdrop was created with the imagegen skill/tool, then converted from PNG to WebP. The dinosaur characters and battle scenes are original editable SVG, not generated sprite sheets. Island generation prompt:

> Use case: illustration-story. Asset type: original background art for a children's browser dinosaur math adventure titled Math Go. Create a wide 3:2 illustrated island map with no text, no letters, no numbers, no UI, no watermark, no characters. Viewpoint: inviting top-down three-quarter storybook video game map, polished hand-painted gouache with softly shaded dimensional forms and crisp readable silhouettes. An island surrounded by turquoise shallow ocean, sandy rim, lush emerald fern forest lower left, a curving blue river and small waterfall in the center, rose-violet crystal groves lower right, a high warm golden mountain with a glowing ancient sun shrine upper right. Small winding ochre paths connect these four regions; leave open clearings in those regions for our interactive map buttons. Scattered tiny ferns, soft broad-leaf tropical trees, stones, lily pads, a little wooden bridge. Cozy adventurous afternoon lighting, rich greens and teal, honey yellow highlights. Designed for ages 7–10, original art, no resemblance to any commercial game's map, no existing intellectual property.
