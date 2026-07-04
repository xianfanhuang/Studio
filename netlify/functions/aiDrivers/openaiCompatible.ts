export const openaiCompatibleDriver = async (action: string, payload: any, config: any) => {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  const baseURL = config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  if (!apiKey) throw new Error('API key is missing for OpenAI compatible driver');

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
       ? 'You are the intelligent soul of "miadio"—a helpful, deeply empathetic, and soothing personal assistant. Speak to the user like a sophisticated, understanding friend. Your tone is warm, polite, and incredibly human. Keep it concise, elegant, and immersive. If speaking in Chinese, use a gentle and poetic tone.'
      : `You are the soul of "miadio"—an exclusive, deeply empathetic, and soothing intelligent entity who acts as the user's personal ambient DJ. You don't just announce tracks; you understand the user's mood and the atmosphere. Speak to them like an intimate, sophisticated friend who is sharing this exact moment in time with them. Your tone is warm, poetic, understanding, and incredibly human. Keep it concise, elegant, and immersive. If speaking in Chinese, use a gentle and poetic broadcast tone.`;

    try {
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
      const data = await response.json();
      return { text: data.choices[0].message.content };
    } catch (error: any) {
      let fallback = 'Welcome back to miadio. Relax and enjoy the ambient frequencies.';
      if (context === 'news') fallback = 'Today brings new discoveries in nature and technology. Stay curious.';
      if (context === 'intro' && trackName) fallback = `Up next is a beautiful track, ${trackName}. Let it wash over you.`;
      return { text: fallback, error: error.message };
    }
  }

  if (action === 'host_tts') {
    // Basic OpenAI TTS support if supported by the provider
    const { text } = payload;
    try {
      const response = await fetch(`${baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.ttsModel || 'tts-1',
          input: text,
          voice: 'nova'
        })
      });
      if (!response.ok) throw new Error('TTS not supported or failed');
      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      return { audio: base64Audio };
    } catch (error: any) {
      throw error;
    }
  }

  if (action === 'transcribe') {
    // OpenAI Whisper or similar
    // Note: OpenAI transcriptions require multipart/form-data. This is a simplified fallback.
    throw new Error('Transcribe action not fully implemented for OpenAI-compatible driver');
  }

  throw new Error(`Unsupported action: ${action}`);
};
