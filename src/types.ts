export type EmotionType = 'serene' | 'energized' | 'tender' | 'focused';

export interface EmotionPalette {
  h: number;
  s: number;
  l: number;
  rgb: [number, number, number];
}

export interface VisualStyle {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  emotion: EmotionType;
  gpuReq: 'low' | 'medium' | 'high';
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  src: string;
  isUrl: boolean;
  isSynthesized?: boolean;
  synthType?: 'sine' | 'ambient' | 'chill' | 'binaural';
}

export interface Subtitle {
  original: string;
  translation: string;
}

export interface AIResponse {
  text?: string;
  audio?: string;
  error?: string;
}

export interface Bands {
  low: number;
  mid: number;
  high: number;
  energy: number;
}

export interface PlaybackState {
  playing: boolean;
  mic: boolean;
  mode: string;
  trackIdx: number;
  playlist: Track[];
  strudelPlaying: boolean;
  devicePerformance: number;
}
