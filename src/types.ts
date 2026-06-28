export type EmotionType = 'serene' | 'energized' | 'tender' | 'focused';

export interface VisualStyle {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  emotion: EmotionType;
  gpuReq: 'low' | 'medium' | 'high';
  render?: (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    time: number,
    low: number,
    mid: number,
    high: number,
    energy: number,
    data: Uint8Array,
    hue: number
  ) => void;
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

export interface PlaybackState {
  playing: boolean;
  mic: boolean;
  mode: string;
  trackIdx: number;
  playlist: Track[];
  strudelPlaying: boolean;
  devicePerformance: number;
}
