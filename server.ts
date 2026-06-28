import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

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
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: context === 'news' ? [{ googleSearch: {} }] : undefined,
          systemInstruction: 'You are a warm, sophisticated, and soothing AI radio host for miadio. Speak elegantly and concisely.',
        }
      });

      res.json({ text: response.text });

    } catch (error: any) {
      console.error('Gemini API Error:', error);
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
      console.error('Gemini TTS Error:', error);
      res.status(500).json({ error: error.message || 'Error occurred.' });
    }
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
