# AI Layer Refactor

## Architecture
- **core/aiHandler.ts**: The universal AI request handler that expects a generic driver.
- **netlify/functions/aiDrivers/**: Contains drivers for Gemini, Claude, and OpenAI-compatible platforms.
- **netlify/functions/aiProxy.ts**: The Netlify serverless function entrypoint.
- **src/api/aiRequest.ts**: The frontend wrapper client that gracefully degrades between local proxy and netlify proxy.
- **server.ts**: Preserves exact behavior as before while routing internally to `core/aiHandler.ts` keeping zero breakage in local preview.

All API keys are strictly separated on the server.
