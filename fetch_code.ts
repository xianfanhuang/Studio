import fs from 'fs';

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/xianfanhuang/sonoria/main/index.html';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    fs.writeFileSync('./source_index.html', text, 'utf8');
    console.log('Success! Downloaded source_index.html, length:', text.length);
  } catch (error) {
    console.error('Failed to download:', error);
  }
}

main();
