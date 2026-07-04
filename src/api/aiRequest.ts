/**
 * 前端统一调用封装，含电台主持、双语字幕两个快捷方法
 */

const BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions/aiProxy' 
  : '/api/proxy'; // Falls back to local dev server route

export interface GenerateScriptParams {
  context: 'intro' | 'news' | 'welcome';
  trackName?: string;
  emotion?: string;
  localTime?: string;
  aiMode?: 'dj' | 'assistant';
  provider?: string;
}

export interface TranscribeParams {
  audioBase64: string;
  provider?: string;
}

export const requestAI = async (action: string, payload: any, provider: string = 'gemini') => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload, provider }),
  });

  if (!response.ok) {
    throw new Error(\`AI Request Failed: \${response.statusText}\`);
  }

  return response.json();
};

export const getAIHostScript = async (params: GenerateScriptParams) => {
  const { provider, ...payload } = params;
  const res = await requestAI('host_generate', payload, provider);
  return res.text;
};

export const getVoiceTTS = async (text: string, provider: string = 'gemini') => {
  const res = await requestAI('host_tts', { text }, provider);
  return res.audio;
};

export const getBilingualSubtitle = async (params: TranscribeParams) => {
  const { provider, audioBase64 } = params;
  const res = await requestAI('transcribe', { audioBase64 }, provider);
  return res as { original: string; translation: string };
};

export const getHostMood = async (payload: { weatherCode?: number, isDay?: boolean, temperature?: number }) => {
  return requestAI('host_mood', payload, 'local');
};
