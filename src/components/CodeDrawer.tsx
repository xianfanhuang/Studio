import React, { useState, useEffect } from 'react';
import { Terminal, Send, Sparkles, RefreshCw, X, Play, ShieldAlert, Loader2 } from 'lucide-react';
import { EmotionType } from '../types';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customJsCode: string;
  onUpdateJsCode: (code: string) => void;
  isCustomCodeActive: boolean;
  onToggleCustomCode: (active: boolean) => void;
  currentEmotion: EmotionType;
  onSelectStyle: (styleId: string) => void;
  onSetEmotion: (emotion: EmotionType) => void;
  onToast: (msg: string) => void;
}

const DEFAULT_SAMPLE_CODE = `// Sonoria 实时画布物理运算引擎
// 变量接口: (ctx, W, H, time, low, mid, high, energy, data, hue, flash)
// ctx: 2D画笔, W/H: 宽/高, time: 滴答秒, low/mid/high/energy: 音频段
// data: 音频字节流 (128 bytes), hue: 情感色相 (0-360), flash: 节拍闪烁

// 1. 背景残影
ctx.fillStyle = "rgba(5, 5, 8, 0.12)";
ctx.fillRect(0, 0, W, H);

// 2. 绘制星环
var cx = W / 2;
var cy = H / 2;
var ringRadius = Math.min(W, H) * (0.2 + energy * 0.18);
var points = 48;

ctx.beginPath();
for (var i = 0; i <= points; i++) {
  var angle = (i / points) * Math.PI * 2;
  var audioIdx = Math.floor((i % points) * (data.length / points));
  var val = data[audioIdx] / 255;
  var r = ringRadius + val * 120 * (1.0 + flash);
  var x = cx + Math.cos(angle + time * 0.4) * r;
  var y = cy + Math.sin(angle + time * 0.4) * r;
  if (i === 0) ctx.moveTo(x, y);
  else ctx.lineTo(x, y);
}
ctx.closePath();

ctx.strokeStyle = "hsla(" + (hue + Math.sin(time) * 30) + ", 95%, 68%, " + (0.4 + flash * 0.4) + ")";
ctx.lineWidth = 2 + flash * 4;
ctx.shadowColor = "hsla(" + hue + ", 95%, 50%, 0.4)";
ctx.shadowBlur = 15;
ctx.stroke();
ctx.shadowBlur = 0; // 重置阴影以免卡顿
`;

