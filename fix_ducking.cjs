const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the initial ducking with a slight dip
code = code.replace(
  'musicGainRef.current.gain.linearRampToValueAtTime(0.02, audioContextRef.current.currentTime + 0.5);',
  'musicGainRef.current.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.5);'
);

// Add the hard ducking right before playing TTS
const hardDucking = `
        if (musicGainRef.current && audioCtx) {
           musicGainRef.current.gain.cancelScheduledValues(audioCtx.currentTime);
           musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, audioCtx.currentTime);
           musicGainRef.current.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.5);
        }
        source.start();
`;

code = code.replace('source.start();', hardDucking);

fs.writeFileSync('src/App.tsx', code);
