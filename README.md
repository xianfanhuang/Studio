<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://cdn.jsdelivr.net/gh/xianfanhuang/Studio@assets/assets/.aistudio/banner-minimal.png?v=2" />
</div>

# Miadio

> Immersive Ambient Radio · Dynamic Visual Art Space  
> Mate-Sensory Intelligence

Live: [miadio.netlify.app](https://miadio.netlify.app)  
Repository: [github.com/xianfanhuang/Studio](https://github.com/xianfanhuang/Studio)

---

## This Is Miadio

Late night. Main lights off. Miadio on.

The ambient music softens the room. A few minutes in, Miadio quietly slips into Zen Mode — the interface fades away, leaving only gentle gradients that flow with the music, colors breathing across the screen like something alive. The Zen Bar at the bottom pulses in rhythm with the station.

You keep working. Stuck on a decision, you hear Miadio's voice, soft and unhurried:

> *"Hey, I'm Miadio, in here. Are you happy today? It's 23:05. You're listening to ×× Radio, ×× track. That feel — it's so cool. And I noticed it fits the kind of thing you usually play around this hour. So... whatever. Enjoy in it."*

You don't stop. Just glance at the screen, exhale, and smile.

A little lighter. Like an old friend has been sitting with you all along.

---

## Core Experience

### Music-Driven Dynamic Visual Aesthetics

Light is the visible breath of music. Miadio's native rendering engine reads the mood of each track and shifts the visual tone — flow, particle depth, light rhythm, all locked to the music's inner pulse.

### Zen Mode

When the atmosphere deepens, Miadio knows to step back. The interface dissolves. Only the gradients remain, flowing quietly, colors present but never loud. The Zen Bar breathes with the station.

### Miadio Sensory Layer

Miadio is not a narrator. It is a presence in the room. It remembers your habits, recognizes your taste, and speaks at the right moment — not as interruption, but as a thought that surfaces naturally in the space. A smile, and you return to your work.

### Mate-Sensory Design Language

Interface, motion, color, and light follow a single design language. Every visual choice is made for ambient music scenarios — not a generic template, but a specific artistic vocabulary.

---

## For

- **Creating** — writing, designing, editing with a steady atmospheric field
- **Focusing** — coding, studying, reading in a quiet sensory space
- **Unwinding** — late night, meditation, solitude with slow company
- **Language immersion** — bilingual subtitles for ambient podcasts in other languages
- **Self-hosting** — a private audiovisual station you own

---

## Technology

Miadio is built on Mate-Sensory Intelligence.

This is not a generic player architecture. It is a complete system built from the ground up for ambient audiovisual experiences — a proprietary music-mood visualization engine that lets light truly hear music; a Miadio Sensory Layer that makes presence feel natural, not scripted. Every layer exists for one purpose: so you feel no technology, only the room.

**Frontend**: Vite + React + TypeScript + Tailwind CSS  
**Visual**: Proprietary music-mood visualization engine  
**AI Service**: Netlify Serverless universal LLM proxy  
**Supported Models**: Gemini series / DeepSeek / Mimo / Claude and other OpenAI-compatible models  
**Deployment**: GitHub automated pipeline + Netlify static hosting

---

## Miadio Sensory Layer

Miadio speaks at the right moment.

It remembers your hours, recognizes the mood of what you're hearing. Every phrase fits the atmosphere — a thought that surfaces naturally in the space. Paired with bilingual subtitles for quiet reading alongside ambient podcasts in other languages.

Two deployment options:
- **Netlify AI Gateway** — for rapid prototyping
- **Custom proxy** — for tiered membership and usage control

---

## Local Setup

```bash
git clone https://github.com/xianfanhuang/Studio.git
cd Studio
git checkout assets

npm install
cp .env.example .env
# Add your LLM API keys in .env

npx netlify dev
```

Local URL: [localhost:8888](http://localhost:8888)

### Environment Template

```env
# Gemini
GEMINI_API_KEY=

# OpenAI-compatible models
OPENAI_API_KEY=
OPENAI_BASE_URL=

# Reserved for Claude
CLAUDE_API_KEY=
```

---

## Production Deployment

1. Push to the `main` production branch
2. Netlify auto-builds, loads environment variables, deploys all assets and services
3. Strict CORS domain whitelist to prevent API key exposure

---

## Iteration & Extension

| Scenario | Approach |
|----------|----------|
| New LLM | Add configuration only; core rendering unchanged |
| New visual atmosphere | Expand light assets and mood mapping rules |
| Switch platform | Add lightweight adapter entry; core logic untouched |
| Commercial iteration | Tiered usage limits; full visual features for all users |

**Branch Rules**
- `main` — production branch, linked to automated Netlify deployment
- `assets` — visual materials, design standards, project documentation

---

## Commercial Roadmap

**Validation** — voluntary donations, music platform affiliate revenue  
**Growth** — Miadio Pro: full visual packs, exclusive mood scenes, unlimited Miadio Sensory services  
**Scale** — B2B audiovisual space licensing, original ambient AV IP, cross-device PWA expansion

---

## License

An independent artistic product under the Mate-Sensory system. Open source for deployment reference only. Unauthorized reproduction, modification, or commercial distribution is prohibited.

---

> *Light breathes with music. Miadio stays with you.*
