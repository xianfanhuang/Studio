// Procedural ambient synthesizer using Web Audio API

class AmbientSynth {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isRunning: boolean = false;
  private nodes: AudioNode[] = [];
  private timers: any[] = [];
  
  // Oscillators and gains for nodes
  private padOscs: OscillatorNode[] = [];
  private padGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  constructor() {}

  start(ctx: AudioContext, analyser: AnalyserNode, emotion: 'serene' | 'energized' | 'tender' | 'focused' = 'serene') {
    this.stop();
    this.ctx = ctx;
    this.analyser = analyser;
    this.isRunning = true;

    try {
      this.setupSynth(emotion);
    } catch (e) {
      console.error('Failed to setup synthesizer:', e);
    }
  }

  stop() {
    this.isRunning = false;
    
    // Cancel all timers
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    // Stop and disconnect pad oscillators
    this.padOscs.forEach(o => {
      try { o.stop(); } catch(e) {}
      try { o.disconnect(); } catch(e) {}
    });
    this.padOscs = [];

    // Stop and disconnect all active audio nodes
    this.nodes.forEach(node => {
      try {
        (node as any).stop?.();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.nodes = [];

    if (this.padGain) {
      this.padGain.disconnect();
      this.padGain = null;
    }
    if (this.delayNode) {
      this.delayNode.disconnect();
      this.delayNode = null;
    }
    if (this.delayFeedback) {
      this.delayFeedback.disconnect();
      this.delayFeedback = null;
    }
  }

  private setupSynth(emotion: 'serene' | 'energized' | 'tender' | 'focused') {
    if (!this.ctx || !this.analyser) return;

    const ctx = this.ctx;
    const dest = this.analyser; // route everything via analyser for live visuals!

    // Create a beautiful stereo delay node
    const delay = ctx.createDelay(2.0);
    const delayFeedback = ctx.createGain();
    const delayFilter = ctx.createBiquadFilter();

    delay.delayTime.setValueAtTime(0.7, ctx.currentTime);
    delayFeedback.gain.setValueAtTime(0.55, ctx.currentTime);
    delayFilter.type = 'lowpass';
    delayFilter.frequency.setValueAtTime(1000, ctx.currentTime);

    // Feedback loop: delay -> filter -> feedbackGain -> delay
    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    
    // Connect delay output to analyser
    delayFilter.connect(dest);
    this.delayNode = delay;
    this.delayFeedback = delayFeedback;

    // Base Pad Drone (Deep calm)
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.18, ctx.currentTime);
    padGain.connect(dest);
    this.padGain = padGain;

    const baseFreq = emotion === 'focused' ? 110 : emotion === 'tender' ? 87.31 : 73.42; // A2, F2, D2
    const waves: OscillatorType[] = ['triangle', 'sine', 'sawtooth'];

    // Create 3 detuned oscillators for backing drone
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const detune = (i - 1) * 8; // -8, 0, 8 cents detune
      osc.type = waves[i % waves.length];
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.detune.setValueAtTime(detune, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime); // very warm cutoff

      osc.connect(filter);
      filter.connect(padGain);
      osc.start();
      this.padOscs.push(osc);
    }

    // Begin generative pattern loop
    if (emotion === 'energized') {
      this.playRhythmicArpeggio(baseFreq, dest, delay);
    } else {
      this.playMellowChordSwells(baseFreq, dest, delay);
    }

    this.playAmbientWindBells(baseFreq, delay);
  }

  // Generates warm organic chord pad swells
  private playMellowChordSwells(baseFreq: number, dest: AudioNode, delay: AudioNode) {
    if (!this.isRunning || !this.ctx) return;
    const ctx = this.ctx;

    // Chords intervals relative to base freq
    const major7th = [1, 1.25, 1.5, 1.875]; // Root, M3, P5, M7
    const minor7th = [1, 1.1892, 1.5, 1.7818]; // Root, m3, P5, m7
    const sus2 = [1, 1.122, 1.5, 2.0]; // Root, M2, P5, Octave

    const progressions = {
      serene: [minor7th, sus2, minor7th, sus2],
      tender: [major7th, minor7th, major7th, minor7th],
      focused: [minor7th, minor7th, minor7th, minor7th]
    } as any;

    const progression = progressions[(this.ctx as any).emotion || 'serene'] || major7th;
    let chordIdx = 0;

    const swellLoop = () => {
      if (!this.isRunning || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentChord = progression[chordIdx % progression.length];
      chordIdx++;

      // Swell speed
      const attack = 4.0;
      const sustain = 3.0;
      const release = 4.0;
      const totalDuration = (attack + sustain + release) * 1000;

      // Polyphonic trigger
      currentChord.forEach((mult: number) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();

        o.type = 'sine';
        o.frequency.setValueAtTime(baseFreq * mult * 2, now); // up an octave
        
        f.type = 'lowpass';
        f.frequency.setValueAtTime(400, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.04, now + attack);
        g.gain.setValueAtTime(0.04, now + attack + sustain);
        g.gain.linearRampToValueAtTime(0, now + attack + sustain + release);

        o.connect(f);
        f.connect(g);
        g.connect(dest);
        g.connect(delay); // also feed to delay!

        o.start(now);
        o.stop(now + attack + sustain + release + 0.1);

        this.nodes.push(o as any);
        this.nodes.push(g as any);
      });

      this.timers.push(setTimeout(swellLoop, totalDuration - 2000));
    };

    swellLoop();
  }

  // Energized patterns - arpeggiations, pulsing beats
  private playRhythmicArpeggio(baseFreq: number, dest: AudioNode, delay: AudioNode) {
    if (!this.isRunning || !this.ctx) return;
    const ctx = this.ctx;

    // Pentatonic scale multipliers
    const pentatonic = [1, 1.122, 1.25, 1.5, 1.682, 2.0];
    let noteCount = 0;

    const arpLoop = () => {
      if (!this.isRunning || !this.ctx) return;
      const now = this.ctx.currentTime;
      
      const mult = pentatonic[noteCount % pentatonic.length];
      noteCount++;

      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();

      // Plucky sound envelope
      o.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(baseFreq * mult * 3, now); // Higher pitched arps
      
      f.type = 'bandpass';
      f.frequency.setValueAtTime(800 + Math.sin(now) * 400, now);
      f.Q.setValueAtTime(2.0, now);

      g.gain.setValueAtTime(0.0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      o.connect(f);
      f.connect(g);
      g.connect(dest);
      g.connect(delay);

      o.start(now);
      o.stop(now + 0.5);

      this.nodes.push(o as any);
      this.nodes.push(g as any);

      // Metronome kick pulse
      if (noteCount % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(100, now);
        kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        kickGain.gain.setValueAtTime(0.7, now);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        kickOsc.connect(kickGain);
        kickGain.connect(dest);

        kickOsc.start(now);
        kickOsc.stop(now + 0.25);

        this.nodes.push(kickOsc as any);
        this.nodes.push(kickGain as any);
      }

      this.timers.push(setTimeout(arpLoop, 220)); // ~136 BPM
    };

    arpLoop();
  }

  // Soft random delicate bells (wind chimes)
  private playAmbientWindBells(baseFreq: number, delayInput: AudioNode) {
    if (!this.isRunning || !this.ctx) return;

    const bellLoop = () => {
      if (!this.isRunning || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Random intervals
      const nextTime = 2000 + Math.random() * 4500;

      // Pick a random frequency from chime harmonic series
      const harmonics = [4, 5, 6, 7, 8, 9, 10, 12];
      const m = harmonics[Math.floor(Math.random() * harmonics.length)];
      const freq = baseFreq * m;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(delayInput); // bells go main into delay!

      osc.start(now);
      osc.stop(now + 2.6);

      this.nodes.push(osc as any);
      this.nodes.push(gain as any);

      this.timers.push(setTimeout(bellLoop, nextTime));
    };

    bellLoop();
  }
}

export const ambientSynth = new AmbientSynth();
