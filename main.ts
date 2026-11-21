// Vice Panels — hand-in program for the gta6-cover-art-01 bounty.
//
// The entry itself is the static web app under app/ (open app/index.html in a
// browser; it runs fully offline). This program is the courier: it copies
// app/ and screenshots/ into the output directory and writes dossier.json
// there with make.fun's vendored library, exactly as the bounty requires.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output. Node 22+,
// standard library only; the run is deterministic, so two runs write the
// same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, mirrored so a bad hand-in fails here first with a
// readable word instead of a silent zero at the gate.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

function deliver(folderName: string): void {
  const from = join(repoDir, folderName);
  const to = join(outputDir, folderName);
  if (!existsSync(from)) {
    throw new Error(`cannot hand in: ${folderName}/ is missing from the repository`);
  }
  cpSync(from, to, { recursive: true });
  console.log(`delivered ${folderName}/ -> ${to}`);
}

mkdirSync(outputDir, { recursive: true });
deliver('app');
deliver('screenshots');

const dossier = buildDossier(outputDir, CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`wrote dossier.json (${dossier.byteLength} bytes)`);
