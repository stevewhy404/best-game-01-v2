// TIDEBOUND hand-in (best-game-01): gather this repo's game and screenshots
// into the hand-in directory and write the dossier the judge reads.
//
// Run it from the repo root, for example:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader the output directory is /output, unless the
// MAKEFUN_OUTPUT_DIR variable points somewhere else. The dossier is built
// with the kit's vendored library (vendor/makefun-game.ts), unchanged.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// This file's own directory is the repo root; the hand-in directory comes
// from the environment, defaulting to /output.
const repoDir = dirname(fileURLToPath(import.meta.url));
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The bounty's caps for the dossier (kit reference/gate.json): the dossier's
// own text at most 160 KiB; at most 4 screenshots of at most 256 KiB each;
// game/ at most 993 files and directories and 48 MiB altogether; no path
// inside game/ longer than 1000 bytes.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Copy a whole folder, creating the destination first so a second run into
// the same hand-in directory merges instead of failing.
function mirrorFolder(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function handInGame() {
  mkdirSync(handInDir, { recursive: true });

  // The playable game, exactly as it sits under game/.
  mirrorFolder(join(repoDir, 'game'), join(handInDir, 'game'));

  // Screenshots, when the repo has any: the folder is always created, so
  // the dossier builder finds it even for a repo without screenshots.
  const shotDir = join(handInDir, 'screenshots');
  mkdirSync(shotDir, { recursive: true });
  const repoShots = join(repoDir, 'screenshots');
  if (existsSync(repoShots)) cpSync(repoShots, shotDir, { recursive: true });

  // The dossier is a summary of the hand-in directory itself, so it is
  // written only after the copies above are in place.
  const dossier = buildDossier(handInDir, dossierCaps);
  writeFileSync(join(handInDir, 'dossier.json'), dossier);
}

handInGame();
