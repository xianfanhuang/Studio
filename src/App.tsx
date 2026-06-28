import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Mic,
  Sliders,
  Palette,
  Terminal,
  ZoomIn,
  Music,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Track, EmotionType } from './types';
import { VISUAL_STYLES } from './visualStylesData';
import { ambientSynth } from './ambientSynth';
import { VisualizerCanvas, VisualizerHandle } from './components/VisualizerCanvas';
import { StylesDrawer } from './components/StylesDrawer';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { AddMusicDrawer } from './components/AddMusicDrawer';
import { CodeDrawer, DEFAULT_SAMPLE_CODE } from './components/CodeDrawer';
import { ZenCapsule } from './components/ZenCapsule';

const INITIAL_PLAYLIST: Track[] = [
  {
    id: 'ocean-dream',
    name: '空灵海湾 (Ocean Dream)',
    artist: 'Procedural Luminous Pad',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'ambient',
  },
  {
    id: 'binaural-flow',
    name: '静心冥想 (Binaural Flow)',
    artist: 'Alpha Brainwave Solfeggio',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'binaural',
  },
  {
    id: 'forest-fire',
    name: '林间篝火 (Forest Campfire)',
    artist: 'Procedural Organic Chill',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'chill',
  },
  {
    id: 'space-bell',
    name: '太空白音 (Space Bell)',
    artist: 'Delicate Harmonic Resonance',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'sine',
  },
];

