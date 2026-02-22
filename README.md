# Skill Gobang (技能五子棋)

CS307 BK2 Team Project — A Gobang game enhanced with an energy system and special skills, featuring an AI opponent powered by your choice of LLM.

## Game Overview

Standard 5-in-a-row Gobang rules apply, plus:

- **Energy System**: Gain 1 energy per turn. Form a 3-in-a-row to gain a bonus energy. Max 10 energy.
- **Skills**: Spend energy to use a special skill instead of placing a stone. Skills can shift the board dramatically.
- **AI Opponent**: Backed by a hybrid GobangAI solver + LLM that can reason about skills.

### Skills

| Skill | Cost | Effect |
|-------|------|--------|
| 烟尘飞石 Dust & Stone | 3 | Remove a targeted opponent's stone |
| 拔山举鼎 Uproot Mount | 5 | 70% chance to remove 2 opponent stones; 30% backfires (remove your own) |
| 阴阳颠倒 Polarity Reversal | 8 | Swap all black/white stones on the board |
| 静如止水 Still as Pond | 6 | Skip opponent's next 2 turns |
| 相变穿越 Phase Shift | 1 | Remove any adjacent stone (cost reduces to 0 if targeting opponent) |
| 分身夺势 Tempo Split | 2 | Place 2 stones this turn, but skip your next turn |
| 守望哨兵 Sentinel Ward | 3 | Block a cell permanently — neither player can place there |

## Project Structure

```
BK2-SkillGobang/
├── shared/               # Types and constants shared between frontend and backend
│   ├── types/
│   │   └── game.types.ts
│   └── constants/
│       └── gameConstants.ts
├── backend/
│   ├── src/
│   │   ├── ai/           # GobangAI solver (position evaluation)
│   │   ├── game/         # Game engine, skill engine, game manager
│   │   ├── llm/          # LLM provider abstraction layer
│   │   │   ├── llmProvider.ts        # Abstract base + registry
│   │   │   ├── openaiProvider.ts     # OpenAI / DeepSeek / custom compatible
│   │   │   ├── claudeProvider.ts     # Anthropic Claude
│   │   │   ├── ollamaProvider.ts     # Local Ollama models
│   │   │   └── aiOpponent.ts         # Hybrid AI decision maker
│   │   ├── mcp/          # MCP server for Claude Desktop integration
│   │   └── server.ts     # Express + Socket.IO server
│   ├── .env              # Environment configuration (edit this)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # Board, SkillDeck, EnergyBar, GameInfo
│   │   ├── hooks/        # useGame (Socket.IO state management)
│   │   ├── lib/          # Socket.IO client singleton
│   │   └── types/        # Frontend type definitions
│   ├── .env.local        # Frontend environment configuration
│   └── package.json
├── scripts/
│   └── setup-mcp.md      # Guide for Claude Desktop MCP integration
└── package.json          # Root scripts (dev, install:all)
```

## Setup

### Prerequisites

- Node.js 18+ (tested on v22)
- npm

### 1. Install Dependencies

```bash
npm run install:all
```

This installs dependencies for both backend and frontend.

### 2. Configure Environment

Edit `backend/.env` to set your AI provider:

```env
# Choose default AI provider: gobang-only | openai | claude | deepseek | ollama
DEFAULT_AI_PROVIDER=gobang-only

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-haiku-4-5-20251001

# DeepSeek (OpenAI-compatible)
DEEPSEEK_API_KEY=sk-...

# Ollama (local, no key needed)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2:7b
```

You can leave API keys blank. Any provider without a valid key will not be registered. `gobang-only` mode (the default) uses only the built-in solver without any LLM calls.

### 3. Start Development Servers

```bash
npm start
```

This concurrently starts:
- Backend at `http://localhost:3001`
- Frontend at `http://localhost:3000`

Or start them separately:

```bash
npm run dev:backend   # backend only
npm run dev:frontend  # frontend only
```

### 4. Play

Open `http://localhost:3000` in your browser.

- **PvP**: Two human players take turns in the same browser tab
- **PvA**: Human (black) vs AI (white) — AI uses the configured LLM provider
- **AvA**: Watch two AI instances play each other

## AI Providers

The AI opponent uses a hybrid approach:

1. **GobangAI solver** analyzes the board and generates the top candidate moves
2. **LLM** receives the board state, candidate moves, available skills, and energy — then decides whether to place a stone or use a skill

| Provider | Key | Description |
|----------|-----|-------------|
| `gobang-only` | none | Pure solver, no LLM calls. Fast and deterministic. |
| `openai` | `OPENAI_API_KEY` | GPT-4o-mini (or any OpenAI model) |
| `claude` | `CLAUDE_API_KEY` | Claude Haiku (or any Claude model) |
| `deepseek` | `DEEPSEEK_API_KEY` | DeepSeek models via their OpenAI-compatible API |
| `ollama` | none | Local models via Ollama (e.g., qwen2:7b, llama3) |

You can also override the AI provider per game from the home page UI.

## MCP Integration (Claude Desktop)

The backend includes an MCP server that exposes the Gobang AI to Claude Desktop:

- `gobang_recommend_move` — recommends the best move given a board state
- `gobang_evaluate_position` — evaluates a specific position's score
- `gobang_get_top_moves` — returns the top N candidate moves

See `scripts/setup-mcp.md` for setup instructions.

To run the MCP server directly:
```bash
cd backend && npm run mcp
```

## REST API

The backend exposes a REST API alongside Socket.IO:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/ai/providers` | List registered AI providers |
| POST | `/api/games` | Create a new game |
| GET | `/api/games/:id` | Get game state |
| POST | `/api/games/:id/start` | Start a game |
| GET | `/api/games` | List all active games |

### Create Game Example

```bash
# PvA game using OpenAI
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{"mode":"pva","playerName":"Alice","aiConfig":{"whiteAI":{"provider":"openai"}}}'
```

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `game:join` | `{gameId, color?}` | Join a game room |
| `game:start` | `{gameId}` | Start the game |
| `game:place` | `{gameId, position, player}` | Place a stone |
| `game:skill` | `{gameId, player, skillType, targetPosition?}` | Use a skill |
| `game:resign` | `{gameId, player}` | Resign |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `game:state` | `GameState` | Full game state update |
| `game:move` | `{position, player, ...}` | A move was made |
| `game:skill_used` | `{skillType, player, result}` | A skill was used |
| `game:end` | `{winner, reason}` | Game over |
| `game:error` | `string` | Error message |

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Socket.IO client
- **Backend**: Node.js, Express, Socket.IO, tsx
- **AI**: Custom GobangAI solver + pluggable LLM providers
- **MCP**: `@modelcontextprotocol/sdk`
- **Shared**: TypeScript types and constants used by both layers
