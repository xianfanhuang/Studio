import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleAIRequest } from './core/aiHandler';
import { geminiDriver } from './netlify/functions/aiDrivers/gemini';
import { openaiCompatibleDriver } from './netlify/functions/aiDrivers/openaiCompatible';
import { claudeDriver } from './netlify/functions/aiDrivers/claude';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Centralized AI Proxy Route for local Express server
  // This mirrors the behavior of netlify/functions/aiProxy.ts
  app.post('/api/proxy', async (req, res) => {
    try {
      const { action, provider = 'gemini', payload } = req.body;
      let driver;
      let config: any = {};

      switch (provider) {
        case 'gemini':
          driver = geminiDriver;
          break;
        case 'openai':
        case 'deepseek':
        case '通义':
          driver = openaiCompatibleDriver;
          if (provider === 'deepseek') {
             config = { baseURL: process.env.DEEPSEEK_BASE_URL, apiKey: process.env.DEEPSEEK_API_KEY };
          }
          break;
        case 'claude':
          driver = claudeDriver;
          break;
        default:
          driver = geminiDriver;
      }

      const result = await handleAIRequest({ action, payload }, driver, config);
      res.json(result);
    } catch (error: any) {
      console.error('Express AI Proxy Error:', error);
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  // Keep legacy routes aliased to the proxy for complete backwards compatibility 
  // (In case some part of the app still uses direct fetch without src/api/aiRequest.ts)
  app.post('/api/host/generate', async (req, res) => {
    try {
      const result = await handleAIRequest({ action: 'host_generate', payload: req.body }, geminiDriver, {});
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/host/tts', async (req, res) => {
    try {
      const result = await handleAIRequest({ action: 'host_tts', payload: req.body }, geminiDriver, {});
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const result = await handleAIRequest({ action: 'transcribe', payload: req.body }, geminiDriver, {});
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/host/mood', async (req, res) => {
    try {
      const result = await handleAIRequest({ action: 'host_mood', payload: req.body }, geminiDriver, {});
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/gemini', async (req, res) => {
    try {
      const result = await handleAIRequest({ action: 'generate_code', payload: req.body }, geminiDriver, {});
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
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
