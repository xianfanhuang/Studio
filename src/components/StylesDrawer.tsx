import React from 'react';
import { Palette, X } from 'lucide-react';
import { VISUAL_STYLES } from '../visualStylesData';
import { VisualStyle } from '../types';

interface StylesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: string;
  onSelectStyle: (styleId: string) => void;
}

export const StylesDrawer: React.FC<StylesDrawerProps> = ({
  isOpen,
  onClose,
  activeMode,
  onSelectStyle,
}) => {
  if (!isOpen) return null;

  // Emotion-specific tag colors
  const getEmotionBadge = (emotion: string) => {
    switch (emotion) {
      case 'serene':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'energized':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'tender':
        return 'bg-pink-500/10 text-pink-300 border-pink-500/20';
      case 'focused':
        return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950/95 border-l border-white/5 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-[var(--emotion-color)] transition-colors duration-500" />
          <h2 className="text-lg font-medium text-white tracking-wide">视觉风格 · Styles</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Styles Drawer"
          className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Styles Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          Sonoria 风格引擎融合了 Canvas 微粒子与高频滤波器。点击下方预设启动动态画幅切换。
        </p>

        <div className="grid grid-cols-1 gap-3 pt-2">
          {VISUAL_STYLES.map((style: VisualStyle) => {
            const isActive = style.id === activeMode;
            return (
              <button
                key={style.id}
                onClick={() => onSelectStyle(style.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.04] border-[var(--emotion-color)] shadow-lg shadow-[var(--emotion-dim)]'
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r bg-[var(--emotion-color)]" />
                )}

                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-[var(--emotion-color)] transition-colors duration-300">
                      {style.name}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      {style.nameEn}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getEmotionBadge(
                      style.emotion
                    )}`}
                  >
                    {style.emotion}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {style.description}
                </p>

                <div className="mt-3 flex gap-2">
                  <span className="text-[9px] font-mono bg-white/5 text-zinc-500 rounded px-1.5 py-0.5">
                    {style.category}
                  </span>
                  <span className="text-[9px] font-mono bg-white/5 text-zinc-500 rounded px-1.5 py-0.5">
                    GPU: {style.gpuReq}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
