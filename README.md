# Mathcraft — Number Islands

A playable, original voxel adventure for practising addition and subtraction. Explore a floating island and help with five physical jobs: gather timber, repair the river bridge, feed the sheep, plant a flower garden, and power the ancient portal. Correct answers visibly change the world and earn materials for a permanent home village. Each explorer has separate progress, builds, settings, and a blocky avatar.

## Run locally

Requires Node.js 20.19+ or 22.12+ and a browser with WebGL 2.

```sh
npm install --include=dev
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. For a production build:

```sh
npm run build
npm run preview
```

`dist/` contains a static application that can be hosted without a backend. The Saveker website serves a versioned static release at `https://saveker.org/mathcraft/`.

## Play

| Control     | Action                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| WASD        | Move                                                                              |
| Mouse       | Look around; drag if mouse capture is unavailable                                 |
| Arrow keys  | Move forward/backward and turn                                                    |
| Space       | Jump                                                                              |
| E           | Gather or inspect supplies, then solve the current job; enter the restored portal |
| G           | Go to the current island job or the portal                                        |
| V           | Visit your village, or return to adventures from the village                      |
| L           | Go to the island’s special landmark                                               |
| B           | Toggle building                                                                   |
| 1, 2, 3     | Select grass, wood, or crystal blocks                                             |
| Right click | Place a block                                                                     |
| Left click  | Mine a block you placed                                                           |
| Escape      | Pause and release the mouse                                                       |

On touchscreens, use the direction pad, drag the world to look, and use the on-screen jump, interaction, and building buttons. Desktop is the primary play experience. In-app browsers that restrict pointer lock use drag-to-look automatically.

The island edge prevents falling. Scenery is preserved; players can mine their own placed blocks. Each new explorer starts with 36 blocks. Every correct answer earns 3 more, and each island landmark awards 12 blocks once per explorer. Up to 600 placed blocks can be saved on each island or in the home village.

## Maths and progress

- Starts with mixed addition and subtraction up to **100**, as requested.
- Parent settings offer ranges of 10, 20, or 100 and addition, subtraction, or a mixture.
- Both operands and results stay within the selected range. Subtraction never produces negative answers.
- Hints explain counting on/back and splitting tens and ones, with dots grouped into rows of ten.
- Mistakes invite another try; two missed answers reveal the hint automatically. There are no timers or lost lives.
- Five jobs per adventure, with fresh puzzles for replay. Press E once to gather or inspect supplies, then E again to solve the contextual question. Each success includes a close-up of what changed. The bridge gains a solid walkable deck, the sheep receive apples, flowers grow from the counted seeds, and the portal powers up.
- The planks counted in the timber job are exactly the planks already laid in the bridge job. Supplies stay positive where physical items are required; a fully charged portal can still have a zero-answer question.
- Jobs unlock in order. Gathered supplies and completed world changes survive reloads. Existing saved crystals and unlocked worlds are preserved and mapped to completed jobs.
- Three unlockable island themes: Meadow Isles, Crystal Peaks, and Sunset Sands.
- Up to six named explorers can choose a fox, astronaut, dragon, or panda avatar. Each has separate settings, puzzles, world unlocks, discoveries, inventory, and building layouts. Everything is saved in this browser’s local storage after each change; it does not sync between devices.
- Changing number settings takes effect on the next adventure, preserving an in-progress session until it ends or is restarted.
- No accounts or remote game services are needed. Fonts and graphics are bundled or generated locally. Clearing browser site data removes profiles and progress.

## Your village and discoveries

Use **My village** on the welcome screen or **V** during an adventure. Each explorer owns a green island with open building plots, an entrance arch, and a fountain. Place blocks freely, stack them into structures, and mine your own blocks to recover materials. Builds on the adventure islands also stay saved when travelling or starting another puzzle round.

Use **Discover / L**, then **E**, to visit each island’s landmark:

- **Meadow Isles:** a waterwheel and walkable lookout with an aqueduct spilling a waterfall over the island edge. Open the sluice to set the wheel turning.
- **Crystal Peaks:** a glowing cavern, stepped mountain ridge, snow-capped peaks, stars, and animated northern lights. Play the mint–violet–gold crystal sequence to awaken the aurora.
- **Sunset Sands:** dunes, palms, distant pyramids, and a temple with walkable terraces. Align three sun rings to open the rotating gate.

