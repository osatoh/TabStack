import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';

const isWatch = process.argv.includes('--watch');

// エントリーポイント
const entryPoints = [
  'src/background.ts',
  'src/popup.ts',
  'src/offscreen.ts',
];

// 静的ファイルをdist/にコピー
function copyStaticFiles() {
  mkdirSync('dist', { recursive: true });
  cpSync('manifest.json', 'dist/manifest.json');
  cpSync('popup.html', 'dist/popup.html');
  cpSync('offscreen.html', 'dist/offscreen.html');
  cpSync('icons', 'dist/icons', { recursive: true });
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'chrome120',
  minify: false,
  sourcemap: false,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  copyStaticFiles();
  await ctx.watch();
  // eslint-disable-next-line no-console
  process.stdout.write('ウォッチモード起動中...\n');
} else {
  await esbuild.build(buildOptions);
  copyStaticFiles();
  // eslint-disable-next-line no-console
  process.stdout.write('ビルド完了！ dist/ に出力したぜ\n');
}
