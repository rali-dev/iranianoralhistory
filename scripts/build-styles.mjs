/**
 * Pre-build step: process styles.css through Tailwind v4 PostCSS plugin.
 *
 * Angular's esbuild resolves @import "tailwindcss" before PostCSS sees it,
 * so Tailwind utility-class generation never fires inside the Angular pipeline.
 * This script runs PostCSS directly on the source file and outputs a plain CSS
 * file that Angular can consume without any PostCSS plugins.
 *
 * Usage:
 *   node scripts/build-styles.mjs          # one-shot build
 *   node scripts/build-styles.mjs --watch  # watch mode (for dev server)
 */

import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT  = path.join(ROOT, 'apps/frontend/src/styles.css');
const OUTPUT = path.join(ROOT, 'apps/frontend/src/styles.generated.css');

async function build() {
  const css = fs.readFileSync(INPUT, 'utf8');
  const result = await postcss([tailwindcss]).process(css, { from: INPUT, to: OUTPUT });
  fs.writeFileSync(OUTPUT, result.css);
  console.log(`[styles] built → ${path.relative(ROOT, OUTPUT)} (${(result.css.length / 1024).toFixed(1)} kB)`);
}

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  await build();
  console.log('[styles] watching for changes…');

  // Watch the input CSS and all template files
  const toWatch = [
    INPUT,
    path.join(ROOT, 'apps/frontend/src/app'),
    path.join(ROOT, 'libs/frontend'),
  ];

  let debounce;
  const onChange = () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      try { await build(); } catch (e) { console.error('[styles] error:', e.message); }
    }, 150);
  };

  for (const target of toWatch) {
    fs.watch(target, { recursive: true }, (_, filename) => {
      if (!filename || /\.(html|ts|css)$/.test(filename)) onChange();
    });
  }
} else {
  await build();
}
