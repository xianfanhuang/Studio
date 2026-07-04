import React from 'react';
import { Play, Pause, Compass } from 'lucide-react';

interface ZenCapsuleProps {
  isVisible: boolean;
  activeTrackName: string;
  activeTrackArtist: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: (e: React.MouseEvent) => void;
  activeEmotion: string;
}

export const ZenCapsule: React.FC<ZenCapsuleProps> = ({
  isVisible,
  activeTrackName,
  activeTrackArtist,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  activeEmotion,
}) => {
  if (!isVisible) return null;

  // Compute circular dash offsets for SVG indicator
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.1
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      onClick={(e) => e.stopPropagation()} // Stop propagation so clicking the capsule won't exit Zen mode!
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 py-2.5 pl-3.5 pr-5 rounded-full bg-black/40 hover:bg-black/55 border border-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 max-w-[90%] md:max-w-md group"
    >
      {/* Circle trigger with SVG timeline ring */}
      <div className="relative w-10 h-10 flex items-center justify-center cursor-pointer select-none" onClick={onTogglePlay}>
        <svg className="w-10 h-10 absolute -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="var(--emotion-color)"
            strokeWidth="3.0"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>

        <div className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          {isPlaying ? (
            <Pause className="w-3 h-3 text-white fill-white" />
          ) : (
            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
          )}
        </div>
      </div>

      {/* Track details with emotional compass */}
      <div className="min-w-0 pr-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-xs font-semibold text-white/90 truncate max-w-[140px] md:max-w-[200px]">
            {activeTrackName}
          </h4>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--emotion-color)] animate-ping" />
        </div>
        <p className="text-[10px] text-zinc-500 font-sans truncate tracking-wide uppercase mt-0.5 max-w-[180px]">
          {activeTrackArtist}
        </p>
      </div>

      <div className="h-6 w-px bg-white/10 rounded-full" />

      {/* Interactive brand representation */}
      <div className="flex flex-col items-end justify-center pr-1 select-none">
        <h2 className="font-display text-[12px] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white/95 to-white/40">
          Midalo
        </h2>
        <span className="uppercase tracking-[0.25em] text-[7px] text-[var(--emotion-color)] font-medium font-mono opacity-80 mt-[-2px]">
          {activeEmotion}
        </span>
      </div>
    </div>
  );
};
