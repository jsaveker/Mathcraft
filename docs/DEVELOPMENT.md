# Develop and publish Mathcraft

[Back to Mathcraft](../README.md) · [Player and parent guide](PLAYING.md)

This guide covers the source layout, verification and static release workflow. Mathcraft runs entirely in the browser; it does not need a game server or database.

## Run and build

Use Node.js 20.19+ or 22.12+ and a browser with WebGL 2.

```sh
npm ci --include=dev
npm run dev
```

For a production preview:

```sh
npm run build
npm run preview
```

The build writes the static application to `dist/`. Vite prints the development and preview URLs.

## Architecture

[Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) renders the world. Instanced blocks reduce draw calls. Terrain, textures, trees, structures, clouds, animals, portal effects, and audio are generated in code. The UI uses HTML/CSS and native dialogs. Vite builds the application. Fonts are Outfit and DM Sans, distributed through Fontsource under the SIL Open Font License; their licence files are included in the dependencies.

- `src/creative-worlds.js`: destination catalogue, flat travel sites and deterministic terrain heights.
- `src/creative-terrain.js`: exposed-face terrain meshes split into spatial chunks for culling.
- `src/creative-scenery.js`: themed creative hubs, landmarks and distant scenery.
- `src/blocks.js`: stable block palette, saved hotbar validation, brushes and blueprints.
- `src/voxel-build.js`: instanced construction meshes and spatial ray/collision lookup.
- `src/creative-builder.js`: creative tools, previews, transactional undo and TNT chains.
- `src/build-materials.js`: procedural block textures and glass/glowing materials.
- `src/world.js`: scene, terrain, input, movement, collisions, building, particles, and portal.
- `src/maths.js`: world catalogue, rounds, save validation, persistence, and hints.
- `src/learning.js`: bounded skill progression, question bands, and persistent answer evidence.
- `src/adventures.js`: world-specific routes, objectives and question stories.
- `src/adventure-world.js`: twenty animated projects, protected machinery footprints and reveal cameras.
- `src/quests.js`: contextual maths, job phases, and linked bridge quantities.
- `src/quest-world.js`: physical supplies, bridge floor/collision, sheep feeding, planting, and success animations.
- `src/main.js`: profiles, menus, quests, discoveries, progression, accessibility labels, and sound.
- `src/profiles.js`: validated family saves, legacy migration, separate inventories/builds, and revision checks.
- `src/biomes.js`: village, landscape variations, landmark activities, physical surfaces, and aurora.
- `src/explorer-art.js`: code-generated explorer avatars and escaped profile text.
- `src/style.css`: responsive welcome screen, HUD, and dialogs.

## Verify changes

```sh
npm test
npm run format:check
npm run build
```

The Node test suite covers question ranges, carrying and borrowing, adaptive learning, saved questions, quest ordering, rewards, animated projects, movement and collision, profile isolation, migration, stale-tab conflicts, creative tools, TNT chains and undo. Creative-world checks also cover terrain size and shape, exposed mesh faces, travel clearances, independent saves and building beyond the old village boundary.

For changes to rendering or interaction, also check the game in a browser:

1. Exercise the changed controls and world effects at desktop and phone widths.
2. Reload and switch explorers or worlds to check save isolation.
3. Inspect the browser console for errors and warnings.
4. Check mouse capture in a supporting browser and drag-to-look where capture is restricted. Test physical touch controls on a target device when changing touch input.

The five-creative-world release passed 110 automated tests. Browser verification covered all five landscapes, original village restoration, a saved rocket beyond the old boundary, desktop and phone layouts, and the hosted release. This is a release record, not a dynamically updated CI badge; run the commands above for the current checkout.

## Publish to the Saveker website

Mathcraft is maintained in this repository. The website repository hosts a built snapshot under `public/mathcraft/`, alongside its other static experiences. This keeps the game independent of the website's React and Three.js versions.

After testing and committing the Mathcraft source:

```sh
npm run export:website -- /path/to/saveker-website/public/mathcraft
```

The export builds asset URLs for `/mathcraft/`, includes the third-party licence notices, and writes a `release.json` with the source commit and SHA-256 of every release file. It refuses to export uncommitted source or replace an unrelated directory.

Run the website's normal `bun run build`, then commit and push its Mathcraft release files. The website's existing Cloudflare Pages Git integration publishes the update. Pages serves `/mathcraft/` as a static directory; no website SPA route is required. Verify the live release manifest and game after deployment.

## Update the public presentation

The root [README](../README.md) is the public introduction. Keep detailed controls in [PLAYING.md](PLAYING.md) and implementation notes here.

Screenshots and original vector illustrations live in [images/](images/README.md), outside `public/`, so they do not increase the game download. To regenerate the illustrations:

```sh
node scripts/readme-art.mjs
```

When updating images, capture the running game with a disposable demonstration profile. Do not publish children's names or real saved profile data. Check GitHub's rendered README, including full-size image links, after pushing.
