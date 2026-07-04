const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'source.connect(analyser);',
  'const voiceGain = audioCtx.createGain();\n        voiceGain.gain.value = 2.5;\n        source.connect(voiceGain);\n        voiceGain.connect(analyser);'
);
fs.writeFileSync('src/App.tsx', code);
