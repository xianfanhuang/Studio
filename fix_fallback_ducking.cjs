const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const fallbackDuck = `
      if (musicGainRef.current && audioContextRef.current) {
         musicGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
         musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, audioContextRef.current.currentTime);
         musicGainRef.current.gain.linearRampToValueAtTime(0.05, audioContextRef.current.currentTime + 0.5);
      }
      if ('speechSynthesis' in window) {
`;

code = code.replace("if ('speechSynthesis' in window) {", fallbackDuck);
fs.writeFileSync('src/App.tsx', code);
