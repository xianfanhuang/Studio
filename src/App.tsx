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
  AudioWaveform, // Added icon for AI host
  
  Orbit,
  Circle,
  Wind,
  Droplet,
  Captions,
  MoreHorizontal
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
    id: 'soma-groovesalad',
    name: 'SomaFM: Groove Salad',
    artist: 'Global Radio - Downtempo/Chill',
    src: 'https://ice1.somafm.com/groovesalad-128-mp3',
    isUrl: true,
    isSynthesized: false,
  },
  {
    id: 'soma-dronezone',
    name: 'SomaFM: Drone Zone',
    artist: 'Global Radio - Ambient Space',
    src: 'https://ice1.somafm.com/dronezone-128-mp3',
    isUrl: true,
    isSynthesized: false,
  },
  {
    id: 'kexp-seattle',
    name: 'KEXP 90.3 FM',
    artist: 'Global Radio - Seattle Indie',
    src: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    isUrl: true,
    isSynthesized: false,
  },
  {
    id: 'ocean-dream',
    name: 'Ocean Dream',
    artist: 'Procedural Luminous Pad',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'ambient',
  },
  {
    id: 'binaural-flow',
    name: 'Binaural Flow',
    artist: 'Alpha Brainwave Solfeggio',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'binaural',
  },
  {
    id: 'forest-fire',
    name: 'Forest Campfire',
    artist: 'Procedural Organic Chill',
    src: '',
    isUrl: false,
    isSynthesized: true,
    synthType: 'chill',
  },
  {
    id: 'space-bell',
    name: 'Space Bell',
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
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  
  // AI Host state
  const [isHostActive, setIsHostActive] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<'dj' | 'assistant' | 'off'>('dj');

  // CC (Smart Subtitles) state
  const [isCcActive, setIsCcActive] = useState<boolean>(false);
  const [subtitle, setSubtitle] = useState<{original: string, translation: string} | null>(null);
  const isCcActiveRef = useRef<boolean>(false);
  const lastDjTimeRef = useRef<number>(0);
  const ccRecorderRef = useRef<MediaRecorder | null>(null);
  const ccDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

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

  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const currentTtsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const masterCompressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Trigger floating text toasts
  const triggerToast = (text: string) => {
    setToastText(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastText(null);
    }, 4000);
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
        source.connect(musicGain);
        musicGain.connect(masterCompressor);
        masterCompressor.connect(analyser);
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

  // Mood Sync Logic
  const handleSyncMood = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    triggerToast('Analyzing environmental atmosphere...');
    
    if (!navigator.geolocation) {
       triggerToast('Geolocation not supported by this browser.');
       return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
       try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
          const weatherData = await weatherRes.json();
          
          if (weatherData.current_weather) {
             const { weathercode, is_day, temperature } = weatherData.current_weather;
             const moodRes = await fetch('/api/host/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weatherCode: weathercode, isDay: is_day, temperature })
             });
             const moodData = await moodRes.json();
             
             if (moodData.styleId && moodData.emotion) {
                setActiveStyleId(moodData.styleId);
                setActiveEmotion(moodData.emotion);
                triggerToast(moodData.message || 'Mood synchronized.');
                
                // Also update synth if running
                if (isPlaying && activeTrack?.isSynthesized && audioContextRef.current) {
                   (audioContextRef.current as any).emotion = moodData.emotion;
                   ambientSynth.stop();
    if (audioElementRef.current) audioElementRef.current.pause();
                   ambientSynth.start(audioContextRef.current, musicGainRef.current || analyserRef.current!, moodData.emotion);
                }
             }
          } else {
             triggerToast('Weather data unavailable.');
          }
       } catch (err) {
          console.error('Mood sync error:', err);
          triggerToast('Failed to sync environment.');
       }
    }, () => {
       triggerToast('Location access denied. Cannot sync mood.');
    });
  };

  // AI Host Logic
  const handleToggleAiMode = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAiMode((prev) => {
      if (prev === 'dj') {
        triggerToast('AI Mode: Assistant');
        return 'assistant';
      }
      if (prev === 'assistant') {
        triggerToast('AI Mode: Off');
        return 'off';
      }
      triggerToast('AI Mode: DJ Companion');
      return 'dj';
    });
  };

  const handleAIHost = async (context: 'intro' | 'news' = 'intro', e?: React.MouseEvent, forceTrackName?: string) => {
    if (e) e.stopPropagation();
    
    if (isHostActive) {
       // Stop current speech
       if (currentTtsSourceRef.current) {
          currentTtsSourceRef.current.stop();
       }
       setIsHostActive(false);
       triggerToast('Host muted.');
       if (musicGainRef.current && audioContextRef.current) {
          musicGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
          musicGainRef.current.gain.linearRampToValueAtTime(1.0, audioContextRef.current.currentTime + 1.0);
       }
       return;
    }

    if (musicGainRef.current && audioContextRef.current) {
       musicGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
       musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, audioContextRef.current.currentTime);
       musicGainRef.current.gain.linearRampToValueAtTime(0.4, audioContextRef.current.currentTime + 0.5);
    }

    setIsHostActive(true);
    triggerToast(context === 'news' ? 'Preparing news...' : 'Preparing intro...');
    lastDjTimeRef.current = Date.now();

    let spokenText = 'Connecting...';
    try {
      const textRes = await fetch('/api/host/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context, 
          trackName: forceTrackName || activeTrack?.name,
          emotion: activeEmotion,
          localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          aiMode
        }),
      });
      const textData = await textRes.json();
      
      if (textData.text) {
         spokenText = textData.text;
      }

      triggerToast(spokenText);

      const ttsRes = await fetch('/api/host/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText }),
      });
      const ttsData = await ttsRes.json();

      if (ttsData.audio) {
        const { ctx: audioCtx, analyser } = await initAudio();

        const binaryString = atob(ttsData.audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const buffer = new Int16Array(bytes.buffer);
        const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
          channelData[i] = buffer[i] / 32768.0;
        }
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to our main analyser if we want it to react to the voice!
        const voiceGain = audioCtx.createGain();
        voiceGain.gain.value = 2.5;
        source.connect(voiceGain);
        if (masterCompressorRef.current) {
            voiceGain.connect(masterCompressorRef.current);
        } else {
            voiceGain.connect(analyser);
        }

        currentTtsSourceRef.current = source;
        
        if (musicGainRef.current && audioCtx) {
           musicGainRef.current.gain.cancelScheduledValues(audioCtx.currentTime);
           musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, audioCtx.currentTime);
           musicGainRef.current.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.5);
        }
        source.start();

        
        const restoreVolume = () => {
           setIsHostActive(false);
           if (musicGainRef.current && audioCtx) {
              musicGainRef.current.gain.cancelScheduledValues(audioCtx.currentTime);
              musicGainRef.current.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 2.0);
           }
        };

        source.onended = restoreVolume;
      } else {
        throw new Error('TTS Rate Limited');
      }
    } catch (err) {
      console.warn('AI Host error, falling back to local TTS:', err);
      
      const restoreVolumeFallback = () => {
         setIsHostActive(false);
         if (musicGainRef.current && audioContextRef.current) {
            musicGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
            musicGainRef.current.gain.linearRampToValueAtTime(1.0, audioContextRef.current.currentTime + 2.0);
         }
      };

      
      if (musicGainRef.current && audioContextRef.current) {
         musicGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
         musicGainRef.current.gain.setValueAtTime(musicGainRef.current.gain.value, audioContextRef.current.currentTime);
         musicGainRef.current.gain.linearRampToValueAtTime(0.35, audioContextRef.current.currentTime + 0.5);
      }
      if ('speechSynthesis' in window) {

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = 0.95;
        utterance.pitch = 0.95;
        utterance.onend = restoreVolumeFallback;
        utterance.onerror = restoreVolumeFallback;
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(restoreVolumeFallback, 4000);
      }
    }
  };

  // CC Loop Logic
  const runCCLoop = async () => {
    const { ctx, analyser } = await initAudio();

    if (!ccDestRef.current) {
      ccDestRef.current = ctx.createMediaStreamDestination();
      analyser.connect(ccDestRef.current);
    }

    const recordAndTranscribe = () => {
      if (!isCcActiveRef.current || !ccDestRef.current) return;

      const recorder = new MediaRecorder(ccDestRef.current.stream, { mimeType: 'audio/webm' });
      ccRecorderRef.current = recorder;
      let chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: 'audio/webm' });

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const result = reader.result as string;
          const base64data = result.split(',')[1];
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64data })
            });
            const data = await res.json();
            if (data && (data.original || data.translation)) {
              if (data.original.length > 2) {
                setSubtitle({ original: data.original, translation: data.translation });
              }
            }
          } catch (e) {
            console.warn('Transcription rate limit or error');
          }
        };

        if (isCcActiveRef.current) {
          recordAndTranscribe();
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 8000); // Record in 8-second chunks
    };

    recordAndTranscribe();
  };

  const handleToggleCC = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    isCcActiveRef.current = !isCcActiveRef.current;
    setIsCcActive(isCcActiveRef.current);

    if (isCcActiveRef.current) {
      triggerToast('Smart Subtitles Enabled');
      runCCLoop();
    } else {
      triggerToast('Smart Subtitles Disabled');
      if (ccRecorderRef.current && ccRecorderRef.current.state === 'recording') {
        ccRecorderRef.current.stop();
      }
      setSubtitle(null);
    }
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
      if (!analyserRef.current || (!isPlaying && !isHostActive && !isMicActive)) {
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
  }, [isPlaying, isHostActive, isMicActive]);

  // General Play / Pause control triggers
  const handleTogglePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Shut down mic if active first
    if (isMicActive) {
      handleToggleMic();
    }
    
    if (isHostActive && currentTtsSourceRef.current) {
       currentTtsSourceRef.current.stop();
       setIsHostActive(false);
    }

    const { ctx, analyser } = await initAudio();

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      ambientSynth.stop();
    if (audioElementRef.current) audioElementRef.current.pause();
      audioElementRef.current?.pause();
    } else {
      // Play
      setIsPlaying(true);
      if (activeTrack?.isSynthesized) {
        // Procedural synthetics routing
        (ctx as any).emotion = activeEmotion;
        ambientSynth.start(ctx, musicGainRef.current || analyser, activeEmotion);
        setCurrentTime(0);
        setDuration(120); // Infinite placeholder duration
        triggerToast('Playing ambient landscape...');
      } else if (audioElementRef.current) {
        // Traditional files
        const currentSrcUrl = new URL(audioElementRef.current.src, window.location.href).pathname;
        if (currentSrcUrl !== activeTrack.src) {
           audioElementRef.current.src = activeTrack.src;
        }
        audioElementRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error(err);
            triggerToast('Playback blocked. Tap play again.');
            setIsPlaying(false);
          }
        });
      }
    }
  };

  // Engage ambient physical microphone mode (Ambient Mic)
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
      triggerToast('Microphone disabled.');
    } else {
      // Shut down music player first
      setIsPlaying(false);
      ambientSynth.stop();
    if (audioElementRef.current) audioElementRef.current.pause();
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
          triggerToast('Ambient Mic: Listening to mic frequencies...');
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
    if (audioElementRef.current) audioElementRef.current.pause();
    setIsPlaying(false);
    
    const nextTrack = playlist[nextIdx];
    const timeSinceLastDj = Date.now() - lastDjTimeRef.current;
    // Smart DJ Match: Actively host if > 3 mins since last intro, OR randomly (25%), OR it's the very first play.
    const shouldDj = aiMode === 'dj' && (timeSinceLastDj > 180000 || Math.random() < 0.25 || lastDjTimeRef.current === 0);

    setTrackIdx(nextIdx);

    // Auto-resume onto next track
    setTimeout(async () => {
      const { ctx, analyser } = await initAudio();
      setIsPlaying(true);
      const nextTrack = playlist[nextIdx];

      if (nextTrack.isSynthesized) {
        (ctx as any).emotion = activeEmotion;
        ambientSynth.start(ctx, musicGainRef.current || analyser, activeEmotion);
        setCurrentTime(0);
        setDuration(120);
      } else if (audioElementRef.current) {
        audioElementRef.current.src = nextTrack.src;
        audioElementRef.current.play().catch((err) => {
          if (err.name !== 'AbortError') {
            setIsPlaying(false);
          }
        });
      }

      if (shouldDj) {
         handleAIHost('intro', undefined, nextTrack.name);
      }
    }, 150);
  };

  // Add individual tracks to our active track listing
  const handleAddTrack = (track: Track) => {
    setPlaylist((prev) => [...prev, track]);
    setTrackIdx(playlist.length); // Play newly loaded song right away!
    setIsPlaying(false);
    ambientSynth.stop();
    if (audioElementRef.current) audioElementRef.current.pause();

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
        case 'KeyC':
          setActiveDrawer((prev) => prev === 'code' ? null : 'code');
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
    if (isPlaying || isHostActive) {
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
  }, [isPlaying, isZen, isHostActive]);

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
      className="relative w-screen h-screen bg-black text-zinc-100 flex items-center justify-center font-sans select-none overflow-hidden"
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
        className={`relative z-10 w-full max-w-[19rem] sm:max-w-[380px] p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border border-white/[0.06] bg-black/40 sm:bg-[#0a0a0a]/60 backdrop-blur-[32px] shadow-2xl transition-all duration-700  ${
          isZen
            ? 'opacity-0 scale-[0.93] pointer-events-none translate-y-6 blur-lg'
            : 'opacity-100 scale-100 pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()} // don't close Zen mode when hitting player!
      >
        {/* Top toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--emotion-color)] transition-colors duration-500 animate-pulse" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {activeEmotion}
            </span>
          </div>

          <div className="flex gap-1.5 items-center relative">
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'style' ? null : 'style')}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                activeDrawer === 'style'
                  ? 'bg-[var(--emotion-color)]/10 text-[var(--emotion-color)]'
                  : 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Visual Styles"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'playlist' ? null : 'playlist')}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                activeDrawer === 'playlist'
                  ? 'bg-[var(--emotion-color)]/10 text-[var(--emotion-color)]'
                  : 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Private Library"
            >
              <Music className="w-4 h-4" />
            </button>
            
            <div className="w-px h-3 bg-white/10 mx-0.5" />
            
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                showMoreMenu || isCcActive
                  ? 'text-white bg-white/[0.04]'
                  : 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Expanding Options Panel */}
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-2 p-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-1 animate-fade-in z-50">
                <button
                  onClick={(e) => {
                    handleSyncMood(e);
                    setShowMoreMenu(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
                  title="Mood Sync"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Sync Mood</span>
                </button>
                <button
                  onClick={(e) => {
                    handleAIHost('news', e);
                    setShowMoreMenu(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
                  title="AI News Update"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Briefing</span>
                </button>
                <button
                  onClick={() => {
                    handleToggleCC();
                    setShowMoreMenu(false);
                  }}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-medium ${
                    isCcActive
                      ? 'bg-[var(--emotion-color)]/20 text-[var(--emotion-color)]'
                      : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title="Smart Subtitles"
                >
                  <Captions className="w-3.5 h-3.5" />
                  <span>Subtitles</span>
                </button>
              </div>
            )}
          </div>
        </div>        {/* Dynamic Album & Visual Brand Center */}
        <div className="relative w-full aspect-square sm:aspect-[4/4.5] rounded-[20px] sm:rounded-[24px] border border-white/[0.05] bg-gradient-to-b from-black/60 to-black/90 overflow-hidden mb-5 sm:mb-6 group shadow-[0_0_40px_rgba(0,0,0,0.5)_inset] flex flex-col items-center justify-center">
          <canvas
            ref={albumCanvasRef}
            className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
          />
          {/* Core Brand Mark */}
          <div className="z-10 flex flex-col items-center justify-center mt-[-10px] pointer-events-none select-none">
            <h2 className="font-display text-5xl sm:text-[3.5rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/95 to-white/30 drop-shadow-2xl">
              Miadio
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1 h-1 rounded-full bg-[var(--emotion-color)]/60 animate-pulse" />
              <div className="w-6 h-0.5 bg-gradient-to-r from-[var(--emotion-color)] to-transparent rounded-full shadow-[0_0_8px_var(--emotion-glow)]" />
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-4">
            <h1 className="font-display text-lg font-medium text-white/90 leading-tight tracking-wide mb-0.5 transition-colors duration-500">
              {isMicActive ? 'Ambient Mic' : isHostActive ? 'AI Assistant Speaking' : activeTrack?.name || 'Silent Wave'}
            </h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-tight transition-colors duration-500">
              {isMicActive ? 'Listening to microphone' : isHostActive ? 'Generative Broadcast' : activeTrack?.artist || 'Acoustic Engine'}
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
        {!isMicActive && !isHostActive && (
          <div className="space-y-2 mb-6">
            <div
              ref={progressScrubRef}
              onClick={(e) => handleScrub(e.clientX)}
              className="relative w-full h-1.5 bg-white/5 hover:h-2 rounded-full cursor-pointer transition-all duration-300 group"
            >
              <div
                className="absolute left-0 top-0 h-full bg-[var(--emotion-color)] rounded-full transition-all duration-100 relative"
                style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
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

        {/* AI Host Progress Placeholder */}
        {isHostActive && (
          <div className="space-y-2 mb-5 h-6 flex items-center">
             <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <div className="absolute top-0 left-0 h-full bg-[var(--emotion-color)] w-full animate-[pulse_1s_infinite]" />
             </div>
          </div>
        )}

        {/* Player controls deck */}
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => {
              if (isHostActive) {
                handleAIHost('intro', e); // This will mute the host
              } else {
                handleToggleAiMode(e);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (aiMode !== 'off' && !isHostActive) {
                handleAIHost('intro', e as any);
              }
            }}
            className={`p-3.5 rounded-full transition-all outline-none cursor-pointer duration-300 ${
              isHostActive
                ? 'bg-[var(--emotion-color)]/20 text-white shadow-md shadow-[var(--emotion-color)]/20 animate-pulse'
                : aiMode !== 'off'
                  ? 'bg-white/[0.04] text-[var(--emotion-color)] hover:bg-[var(--emotion-color)]/10'
                  : 'bg-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]'
            }`}
            title={`AI Mode: ${aiMode.toUpperCase()} (Click to change | Right-click for intro)`}
          >
            {aiMode === 'dj' ? (
              <AudioWaveform className={`w-5 h-5 ${isHostActive ? 'animate-pulse' : ''}`} />
            ) : aiMode === 'assistant' ? (
              <Orbit className={`w-5 h-5 ${isHostActive ? 'animate-bounce' : ''}`} />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSkip(-1)}
              className="p-3 rounded-full bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Prev Track"
            >
              <SkipBack className="w-4 h-4 fill-zinc-450" />
            </button>

            <button
              onClick={() => handleTogglePlay()}
              className="w-12 h-12 rounded-full bg-[var(--emotion-color)] text-black flex items-center justify-center hover:opacity-95 shadow-lg shadow-[var(--emotion-glow)] select-none hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="Play / Pause [Space]"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black stroke-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-1 stroke-black" />
              )}
            </button>

            <button
              onClick={() => handleSkip(1)}
              className="p-3 rounded-full bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-zinc-450" />
            </button>
          </div>

          <button
            onClick={() => {
              const styles = VISUAL_STYLES;
              const pick = styles[Math.floor(Math.random() * styles.length)];
              handleSelectStyle(pick.id);
            }}
            className="p-3.5 rounded-full bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
            title="Morph Random Palette"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Floating Mini player capsule in Zen display mode */}
      <ZenCapsule
        isVisible={isZen}
        activeTrackName={isMicActive ? 'Ambient Mic' : isHostActive ? 'AI Assistant Speaking' : activeTrack?.name || ''}
        activeTrackArtist={isMicActive ? 'Ambient Frequencies' : isHostActive ? 'Miadio' : activeTrack?.artist || ''}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying || isHostActive}
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
    if (audioElementRef.current) audioElementRef.current.pause();
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

      {/* Smart Subtitles Overlay */}
      {isCcActive && subtitle && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center pointer-events-none z-40 flex flex-col gap-1.5 px-4 animate-fade-in">
          <div className="font-sans text-lg font-medium text-white px-5 py-2.5 bg-black/60 backdrop-blur-md rounded-xl inline-block mx-auto border border-white/5 shadow-2xl">
            {subtitle.original}
          </div>
          {subtitle.translation && (
            <div className="font-sans text-[13px] font-normal text-zinc-400 px-4 py-1.5 bg-black/50 backdrop-blur-md rounded-lg inline-block mx-auto border border-white/5">
              {subtitle.translation}
            </div>
          )}
        </div>
      )}

      {/* 5. Minimalistic Ambient Floating Toast Message */}
      {toastText && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full text-center px-6 py-3 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl text-[12px] font-medium text-white/90 tracking-wide flex items-center justify-center gap-2 animate-fade-in font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emotion-color)] flex-shrink-0" />
          {toastText}
        </div>
      )}
    </div>
  );
}
