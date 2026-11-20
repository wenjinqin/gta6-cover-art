// Neon Coast cover maker: hands the app in for gta6-cover-art-01.
// The app itself is plain static files under app/ (index.html plus its ES modules,
// no build step, no network at runtime). This program copies app/ and screenshots/
// next to it into the output directory and writes dossier.json there with the
// vendored make.fun library, so the scorer and the judge read exactly what ships.
// It runs on Node 22 with the standard library only; outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's own limits (see RULES.txt, "The gate"): at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files and 48 MiB, and the
// dossier text capped at 160 KiB. Refusing here is the same refusal the scorer
// would give, only earlier.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`handed in app/ and screenshots/ to ${out} (${dossier.length} bytes of dossier)`);
