import React, { useState } from 'react';
import { Upload, Link2, PlusCircle, X, Check, Volume2 } from 'lucide-react';
import { Track } from '../types';

interface AddMusicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => void;
  onToast: (msg: string) => void;
}

export const AddMusicDrawer: React.FC<AddMusicDrawerProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  onToast,
}) => {
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // Handle stream URL insertion
  const handleAddUrl = () => {
    const trimmedInput = url.trim();
    if (!trimmedInput) return;

    const name = trimmedInput.split('/').pop()?.split('?')[0] || 'Network Wave';
    const newTrack: Track = {
      id: Math.random().toString(36).substring(7),
      name: name,
      artist: 'Network Wave Node',
      src: trimmedInput,
      isUrl: true,
    };

    onAddTrack(newTrack);
    setUrl('');
    onClose();
    onToast(`Successfully connected: ${name}`);
  };

  // Handle local file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/')) {
        onToast('Please submit valid audio files (MP3/OGG/WAV).');
        return;
      }

      const trackUrl = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '');
      const newTrack: Track = {
        id: Math.random().toString(36).substring(7),
        name: name,
        artist: 'Local File Stream',
        src: trackUrl,
        isUrl: false,
      };

      onAddTrack(newTrack);
    });

    onToast(`Added ${files.length} song(s) successfully!`);
    onClose();
  };

  // Drag and drop wrappers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Quick preset synth adders
  const addSynthSound = (synthType: 'sine' | 'ambient' | 'chill' | 'binaural', label: string) => {
    const newTrack: Track = {
      id: Math.random().toString(36).substring(7),
      name: `环境和弦 · ${label}`,
      artist: 'Synthesized Pad Engine (No Data Required)',
      src: '',
      isUrl: false,
      isSynthesized: true,
      synthType: synthType,
    };
    onAddTrack(newTrack);
    onToast(`Loaded: ${label}`);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950/95 border-l border-white/5 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlusCircle className="w-5 h-5 text-[var(--emotion-color)] transition-colors duration-500" />
          <h2 className="text-lg font-medium text-white tracking-wide">Import Tracks</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-transparent hover:bg-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group min-h-[160px] ${
            isDragging
              ? 'border-[var(--emotion-color)] bg-[var(--emotion-dim)]'
              : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'
          }`}
        >
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className={`w-8 h-8 mb-3 transition-colors ${
            isDragging ? 'text-[var(--emotion-color)]' : 'text-zinc-500 group-hover:text-zinc-300'
          }`} />
          <h3 className="text-sm font-medium text-white group-hover:text-[var(--emotion-color)] transition-colors mb-1">
            拖放本地音频或点击上传
          </h3>
          <p className="text-[10px] text-zinc-500 max-w-[240px] leading-relaxed font-sans">
            文件全程在您自己的浏览器本地处理。
          </p>
        </div>

        {/* Stream URL Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">网络音频流 (URL Audio Stream)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="https://example.com/audio.mp3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.02] hover:bg-white/[0.03] border border-white/5 rounded-xl text-white outline-none focus:border-[var(--emotion-color)] transition-all duration-300 font-sans"
              />
            </div>
            <button
              onClick={handleAddUrl}
              className="px-4 bg-[var(--emotion-color)] text-black text-sm font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all outline-none duration-300 cursor-pointer"
            >
              连接
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">
            支持 CORS 状态为公开的网络 MP3/WAV 直链。
          </p>
        </div>

        {/* Synthesizer presets */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-[var(--emotion-color)]" />
            合成器预加载 (Procedural Synthesizers)
          </label>
          <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
            无数据请求，利用 Web Audio API 在浏览器本地生成。
          </p>

          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              onClick={() => addSynthSound('ambient', '深海浮潜 (Deep Drone)')}
              className="p-3 text-left bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] rounded-xl text-xs text-zinc-200 transition-all cursor-pointer"
            >
              <div className="font-medium text-white mb-0.5">深海浮潜</div>
              <div className="text-[9px] text-zinc-500">平稳、深沉声学织体</div>
            </button>
            <button
              onClick={() => addSynthSound('sine', '太空白音 (Space Bell)')}
              className="p-3 text-left bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] rounded-xl text-xs text-zinc-200 transition-all cursor-pointer"
            >
              <div className="font-medium text-white mb-0.5">太空白音</div>
              <div className="text-[9px] text-zinc-500">柔润、清脆敲击音阶</div>
            </button>
            <button
              onClick={() => addSynthSound('binaural', '阿尔法脑波 (Alpha Study)')}
              className="p-3 text-left bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] rounded-xl text-xs text-zinc-200 transition-all cursor-pointer"
            >
              <div className="font-medium text-white mb-0.5">阿尔法脑波</div>
              <div className="text-[9px] text-zinc-500">双耳节拍、专注声疗</div>
            </button>
            <button
              onClick={() => addSynthSound('chill', '林间落雨 (Forest Rain)')}
              className="p-3 text-left bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] rounded-xl text-xs text-zinc-200 transition-all cursor-pointer"
            >
              <div className="font-medium text-white mb-0.5">林间落雨</div>
              <div className="text-[9px] text-zinc-500">白噪音、自然松弛波形</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