Discoveries are optional additions to the five maths quests. Their rewards are awarded only once per explorer. Completed discoveries are restored when returning to an island.

The first explorer inherits the original game’s maths progress and unlocks. The old `mathcraft-save` record is retained, and the new `mathcraft-family-v2` record becomes authoritative. Old builds were temporary and cannot be recovered, so migrated explorers receive the starter stock plus materials for their previously earned crystals. A revision check prevents an older open tab from overwriting a newer family save.

## Implementation

[Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) renders the world. Instanced blocks reduce draw calls. Terrain, textures, trees, structures, clouds, animals, portal effects, and audio are generated in code. The UI uses HTML/CSS and native dialogs. Vite builds the application. Fonts are Outfit and DM Sans, distributed through Fontsource under the SIL Open Font License; their licence files are included in the dependencies.

- `src/world.js`: scene, terrain, input, movement, collisions, building, particles, and portal.
- `src/maths.js`: puzzle generation, save validation, persistence, and hints.
- `src/quests.js`: contextual maths, job phases, and linked bridge quantities.
- `src/quest-world.js`: physical supplies, bridge floor/collision, sheep feeding, planting, and success animations.
- `src/main.js`: profiles, menus, quests, discoveries, progression, accessibility labels, and sound.
- `src/profiles.js`: validated family saves, legacy migration, separate inventories/builds, and revision checks.
- `src/biomes.js`: village, landscape variations, landmark activities, physical surfaces, and aurora.
- `src/explorer-art.js`: code-generated explorer avatars and escaped profile text.
- `src/style.css`: responsive welcome screen, HUD, and dialogs.

## Verification

```sh
npm test
npm run build
npm run format:check
```

The 56 automated tests cover profile isolation, inventory conservation, saved build placement/restoration/mining, legacy migration, stale-tab conflicts, one-time discovery rewards, landmark surfaces, and 9,000 generated questions, linked quest quantities across every range and operation, job ordering, duplicate reward prevention, legacy saves, saved supplies, bridge floor/collision, boundary answers, settings, replay, walking, turning, diagonal speed, gravity, jumping, island boundaries, pausing, and touch movement inputs.

Browser checks are performed in the Codex embedded browser at desktop and phone-size viewports. The current update was checked through all three islands, all three landmarks, two separate explorer profiles, and saved village building:

- Completed all 15 puzzles across the three worlds and entered every portal.
- Confirmed incorrect-answer feedback and visual hints.
- Reloaded during a partial round and resumed with the saved crystals.
- Verified saved parent settings apply to the next round.
- Placed and mined a block; inventory changed from 12 to 11 and back to 12.
- Checked the home screen, game HUD, and puzzle dialog for responsive overflow.
- Checked shader compilation and browser warnings after the portal fix.
- Completed the five new island jobs, checked their world changes and reward views, and restored a partly repaired bridge and a ready portal after reload.
- Checked the quest HUD, question, hint, reward, profile picker, and sun-ring activity at a 390 × 844 viewport.
- Placed a village block, reloaded, restored it with the same material/inventory, and mined it back into inventory.
- Switched between two explorers with separate builds and number ranges.
- Completed the crystal melody (including a wrong note) and aligned the sun rings.
- Revisited a landmark without receiving duplicate materials, then reloaded and verified its reward in the village.

Physical touchscreen use and native browser pointer lock still need testing on the children's target devices. Browser automation here exercised the drag-to-look fallback; automated movement tests cover held keyboard and touch inputs.

## Publish to the Saveker website

Mathcraft is maintained in this repository. The website repository hosts a built snapshot under `public/mathcraft/`, alongside its other static experiences. This keeps the game independent of the website's React and Three.js versions.

After testing and committing the Mathcraft source:

```sh
npm run export:website -- /path/to/saveker-website/public/mathcraft
```

The export builds asset URLs for `/mathcraft/`, includes the third-party licence notices, and writes a `release.json` with the source commit and SHA-256 of every release file. It refuses to export uncommitted source or replace an unrelated directory.

Run the website's normal `bun run build`, then commit and push its Mathcraft release files. The website's existing Cloudflare Pages Git integration publishes the update. Pages serves `/mathcraft/` as a static directory; no website SPA route is required. Verify the live release manifest and game after deployment.
