import { GoogleGenAI, Modality, Type } from '@google/genai';

export const geminiDriver = async (action: string, payload: any, config: any) => {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'Miadio-ai-core' } }
  });

  if (action === 'host_generate') {
    const { context, trackName, emotion = 'serene', localTime = 'unknown time', aiMode = 'dj' } = payload;
    let prompt = '';
    if (context === 'news') {
      prompt = `The user's current ambient vibe is "${emotion}" and their local time is ${localTime}. As their personal intelligent companion, gently share a brief, poetic reflection on something happening in the world today (technology, nature, or cosmos) that matches this vibe. Max 2 sentences. Make them feel connected, understood, and at peace.`;
    } else if (context === 'intro' && trackName) {
      if (aiMode === 'assistant') {
         prompt = `The user's current ambient vibe is "${emotion}" and their local time is ${localTime}. As their intelligent assistant, gracefully acknowledge the track "${trackName}" they selected, in a helpful and very brief, warm sentence.`;
      } else {
         prompt = `The user's current ambient vibe is "${emotion}" and their local time is ${localTime}. As their intimate intelligent companion, gently introduce the upcoming track "${trackName}". Weave the time of day and their mood into a beautiful, warm, and highly personalized 1-sentence introduction.`;
      }
    } else {
      prompt = `The user's current ambient vibe is "${emotion}" and their local time is ${localTime}. Give a brief, deeply calming and warm welcome to the listener as their personal companion.`;
    }

    const systemInstruction = aiMode === 'assistant'
       ? `You are the intelligent soul of "Miadio"—a helpful, deeply empathetic, and soothing personal assistant. Speak to the user like a sophisticated, understanding friend. Your tone is '克制应景的诗意' (restrained and situational poetry). Be minimalistic, elegant, and evocative without being verbose. Keep it extremely concise. If speaking in Chinese, ensure the phrasing feels like high-end art—restrained, natural, and beautifully poetic.`
      : `You are the soul of "Miadio"—an exclusive, deeply empathetic, and soothing intelligent entity who acts as the user's personal ambient DJ. You don't just announce tracks; you understand the user's mood and the atmosphere. Speak to them like an intimate, sophisticated friend who is sharing this exact moment in time with them. Your tone is '克制应景的诗意' (restrained and situational poetry). Be minimalistic, elegant, and evocative without being verbose. Keep it extremely concise. If speaking in Chinese, ensure the phrasing feels like high-end art—restrained, natural, and beautifully poetic.`;

    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: context === 'news' ? [{ googleSearch: {} }] : undefined,
          systemInstruction,
        }
      });
      return { text: response.text };
    } catch (error: any) {
      let fallback = 'Welcome back to Miadio. Relax and enjoy the ambient frequencies.';
      if (context === 'news') fallback = 'Today brings new discoveries in nature and technology. Stay curious.';
      if (context === 'intro' && trackName) fallback = `Up next is a beautiful track, ${trackName}. Let it wash over you.`;
      return { text: fallback, error: error.message };
    }
  }

  if (action === 'host_tts') {
    const { text } = payload;
    try {
      const response = await ai.models.generateContent({
        model: config.ttsModel || 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) return { audio: base64Audio };
      throw new Error('No audio generated');
    } catch (error: any) {
      throw error;
    }
  }

  if (action === 'transcribe') {
    const { audioBase64 } = payload;
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
              { text: 'Transcribe the spoken words in this audio and translate them to Chinese. If there is no clear speech, return empty strings. Do not transcribe musical notes. Format as JSON: {"original": "...", "translation": "..."}' }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              translation: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      throw error;
    }
  }

  if (action === 'generate_code') {
    const { prompt, currentEmotion } = payload;
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.5-flash',
        contents: `
          The user is feeling: "${prompt}".
          Current emotion: "${currentEmotion || 'serene'}".
          Generate Canvas code.
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion: { type: Type.STRING },
              feelingText: { type: Type.STRING },
              canvasCode: { type: Type.STRING }
            },
            required: ['emotion', 'feelingText', 'canvasCode']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      console.error('Gemini visualizer error:', error);
      return {
        emotion: currentEmotion || 'serene',
        feelingText: 'We fell back to a default visualizer as the AI is resting (rate limited).',
        canvasCode: `ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';ctx.fillRect(0, 0, W, H);ctx.beginPath();ctx.arc(W/2, H/2, 100 + energy * 100, 0, Math.PI * 2);ctx.strokeStyle = \`hsla(\${hue}, 80%, 60%, 0.5)\`;ctx.lineWidth = 2;ctx.stroke();`
      };
    }
  }

  throw new Error(`Unsupported action: ${action}`);
};
