# Viva — AI voice interview agent

Cross-platform interview booth for **Sarvam Voice Agents**, plus a **Studio** fallback (xAI Grok + mic + TTS).

Works on **Windows, macOS, and Linux** (Node 20+).

## Setup

```bash
cd viva
npm install
```

If a Linux-only optional package still errors on Windows:

```bash
npm install --force
```

Env:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `.env`:

```env
VITE_SARVAM_API_KEY=...
VITE_SARVAM_ORG_ID=...
VITE_SARVAM_WORKSPACE_ID=...
VITE_SARVAM_APP_ID=...

# optional scored debrief
XAI_API_KEY=...
```

Restart `npm run dev` after changing `.env` (Vite only reads env at startup).

## Run

```bash
npm run dev
```

- UI: **http://localhost:8080**
- API: **http://localhost:8787** (proxied as `/api`)

## Use

1. **Open a room** → role, language, length  
2. **Enter studio room** — mic + `XAI_API_KEY`  
3. Or **Connect agent** → Sarvam API key, org ID, workspace ID, agent ID  
   then **Enter with Sarvam**

### Sarvam tips

- Must be a **Voice** agent (not text-only)
- **Commit** a version in the Sarvam dashboard
- Copy IDs from **Deploy with Code** for that agent  
- `App not found for the interaction type` = wrong IDs / text agent / uncommitted draft

## Scripts

| Command | What it does |
|--------|----------------|
| `npm run dev` | Client + API (all platforms) |
| `npm run build` | Production client build |
| `npm start` | Serve built client + API |
| `npm run typecheck` | TypeScript check |

## Notes

- No Linux-only native modules required (`inotify` is overridden)
- Sarvam credentials stay in **browser localStorage**
- Prefer headphones; allow microphone when asked
