const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add masterCompressorRef
if (!code.includes('masterCompressorRef =')) {
  code = code.replace(
    'const musicGainRef = useRef<GainNode | null>(null);',
    'const musicGainRef = useRef<GainNode | null>(null);\n  const masterCompressorRef = useRef<DynamicsCompressorNode | null>(null);'
  );
}

// 2. Setup compressor in initAudio
const compressorSetup = `
      const masterCompressor = ctx.createDynamicsCompressor();
      masterCompressor.threshold.value = -28;
      masterCompressor.knee.value = 15;
      masterCompressor.ratio.value = 12;
      masterCompressor.attack.value = 0.01;
      masterCompressor.release.value = 0.25;
      masterCompressorRef.current = masterCompressor;
      
      const musicGain = ctx.createGain();
      musicGain.gain.value = 1.0;
      musicGainRef.current = musicGain;
`;

code = code.replace(
  /const musicGain = ctx\.createGain\(\);\s*musicGain\.gain\.value = 1\.0;\s*musicGainRef\.current = musicGain;/g,
  compressorSetup
);

// 3. Connect musicGain to compressor, compressor to analyser
code = code.replace(
  'source.connect(musicGain);\n        musicGain.connect(analyser);',
  'source.connect(musicGain);\n        musicGain.connect(masterCompressor);\n        masterCompressor.connect(analyser);'
);

// 4. Update the hard ducking values in handleAIHost from 0.05 to 0.35
code = code.replace(/linearRampToValueAtTime\(0\.05/g, 'linearRampToValueAtTime(0.35');
// And the initial ducking to 0.4
code = code.replace(/linearRampToValueAtTime\(0\.4/g, 'linearRampToValueAtTime(0.4');

// 5. Connect voiceGain to masterCompressor
code = code.replace(
  'voiceGain.connect(analyser);',
  `if (masterCompressorRef.current) {
            voiceGain.connect(masterCompressorRef.current);
        } else {
            voiceGain.connect(analyser);
        }`
);

fs.writeFileSync('src/App.tsx', code);
