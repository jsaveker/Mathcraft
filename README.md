# Mathcraft — Number Islands

A playable, original voxel adventure for practising addition and subtraction. Explore a floating island and help with five physical jobs: gather timber, repair the river bridge, feed the sheep, plant a flower garden, and power the ancient portal. Correct answers visibly change the world and also earn blocks for building.

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
| B           | Toggle building                                                                   |
| 1, 2, 3     | Select grass, wood, or crystal blocks                                             |
| Right click | Place a block                                                                     |
| Left click  | Mine a block you placed                                                           |
| Escape      | Pause and release the mouse                                                       |

On touchscreens, use the direction pad, drag the world to look, and use the on-screen jump, interaction, and building buttons. Desktop is the primary play experience. In-app browsers that restrict pointer lock use drag-to-look automatically.

The island edge prevents falling. Scenery is preserved; players can mine their own placed blocks. The first 12 blocks are free, and every correct answer earns 3 more. Up to 150 placed blocks can be on the island at once.

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
- Settings, puzzle progress, and world unlocks are saved in this browser's local storage. Each browser/device has its own progress. Building layouts and inventory are temporary.
- Changing number settings takes effect on the next adventure, preserving an in-progress session until it ends or is restarted.
- No accounts, analytics, or remote game services. Fonts and graphics are bundled or generated locally. Clearing browser site data removes progress.

## Implementation

[Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) renders the world. Instanced blocks reduce draw calls. Terrain, textures, trees, structures, clouds, animals, portal effects, and audio are generated in code. The UI uses HTML/CSS and native dialogs. Vite builds the application. Fonts are Outfit and DM Sans, distributed through Fontsource under the SIL Open Font License; their licence files are included in the dependencies.

- `src/world.js`: scene, terrain, input, movement, collisions, building, particles, and portal.
- `src/maths.js`: puzzle generation, save validation, persistence, and hints.
- `src/quests.js`: contextual maths, job phases, and linked bridge quantities.
- `src/quest-world.js`: physical supplies, bridge floor/collision, sheep feeding, planting, and success animations.
- `src/main.js`: menus, quests, progression, accessibility labels, and sound.
- `src/style.css`: responsive welcome screen, HUD, and dialogs.

## Verification

```sh
npm test
npm run build
npm run format:check
```

The 42 automated tests cover 9,000 generated questions, linked quest quantities across every range and operation, job ordering, duplicate reward prevention, legacy saves, saved supplies, bridge floor/collision, boundary answers, settings, replay, walking, turning, diagonal speed, gravity, jumping, island boundaries, pausing, and touch movement inputs.

Browser checks are performed in the Codex embedded browser at desktop and phone-size viewports. The original crystal adventure was verified through all three islands; the island-jobs update adds checks for gathering, sequential jobs, visible repairs, and restoration after reload:

- Completed all 15 puzzles across the three worlds and entered every portal.
- Confirmed incorrect-answer feedback and visual hints.
- Reloaded during a partial round and resumed with the saved crystals.
- Verified saved parent settings apply to the next round.
- Placed and mined a block; inventory changed from 12 to 11 and back to 12.
- Checked the home screen, game HUD, and puzzle dialog for responsive overflow.
- Checked shader compilation and browser warnings after the portal fix.
- Completed the five new island jobs, checked their world changes and reward views, and restored a partly repaired bridge and a ready portal after reload.
- Checked the new quest HUD, question, hint, and reward panels at a 390 × 844 viewport.

Physical touchscreen use and native browser pointer lock still need testing on the children's target devices. Browser automation here exercised the drag-to-look fallback; automated movement tests cover held keyboard and touch inputs.

## Publish to the Saveker website

Mathcraft is maintained in this repository. The website repository hosts a built snapshot under `public/mathcraft/`, alongside its other static experiences. This keeps the game independent of the website's React and Three.js versions.

After testing and committing the Mathcraft source:

```sh
npm run export:website -- /path/to/saveker-website/public/mathcraft
```

The export builds asset URLs for `/mathcraft/`, includes the third-party licence notices, and writes a `release.json` with the source commit and SHA-256 of every release file. It refuses to export uncommitted source or replace an unrelated directory.

Run the website's normal `bun run build`, then commit and push its Mathcraft release files. The website's existing Cloudflare Pages Git integration publishes the update. Pages serves `/mathcraft/` as a static directory; no website SPA route is required. Verify the live release manifest and game after deployment.
