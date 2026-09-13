# README images

[Back to Mathcraft](../../README.md)

The public README uses local repository assets so image links are versioned with the documentation. These files are outside the game's `public/` directory and are not included in its production bundle.

## Gameplay screenshots

The JPEG files are unretouched 1280 × 720 browser screenshots of Mathcraft, captured on 13 September 2026 from game revision `ea2fc1006e54ec4c073b8e2b29186ed0649d24f6`. They use an isolated local demonstration save with fictional explorers, not a child's live game.

- `welcome.jpg`: welcome screen and five adventure destinations.
- `maths-hints.jpg`: contextual addition and the visual counting hint.
- `block-library.jpg`: the Building category of the creative library.
- `moon-frontier.jpg`: lunar plain, craters and Earth overhead.
- `crystal-highlands.jpg`: snowy ridges, crystals and the animated aurora.

To refresh a screenshot, use the normal game controls to reach the scene, allow transition messages to disappear, and capture the browser viewport. Keep the UI visible and check that captions describe the actual image. Do not edit screenshots to suggest features or graphics that are absent from the game.

## Vector illustrations

`banner.svg` and `worlds.svg` are original, code-generated illustrations, not gameplay captures. They use the project's voxel visual style and contain no third-party artwork, scripts, external fonts or remote image dependencies.

Regenerate both from the repository root:

```sh
node scripts/readme-art.mjs
```

The generator is [scripts/readme-art.mjs](../../scripts/readme-art.mjs). SVGs include accessible titles and descriptions; the README also includes text equivalents.
