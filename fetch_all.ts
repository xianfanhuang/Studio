import fs from 'fs';
import path from 'path';

async function main() {
  const files = [
    'js/webgl-detect.js',
    'js/styles-config.js',
    'js/utils.js',
    'js/state.js',
    'js/visualizer.js',
    'js/strudel-engine.js',
    'js/audio-engine.js',
    'js/ui-controller.js',
    'js/main.js'
  ];

  if (!fs.existsSync('./downloaded_js')) {
    fs.mkdirSync('./downloaded_js');
  }

  for (const file of files) {
    try {
      const url = `https://raw.githubusercontent.com/xianfanhuang/sonoria/main/${file}`;
      console.log(`Fetching ${url}...`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch ${file}: HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      const destPath = path.join('./downloaded_js', path.basename(file));
      fs.writeFileSync(destPath, text, 'utf8');
      console.log(`Saved ${destPath}, length: ${text.length}`);
    } catch (e) {
      console.error(`Error fetching ${file}:`, e);
    }
  }
}

main();
