import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // API route: proxy Gemini emotional visual rendering requests
  app.post('/api/gemini', async (req, res) => {
    const { prompt, currentEmotion } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is missing on the server. Please add it inside the Secrets panel.' 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `
          The user is feeling: "${prompt}".
          Their current visualizer theme is mapped to emotion: "${currentEmotion || 'serene'}".

          We are running a digital audio visualizer themed "Sonoria" built in React, which has 13 interactive preset visual styles.
          Please assist the user by:
          1. Classifying their emotional prompt into one of our 4 core visual emotions: 'serene', 'focused', 'energized', 'tender'.
          2. Writing a beautiful, innovative Custom HTML5 Canvas 2D Javascript code block that draws a responsive generative visual matching their feeling.
             - The canvas function will be executed inside a requestAnimationFrame loop with: (ctx, W, H, time, low, mid, high, energy, data, hue, flash).
             - "ctx" is a CanvasRenderingContext2D.
             - "W" is canvas.width, "H" is canvas.height. Do NOT redefine or read canvas.width inside the function, ONLY use W and H!
             - "time" is a ticking float in seconds. Use it to rotate, shift or cycle shapes.
             - "low", "mid", "high" are float audio frequencies (0.0 to 1.0).
             - "energy" is overall ambient volume level (0.0 to 1.0).
             - "flash" is a float beat indicator (0.0 to 0.65).
             - "hue" is the core emotion HSL hue angle (0 - 360).
             - "data" is a Uint8Array containing complete byte frequency analysers.

             Structure of the code to write:
             - Start with a trailing layer fade clear: ctx.fillStyle = "rgba(5, 5, 8, 0.12)"; ctx.fillRect(0, 0, W, H);
             - Draw stunning geometric shapes, waveforms, ripples, flower-shaped oscillators, neural lines, or spinning vortexes.
             - Keep it elegant and high-contrast, optimized for floating glass player interfaces on top.
             - Do NOT write outer function wrappers or syntax errors. ONLY write clean, pure ES5/ES6 statements that can be loaded straight as the body of Function("ctx", "W", "H", "time", "low", "mid", "high", "energy", "data", "hue", "flash", "...");
             - Avoid let/const redeclarations of global keywords. Keep it lightweight and fully functional.
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion: {
                type: Type.STRING,
                description: "Must be exactly one of: 'serene', 'focused', 'energized', 'tender'."
              },
              feelingText: {
                type: Type.STRING,
                description: "A warm, deeply empathetic 1-2 sentence response validating their mood and describing the visual art generated."
              },
              canvasCode: {
                type: Type.STRING,
                description: "Pure HTML5 Canvas 2D script body drawing responsive visuals. Exclude backticks, tags, or function declarations."
              }
            },
            required: ['emotion', 'feelingText', 'canvasCode']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);

    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Error occurred while contacting Gemini' });
    }
  });

  // Configure Vite middleware or production static folder mount
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

  // Start full-stack Node container
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sonoria Server v7.5] Core listening securely at http://localhost:${PORT}`);
  });
}

startServer();
