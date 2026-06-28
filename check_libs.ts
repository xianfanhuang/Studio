async function check() {
  const urls = [
    'https://raw.githubusercontent.com/xianfanhuang/sonoria/main/hydra-synth.min.js',
    'https://raw.githubusercontent.com/xianfanhuang/sonoria/main/strudel.js'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${url} - Status: ${res.status}`);
    } catch (e) {
      console.error(`Error checking ${url}:`, e);
    }
  }
}
check();
