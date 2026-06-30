import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route: AI host text generation (News or Track intro)
  app.post('/api/host/generate', async (req, res) => {
    const { context, trackName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let prompt = '';
      if (context === 'news') {
        prompt = 'You are the AI host of "miadio", a smart ambient radio. Give a very brief (2 sentences max), calming, and poetic news update about technology or nature for today. Keep it gentle and immersive.';
      } else if (context === 'intro' && trackName) {
        prompt = `You are the AI host of "miadio", a smart ambient radio. Introduce the upcoming track "${trackName}" in a gentle, warm, and concise way (1 sentence max).`;
      } else {
        prompt = 'You are the AI host of "miadio". Give a brief, calming welcome to the listener.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          tools: context === 'news' ? [{ googleSearch: {} }] : undefined,
          systemInstruction: 'You are a warm, sophisticated, and soothing AI radio host for miadio. Speak elegantly and concisely.',
        }
      });

      res.json({ text: response.text });

    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429) {
        console.warn('Gemini API Rate Limited - using fallback text.');
      } else {
        console.error('Gemini API Error:', error);
      }
      let fallback = 'Welcome back to miadio. Relax and enjoy the ambient frequencies.';
      if (context === 'news') fallback = 'Today brings new discoveries in nature and technology. Stay curious.';
      if (context === 'intro' && trackName) fallback = `Up next is a beautiful track, ${trackName}. Let it wash over you.`;
      // Return a 200 with fallback text so the frontend can still display something,
      // but include the error message for debugging
      res.json({ text: fallback, error: error.message });
    }
  });

  // API route: TTS generation
  app.post('/api/host/tts', async (req, res) => {
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr for a warm voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(500).json({ error: 'No audio generated.' });
      }

    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429) {
        console.warn('Gemini TTS Rate Limited - frontend will fallback to local synthesis.');
      } else {
        console.error('Gemini TTS Error:', error);
      }
      res.status(429).json({ error: error.message || 'Error occurred.' });
    }
  });

  // API route: Transcribe and translate audio
  app.post('/api/transcribe', async (req, res) => {
    const { audioBase64 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing key' });

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
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
      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API route: AI mood sync based on weather/time
  app.post('/api/host/mood', async (req, res) => {
    const { weatherCode, isDay, temperature } = req.body;
    
    let emotion = 'serene';
    let styleId = 'aurora';
    let msg = 'The ambient atmosphere is calm.';
    
    if (weatherCode !== undefined) {
       if (weatherCode <= 3) {
          if (isDay) {
             emotion = 'focused'; styleId = 'crystal'; msg = 'A bright, clear day. Sharpening frequencies for focus.';
          } else {
             emotion = 'serene'; styleId = 'aurora'; msg = 'A quiet night. Syncing to cosmic serenities.';
          }
       } else if (weatherCode >= 51 && weatherCode <= 67) {
          emotion = 'tender'; styleId = 'liquid'; msg = 'Rainfall detected. Flowing into a tender, liquid state.';
       } else if (weatherCode >= 71 && weatherCode <= 82) {
          emotion = 'serene'; styleId = 'bloom'; msg = 'Snowy conditions. Softening the atmosphere.';
       } else if (weatherCode >= 95) {
          emotion = 'energized'; styleId = 'vortex'; msg = 'Storm energies detected. Enhancing resonance for a vibrant pulse.';
       } else {
          emotion = 'focused'; styleId = 'nebula'; msg = 'Misty conditions. Drifting into a nebula of sound.';
       }
    }
    
    res.json({ emotion, styleId, message: msg });
  });

  // Proxy Gemini emotional visual rendering requests (legacy)
  app.post('/api/gemini', async (req, res) => {
    const { prompt, currentEmotion } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing key' });

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
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
      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error('Gemini visualizer error:', error);
      res.json({
        emotion: currentEmotion || 'serene',
        feelingText: 'We fell back to a default visualizer as the AI is resting (rate limited).',
        canvasCode: `
ctx.fillStyle = 'rgba(5, 5, 8, 0.12)';
ctx.fillRect(0, 0, W, H);
ctx.beginPath();
ctx.arc(W/2, H/2, 100 + energy * 100, 0, Math.PI * 2);
ctx.strokeStyle = \`hsla(\${hue}, 80%, 60%, 0.5)\`;
ctx.lineWidth = 2;
ctx.stroke();
`
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[miadio Server] Listening securely at http://localhost:${PORT}`);
  });
}

startServer();