export default function App() {
  // Playlist & Active Track
  const [playlist, setPlaylist] = useState<Track[]>(INITIAL_PLAYLIST);
  const [trackIdx, setTrackIdx] = useState<number>(0);
  const activeTrack = playlist[trackIdx] || null;

  // Active styles and emotions
  const [activeStyleId, setActiveStyleId] = useState<string>('aurora');
  const [activeEmotion, setActiveEmotion] = useState<EmotionType>('serene');

  // Interface state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isZen, setIsZen] = useState<boolean>(false);
  const [activeDrawer, setActiveDrawer] = useState<'style' | 'playlist' | 'add' | 'code' | null>(null);

  // Time & progress tracker
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Live Canvas Custom pipeline
  const [customJsCode, setCustomJsCode] = useState<string>(DEFAULT_SAMPLE_CODE);
  const [isCustomCodeActive, setIsCustomCodeActive] = useState<boolean>(false);

  // Toast notification
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  // Idle timer to enter Zen mode automatically
  const idleTimerRef = useRef<any>(null);
  const progressScrubRef = useRef<HTMLDivElement | null>(null);

  // Audio References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<VisualizerHandle | null>(null);
  const albumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniEngineFrameRef = useRef<number | null>(null);

  // Trigger floating text toasts
  const triggerToast = (text: string) => {
    setToastText(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastText(null);
    }, 2400);
  };

  // Autoplay / lazy initialization context
  const initAudio = (): Promise<{ ctx: AudioContext; analyser: AnalyserNode }> => {
    return new Promise((resolve) => {
      if (audioContextRef.current && analyserRef.current) {
        resolve({ ctx: audioContextRef.current, analyser: analyserRef.current });
        return;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; // Smaller fftSize for snappy UI graphs
      analyser.smoothingTimeConstant = 0.75;

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      // Link static AudioElement straight away
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      audioElementRef.current = el;

      // Bind audio element listeners
      el.ontimeupdate = () => {
        if (!el.duration) return;
        setCurrentTime(el.currentTime);
      };

      el.onloadedmetadata = () => {
        setDuration(el.duration);
        setCurrentTime(el.currentTime);
      };

      el.onended = () => {
        handleSkip(1);
      };

      el.onerror = () => {
        triggerToast('Failed to load online streaming file.');
        setIsPlaying(false);
      };

      // Connect MediaElementSource once
      try {
        const source = ctx.createMediaElementSource(el);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        mediaSourceRef.current = source;
      } catch (e) {
        console.warn('Media element proxy connection:', e);
      }

      // Check suspended states (Chrome autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          resolve({ ctx, analyser });
        });
      } else {
        resolve({ ctx, analyser });
      }
    });
  };

  // Sync Album wave indicators on active play
  useEffect(() => {
    const canvas = albumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 110;
    canvas.height = 110;

    const renderMiniWaves = () => {
      if (!analyserRef.current || !isPlaying) {
        // Flat line default state
        ctx.clearRect(0, 0, 110, 110);
        ctx.beginPath();
        ctx.moveTo(0, 55);
        ctx.lineTo(110, 55);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
        miniEngineFrameRef.current = requestAnimationFrame(renderMiniWaves);
        return;
      }

      const arr = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(arr);

      ctx.clearRect(0, 0, 110, 110);
      
      // Draw a highly stylized circular sound fractal
      const cx = 55;
      const cy = 55;
      const baseRadius = 18;

      ctx.beginPath();
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const val = arr[i] / 255;
        const radius = baseRadius + val * 26;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'var(--emotion-color)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      miniEngineFrameRef.current = requestAnimationFrame(renderMiniWaves);
    };

    miniEngineFrameRef.current = requestAnimationFrame(renderMiniWaves);

    return () => {
      if (miniEngineFrameRef.current) cancelAnimationFrame(miniEngineFrameRef.current);
    };
  }, [isPlaying]);

  // General Play / Pause control triggers
  const handleTogglePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Shut down mic if active first
    if (isMicActive) {
      handleToggleMic();
    }

    const { ctx, analyser } = await initAudio();

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      ambientSynth.stop();
      audioElementRef.current?.pause();
    } else {
      // Play
      setIsPlaying(true);
      if (activeTrack?.isSynthesized) {
        // Procedural synthetics routing
        (ctx as any).emotion = activeEmotion;
        ambientSynth.start(ctx, analyser, activeEmotion);
        setCurrentTime(0);
        setDuration(120); // Infinite placeholder duration
        triggerToast('Running procedural environmental synthesizer...');
      } else if (audioElementRef.current) {
        // Traditional files
        audioElementRef.current.src = activeTrack.src;
        audioElementRef.current.play().catch((err) => {
          console.error(err);
          triggerToast('Playback blocked. Tap play again.');
          setIsPlaying(false);
        });
      }
    }
  };

  // Engage ambient physical microphone mode (Air Resonance)
  const handleToggleMic = async () => {
    const { ctx, analyser } = await initAudio();

    if (isMicActive) {
      setIsMicActive(false);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (micSourceRef.current) {
        micSourceRef.current.disconnect();
        micSourceRef.current = null;
      }
      triggerToast('Resonance node disabled.');
    } else {
      // Shut down music player first
      setIsPlaying(false);
      ambientSynth.stop();
      audioElementRef.current?.pause();

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          micStreamRef.current = stream;
          const source = ctx.createMediaStreamSource(stream);
          // Connect purely to visualizer, disconnected from speaker output to avoid echo loops
          source.connect(analyser); 
          micSourceRef.current = source;
          setIsMicActive(true);
          triggerToast('Air Resonance: Listening to mic frequencies...');
        })
        .catch((err) => {
          console.error(err);
          triggerToast('Microphone authorization needed.');
        });
    }
  };

  // Dynamic Styles elect selection
  const handleSelectStyle = (styleId: string) => {
    const selected = VISUAL_STYLES.find((s) => s.id === styleId);
    if (selected) {
      setActiveStyleId(selected.id);
      setActiveEmotion(selected.emotion);
      triggerToast(`${selected.name} — Mood: ${selected.emotion}`);
    }
  };

  // Cycle song indices
  const handleSkip = (direction: number) => {
    let nextIdx = trackIdx + direction;
    if (nextIdx < 0) nextIdx = playlist.length - 1;
    if (nextIdx >= playlist.length) nextIdx = 0;

    ambientSynth.stop();
    setIsPlaying(false);
    setTrackIdx(nextIdx);

    // Auto-resume onto next track
    setTimeout(async () => {
      const { ctx, analyser } = await initAudio();
      setIsPlaying(true);
      const nextTrack = playlist[nextIdx];

      if (nextTrack.isSynthesized) {
        (ctx as any).emotion = activeEmotion;
        ambientSynth.start(ctx, analyser, activeEmotion);
        setCurrentTime(0);
        setDuration(120);
      } else if (audioElementRef.current) {
        audioElementRef.current.src = nextTrack.src;
        audioElementRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }, 150);
  };

  // Add individual tracks to our active track listing
  const handleAddTrack = (track: Track) => {
    setPlaylist((prev) => [...prev, track]);
    setTrackIdx(playlist.length); // Play newly loaded song right away!
    setIsPlaying(false);
    ambientSynth.stop();

    setTimeout(() => {
      handleTogglePlay();
    }, 100);
  };

  // Interactive timeline scrubbing
  const handleScrub = (clientX: number) => {
    if (!audioElementRef.current || activeTrack.isSynthesized || !duration) return;
    const bar = progressScrubRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audioElementRef.current.currentTime = duration * pct;
    setCurrentTime(duration * pct);
  };

  // Keyboard Shortcuts Binding
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowRight':
          handleSkip(1);
          break;
        case 'ArrowLeft':
          handleSkip(-1);
          break;
        case 'KeyM':
          handleToggleMic();
          break;
        case 'KeyZ':
          setIsZen((prev) => !prev);
          break;
        case 'Escape':
          setIsZen(false);
          setActiveDrawer(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [trackIdx, isPlaying, activeEmotion, playlist, isMicActive]);

  // Idleness Timer to trigger Zen state
  const resetIdleTimer = () => {
    if (isZen) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isPlaying) {
      idleTimerRef.current = setTimeout(() => {
        setIsZen(true);
      }, 7000); // Trigger auto-zen if silent for 7 seconds
    }
  };

  useEffect(() => {
    resetIdleTimer();
    const cleanIdles = () => {
      resetIdleTimer();
    };

    window.addEventListener('mousemove', cleanIdles);
    window.addEventListener('mousedown', cleanIdles);
    window.addEventListener('touchstart', cleanIdles);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', cleanIdles);
      window.removeEventListener('mousedown', cleanIdles);
      window.removeEventListener('touchstart', cleanIdles);
    };
  }, [isPlaying, isZen]);

  // Format second parameters into 00:00 notation
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div
      onClick={() => isZen && setIsZen(false)} /* Click background anywhere to exit Zen mode */
      className="relative w-screen h-screen bg-[#050508] text-zinc-100 flex items-center justify-center font-sans select-none overflow-hidden"
    >
      {/* 1. Main Visualizer Stage */}
      <VisualizerCanvas
        ref={visualizerRef}
        analyser={analyserRef.current}
        mode={activeStyleId}
        emotion={activeEmotion}
        customJsCode={customJsCode}
        isCustomCodeActive={isCustomCodeActive}
        onEmotionChange={setActiveEmotion}
      />

      {/* 2. Glass Player Center Panel */}
      <div
        className={`relative z-10 w-full max-w-sm p-6 rounded-[28px] border border-white/[0.06] bg-[#0c0c12]/35 backdrop-blur-[24px] shadow-emotion transition-all duration-700 glass-noise ${
          isZen
            ? 'opacity-0 scale-[0.93] pointer-events-none translate-y-6 blur-lg'
            : 'opacity-100 scale-100 pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()} // don't close Zen mode when hitting player!
      >
        {/* Top brand header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--emotion-color)] transition-colors duration-500 animate-pulse" />
            <span className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
              Sonoria | 听见灵魂
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'style' ? null : 'style')}
              className={`p-2 rounded-xl bg-white/[0.02] border transition-all cursor-pointer ${
                activeDrawer === 'style'
                  ? 'border-[var(--emotion-color)] text-[var(--emotion-color)]'
                  : 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Visual Styles"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'playlist' ? null : 'playlist')}
              className={`p-2 rounded-xl bg-white/[0.02] border transition-all cursor-pointer ${
                activeDrawer === 'playlist'
                  ? 'border-[var(--emotion-color)] text-[var(--emotion-color)]'
                  : 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Playlist Manager"
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'add' ? null : 'add')}
              className={`p-2 rounded-xl bg-white/[0.02] border transition-all cursor-pointer ${
                activeDrawer === 'add'
                  ? 'border-[var(--emotion-color)] text-[var(--emotion-color)]'
                  : 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Import Songs"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'code' ? null : 'code')}
              className={`p-2 rounded-xl bg-white/[0.02] border transition-all cursor-pointer ${
                activeDrawer === 'code'
                  ? 'border-[var(--emotion-color)] text-[var(--emotion-color)]'
                  : 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Developer Terminal"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Album & Visual Mirror */}
        <div className="relative w-full aspect-square rounded-[22px] border border-white/[0.05] bg-black/40 overflow-hidden mb-6 group shadow-inner">
          <canvas
            ref={albumCanvasRef}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen scale-[1.02]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5">
            <h1 className="font-display text-xl font-bold text-white leading-tight tracking-wide mb-1">
              {isMicActive ? 'Air Resonance' : activeTrack?.name || 'Silent Wave'}
            </h1>
            <p className="text-xs text-zinc-400 truncate leading-tight tracking-normal">
              {isMicActive ? 'Listening to Ambient Microphones...' : activeTrack?.artist || 'Sonoria Audio Laboratory'}
            </p>
          </div>

          {/* Quick full-screen zen button overlay */}
          <button
            onClick={() => setIsZen(true)}
            className="absolute top-4 right-4 p-2 py-1.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all text-zinc-400 hover:text-white flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Zen Mode [Z]
          </button>
        </div>

        {/* Timeline Slider / Progress Track Container */}
        {!isMicActive && (
          <div className="space-y-2 mb-6">
            <div
              ref={progressScrubRef}
              onClick={(e) => handleScrub(e.clientX)}
              className="relative w-full h-1.5 bg-white/5 hover:h-2 rounded-full cursor-pointer transition-all duration-300 group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-[var(--emotion-color)] rounded-full transition-all duration-100 relative"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                {/* Scrub knob */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity ring-2 ring-[var(--emotion-color)]" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 tracking-wider">
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3 h-3 text-[var(--emotion-color)] animate-[pulse_1.5s_infinite]" />
                {formatTime(currentTime)}
              </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Player controls deck */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleMic}
            className={`p-3.5 rounded-full border transition-all outline-none cursor-pointer duration-300 ${
              isMicActive
                ? 'bg-red-500/10 border-red-500 text-red-400 rotate-12 scale-105 shadow-md shadow-red-500/10 animate-pulse'
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
            }`}
            title="Air Resonance (Mic Mode) [M]"
          >
            <Mic className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSkip(-1)}
              className="p-3.5 rounded-full bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Prev Track"
            >
              <SkipBack className="w-5 h-5 fill-zinc-450" />
            </button>

            <button
              onClick={() => handleTogglePlay()}
              className="w-14 h-14 rounded-full bg-[var(--emotion-color)] text-black flex items-center justify-center hover:opacity-95 shadow-lg shadow-[var(--emotion-glow)] select-none hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="Play / Pause [Space]"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-black stroke-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-1 stroke-black" />
              )}
            </button>

            <button
              onClick={() => handleSkip(1)}
              className="p-3.5 rounded-full bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-zinc-450" />
            </button>
          </div>

          {/* Quick interactive random emotion trigger banner */}
          <button
            onClick={() => {
              const styles = VISUAL_STYLES;
              const pick = styles[Math.floor(Math.random() * styles.length)];
              handleSelectStyle(pick.id);
            }}
            className="p-3.5 rounded-full bg-white/[0.02] border border-white/5 text-zinc-450 hover:text-white hover:border-white/15 transition-all cursor-pointer"
            title="Morph Random Palette"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Floating Mini player capsule in Zen display mode */}
      <ZenCapsule
        isVisible={isZen}
        activeTrackName={isMicActive ? 'Air Resonance' : activeTrack?.name || ''}
        activeTrackArtist={isMicActive ? 'Ambient Frequencies' : activeTrack?.artist || ''}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        activeEmotion={activeStyleId}
      />

      {/* 4. Sliding Option Drawer Panels */}
      <StylesDrawer
        isOpen={activeDrawer === 'style'}
        onClose={() => setActiveDrawer(null)}
        activeMode={activeStyleId}
        onSelectStyle={handleSelectStyle}
      />

      <PlaylistDrawer
        isOpen={activeDrawer === 'playlist'}
        onClose={() => setActiveDrawer(null)}
        playlist={playlist}
        activeIndex={trackIdx}
        onSelectTrack={(i) => {
          setTrackIdx(i);
          setIsPlaying(false);
          ambientSynth.stop();
          setTimeout(() => {
            handleTogglePlay();
          }, 100);
        }}
        isPlaying={isPlaying}
      />

      <AddMusicDrawer
        isOpen={activeDrawer === 'add'}
        onClose={() => setActiveDrawer(null)}
        onAddTrack={handleAddTrack}
        onToast={triggerToast}
      />

      <CodeDrawer
        isOpen={activeDrawer === 'code'}
        onClose={() => setActiveDrawer(null)}
        customJsCode={customJsCode}
        onUpdateJsCode={setCustomJsCode}
        isCustomCodeActive={isCustomCodeActive}
        onToggleCustomCode={setIsCustomCodeActive}
        currentEmotion={activeEmotion}
        onSelectStyle={handleSelectStyle}
        onSetEmotion={setActiveEmotion}
        onToast={triggerToast}
      />

      {/* 5. Minimalistic Ambient Floating Toast Message */}
      {toastText && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl text-[11px] font-medium text-white/90 tracking-wide flex items-center gap-1.5 animate-fade-in uppercase font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emotion-color)]" />
          {toastText}
        </div>
      )}
    </div>
  );
}
