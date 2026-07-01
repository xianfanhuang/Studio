import { useRef, useState, useCallback } from 'react';

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const initAudio = useCallback((): Promise<{ ctx: AudioContext; analyser: AnalyserNode }> => {
    return new Promise((resolve) => {
      if (audioContextRef.current && analyserRef.current) {
        resolve({ ctx: audioContextRef.current, analyser: analyserRef.current });
        return;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const el = new Audio();
      el.crossOrigin = 'anonymous';
      audioElementRef.current = el;

      try {
        const source = ctx.createMediaElementSource(el);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        mediaSourceRef.current = source;
      } catch (e) {
        console.warn('Media element proxy connection:', e);
      }

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          resolve({ ctx, analyser });
        });
      } else {
        resolve({ ctx, analyser });
      }
    });
  }, []);

  return {
    audioContextRef,
    analyserRef,
    audioElementRef,
    initAudio,
  };
}
