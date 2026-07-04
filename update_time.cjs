const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hook = `
  // Synthesized track time tick
  useEffect(() => {
    let interval;
    if (isPlaying && playlist[trackIdx]?.isSynthesized) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 120) return 0;
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, trackIdx, playlist]);
`;

code = code.replace('  // Keyboard Shortcuts Binding', hook + '\n  // Keyboard Shortcuts Binding');
fs.writeFileSync('src/App.tsx', code);
