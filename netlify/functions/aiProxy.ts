import type { Handler } from '@netlify/functions';
import { handleAIRequest } from '../../core/aiHandler';
import { geminiDriver } from './aiDrivers/gemini';
import { openaiCompatibleDriver } from './aiDrivers/openaiCompatible';
import { claudeDriver } from './aiDrivers/claude';

export const handler: Handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Determine action from URL if it's a legacy route proxy, else use body.action
    let action = body.action;
    if (event.path.includes('/api/host/generate')) action = 'host_generate';
    else if (event.path.includes('/api/host/tts')) action = 'host_tts';
    else if (event.path.includes('/api/transcribe')) action = 'transcribe';
    else if (event.path.includes('/api/host/mood')) action = 'host_mood';
    
    const provider = body.provider || 'gemini';
    // For legacy routes, the payload is the whole body. Otherwise, it's body.payload
    const payload = body.payload ? body.payload : body;

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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Netlify AI Proxy Error:', error);
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
