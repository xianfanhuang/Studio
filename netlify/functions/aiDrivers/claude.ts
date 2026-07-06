export const claudeDriver = async (action: string, payload: any, config: any) => {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is missing');

  if (action === 'host_generate') {
    const { context, trackName, emotion = 'serene', localTime = 'unknown time', aiMode = 'dj' } = payload;
    let prompt = '';
    // ... same prompt logic
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-haiku-20240307',
          max_tokens: 200,
          system: systemInstruction,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) throw new Error(`Claude API Error: ${response.statusText}`);
      const data = await response.json();
      return { text: data.content[0].text };
    } catch (error: any) {
      let fallback = 'Welcome back to Miadio. Relax and enjoy the ambient frequencies.';
      if (context === 'news') fallback = 'Today brings new discoveries in nature and technology. Stay curious.';
      if (context === 'intro' && trackName) fallback = `Up next is a beautiful track, ${trackName}. Let it wash over you.`;
      return { text: fallback, error: error.message };
    }
  }

  throw new Error(`Unsupported action or Claude driver not fully implemented: ${action}`);
};