export const CodeDrawer: React.FC<CodeDrawerProps> = ({
  isOpen,
  onClose,
  customJsCode,
  onUpdateJsCode,
  isCustomCodeActive,
  onToggleCustomCode,
  currentEmotion,
  onSelectStyle,
  onSetEmotion,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'gemini'>('editor');
  const [editorCode, setEditorCode] = useState(customJsCode || DEFAULT_SAMPLE_CODE);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!customJsCode) {
      onUpdateJsCode(DEFAULT_SAMPLE_CODE);
    }
  }, []);

  if (!isOpen) return null;

  // Run or sync active code
  const handleApplyCode = () => {
    onUpdateJsCode(editorCode);
    onToggleCustomCode(true);
    onToast('Javascript custom pipeline applied successfully!');
  };

  const handleResetCode = () => {
    setEditorCode(DEFAULT_SAMPLE_CODE);
    onUpdateJsCode(DEFAULT_SAMPLE_CODE);
    onToggleCustomCode(false);
    onToast('Reset back to factory settings.');
  };

  // Submit mood query to full-stack backend Gemini route
  const handleGenerateAiCode = async () => {
    const query = prompt.trim();
    if (!query) return;

    setIsLoading(true);
    setAiFeedback(null);
    onToast('Connecting to Acoustic Gemini Co-pilot...');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          currentEmotion,
        }),
      });

      const data = await response.json();

      if (response.ok && data.canvasCode) {
        // Apply emotion transition
        if (data.emotion) {
          const matchedEmotion = data.emotion.toLowerCase() as EmotionType;
          onSetEmotion(matchedEmotion);
          
          // Switch to a neutral layout style or keep active
          onSelectStyle(matchedEmotion === 'serene' ? 'aurora' : matchedEmotion === 'focused' ? 'neural' : matchedEmotion === 'energized' ? 'pulse' : 'bloom');
        }

        // Apply generated canvas mathematics
        setEditorCode(data.canvasCode);
        onUpdateJsCode(data.canvasCode);
        onToggleCustomCode(true);

        // Record AI warm response log
        setAiFeedback(data.feelingText);
        onToast('Gemini successfully generated code!');
      } else {
        throw new Error(data.error || 'Invalid generator output');
      }
    } catch (e: any) {
      console.error(e);
      onToast(`Gemini generation halted: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-zinc-950/95 border-l border-white/5 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[var(--emotion-color)] transition-colors duration-500" />
          <h2 className="text-lg font-medium text-white tracking-wide">极客引擎 · Terminal</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Code Drawer"
          className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-3 text-xs font-medium tracking-wide border-b-2 cursor-pointer transition-all ${
            activeTab === 'editor'
              ? 'text-[var(--emotion-color)] border-[var(--emotion-color)] bg-white/[0.02]'
              : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          实时代码 JS Code
        </button>
        <button
          onClick={() => setActiveTab('gemini')}
          className={`flex-1 py-3 text-xs font-medium tracking-wide border-b-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'gemini'
              ? 'text-[var(--emotion-color)] border-[var(--emotion-color)] bg-white/[0.02]'
              : 'text-zinc-500 border-transparent hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          心情共鸣 Gemini AI
        </button>
      </div>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-sans">
                您可以直接写入 CanvasRenderingContext2D (渲染物理流)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-600">CUSTOM MODE:</span>
                <button
                  onClick={() => onToggleCustomCode(!isCustomCodeActive)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border font-sans cursor-pointer transition-colors ${
                    isCustomCodeActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {isCustomCodeActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
            </div>

            {/* Simulated Code block */}
            <div className="flex-1 min-h-0 border border-white/5 bg-zinc-900/60 rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/50 border-b border-light/5 text-[10px] font-mono text-zinc-500">
                <span>canvas-visualizer.js</span>
                <span>ECMAScript 6</span>
              </div>
              <textarea
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                className="flex-1 p-4 bg-transparent resize-none text-xs font-mono text-zinc-300 leading-relaxed overflow-y-auto outline-none border-none select-text"
                spellCheck={false}
              />
            </div>

            {/* Drawer buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyCode}
                className="flex-1 py-2.5 bg-[var(--emotion-color)] text-black rounded-lg font-medium text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                运行代码 Run
              </button>
              <button
                onClick={handleResetCode}
                className="p-2.5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg text-xs transition-all cursor-pointer"
                title="Reset to default code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-5 flex flex-col pr-1">
            <p className="text-xs text-zinc-400 leading-relaxed">
              输入您当下的<b>心情、想法、幻想场景</b>（例如：“在深邃的霓虹赛博雨夜漫步”或“压力山大，想让大脑彻底放空睡觉”），Gemini 将自动转换色彩体系并重新编排 Canvas 物理律动代码！
            </p>

            <div className="space-y-2">
              <textarea
                placeholder="例如：我刚下班，身心俱疲。希望能在温暖的炉火里放松..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerateAiCode()}
                className="w-full h-24 p-4 text-xs bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[var(--emotion-color)] rounded-xl text-zinc-200 outline-none transition-colors resize-none placeholder-zinc-600 font-sans"
              />

              <button
                onClick={handleGenerateAiCode}
                aria-label="Generate Math Canvas from Mood"
                disabled={isLoading || !prompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-[var(--emotion-color)] rounded-lg font-medium text-black text-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-500/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    编织中 Weaving algorithms...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    心情共振 Generate Math Canvas
                  </>
                )}
              </button>
            </div>

            {/* Gemini warm feedback response log box */}
            {aiFeedback && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 animate-fade-in animate-[pulse_6s_infinite]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--emotion-color)] uppercase tracking-widest font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Acoustic Advisor
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans font-light italic">
                  “ {aiFeedback} ”
                </p>
              </div>
            )}

            {!aiFeedback && !isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-2xl">
                <Sparkles className="w-6 h-6 text-zinc-700 mb-2" />
                <p className="text-[10px] text-zinc-600 max-w-[280px]">
                  等待接入您的灵魂意识。输入完成后，Canvas 将直接被重构。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export { DEFAULT_SAMPLE_CODE };
