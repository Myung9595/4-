// 단일 HTML 파일로 묶는다: dist/index.html (CSS·JS 인라인)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  legalComments: 'none',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('style.css', 'utf8');
let html = readFileSync('index.html', 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="src/main.js"></script>', () => `<script>\n${js}\n</script>`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);
console.log(`dist/index.html  ${(html.length / 1024).toFixed(1)} KB`);

// 아티팩트용: 문서 껍데기(doctype/html/head/body)는 게시할 때 씌워지므로 뺀다
const art = html
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/?head>\s*/gi, '')
  .replace(/<meta charset="utf-8">\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<\/?body>\s*/gi, '')
  .replace(/<\/html>\s*/i, '');
writeFileSync('dist/artifact.html', art);
console.log(`dist/artifact.html  ${(art.length / 1024).toFixed(1)} KB`);
