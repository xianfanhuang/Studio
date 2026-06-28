import React from 'react';
import { Play, Pause, Music, Sliders, X, Sparkles } from 'lucide-react';
import { Track } from '../types';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Track[];
  activeIndex: number;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  playlist,
  activeIndex,
  onSelectTrack,
  isPlaying,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950/95 border-l border-white/5 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-[var(--emotion-color)] transition-colors duration-500" />
          <h2 className="text-lg font-medium text-white tracking-wide">曲库清单 · Playlist</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed font-sans">
          整合了环境频率合成音、流媒体网络电波及本地拖入曲目。点击卡片开启即刻同频运转。
        </p>

        <div className="space-y-2 pt-2">
          {playlist.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center">
              <p className="text-sm text-zinc-500 mb-1">您的播放列表空无一人</p>
              <p className="text-xs text-zinc-600">点击 “加曲” 拖放本地 MP3 或加载音乐流</p>
            </div>
          ) : (
            playlist.map((track, i) => {
              const isActive = i === activeIndex;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(i)}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.04] border-[var(--emotion-color)] shadow-sm'
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-[var(--emotion-dim)]'
                          : 'bg-white/5 group-hover:bg-white/10'
                      }`}
                    >
                      {isActive && isPlaying ? (
                        /* Simple procedural equalizer bars */
                        <div className="flex items-end gap-[3px] h-[16px]">
                          <span className="w-[3px] bg-[var(--emotion-color)] rounded-full animate-[pulse_0.8s_infinite] h-4" />
                          <span className="w-[3px] bg-[var(--emotion-color)] rounded-full animate-[pulse_0.6s_infinite] delay-100 h-2" />
                          <span className="w-[3px] bg-[var(--emotion-color)] rounded-full animate-[pulse_1s_infinite] delay-300 h-3" />
                        </div>
                      ) : track.isSynthesized ? (
                        <Sparkles className={`w-4 h-4 ${isActive ? 'text-[var(--emotion-color)]' : 'text-zinc-400'}`} />
                      ) : (
                        <Music className={`w-4 h-4 ${isActive ? 'text-[var(--emotion-color)]' : 'text-zinc-400'}`} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-medium truncate tracking-wide ${
                          isActive
                            ? 'text-[var(--emotion-color)]'
                            : 'text-zinc-200 group-hover:text-white transition-colors'
                        }`}
                      >
                        {track.name}
                      </h4>
                      <p className="text-xs text-zinc-500 font-sans truncate tracking-tight">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {track.isSynthesized && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        Synth
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-mono font-medium text-[var(--emotion-color)]">
                        NOW
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
