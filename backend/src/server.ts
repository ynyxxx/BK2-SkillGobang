/**
 * Skill Gobang 后端服务器
 * Express + Socket.IO 提供 REST API 和实时通信
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/gameManager';
import { AIOpponent } from './llm/aiOpponent';
import { LLMProviderRegistry } from './llm/llmProvider';
import { OpenAIProvider, DeepSeekProvider, OpenAICompatProvider } from './llm/openaiProvider';
import { ClaudeProvider } from './llm/claudeProvider';
import { OllamaProvider } from './llm/ollamaProvider';
import { GameState, Position, SkillType } from '../../shared/types/game.types';

// ====== 环境变量 ======
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// 同时支持 CLAUDE_API_KEY 和 ANTHROPIC_API_KEY 两种写法
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
// 阿里云百炼/通义千问（DashScope，兼容 OpenAI 协议）
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'qwen-plus';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:7b';
const DEFAULT_AI_PROVIDER = process.env.DEFAULT_AI_PROVIDER || 'gobang-only';

// ====== 初始化 LLM 提供者 ======
const registry = new LLMProviderRegistry();

if (OPENAI_API_KEY) {
  registry.register('openai', new OpenAIProvider({
    apiKey: OPENAI_API_KEY,
    baseUrl: OPENAI_BASE_URL,
    model: OPENAI_MODEL,
  }));
}

if (CLAUDE_API_KEY) {
  registry.register('claude', new ClaudeProvider({
    apiKey: CLAUDE_API_KEY,
    model: CLAUDE_MODEL,
  }));
}

if (DEEPSEEK_API_KEY) {
  registry.register('deepseek', new DeepSeekProvider({
    apiKey: DEEPSEEK_API_KEY,
    model: DEEPSEEK_MODEL,
  }));
}

if (DASHSCOPE_API_KEY) {
  registry.register('dashscope', new OpenAICompatProvider({
    apiKey: DASHSCOPE_API_KEY,
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: DASHSCOPE_MODEL,
  }));
}

// Ollama 始终注册（本地服务）
registry.register('ollama', new OllamaProvider({
  model: OLLAMA_MODEL,
  baseUrl: OLLAMA_BASE_URL,
}));

// ====== AI 对手 ======
const defaultProvider = registry.get(DEFAULT_AI_PROVIDER);
const aiOpponent = new AIOpponent(defaultProvider);

// ====== 游戏管理器 ======
const gameManager = new GameManager(aiOpponent, registry);

// ====== Express 应用 ======
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ====== REST API 路由 ======

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 获取可用 AI 提供者
app.get('/api/ai/providers', async (_req, res) => {
  const all = registry.list();
  const available = await registry.getAvailable();
  res.json({
    all,
    available,
    default: DEFAULT_AI_PROVIDER,
    providers: all.map(key => ({
      key,
      name: key,
      available: available.includes(key),
      model: registry.get(key)?.model,
    })),
  });
});

// 创建游戏
app.post('/api/games', (req, res) => {
  const { mode = 'pvp', playerName, player2Name, aiConfig } = req.body as {
    mode?: 'pvp' | 'pva' | 'ava';
    playerName?: string;
    player2Name?: string;
    aiConfig?: {
      blackAI?: { provider: string; model?: string };
      whiteAI?: { provider: string; model?: string };
    };
  };

  const blackConfig: Record<string, unknown> = { name: playerName || '玩家1' };
  const whiteConfig: Record<string, unknown> = { name: player2Name || '玩家2' };

  if (mode === 'pva' || mode === 'ava') {
    const whiteAI = aiConfig?.whiteAI || { provider: DEFAULT_AI_PROVIDER };
    whiteConfig.isAI = true;
    whiteConfig.name = `AI (${whiteAI.provider})`;
    whiteConfig.aiProvider = whiteAI.provider;
    whiteConfig.aiModel = whiteAI.model;
  }

  if (mode === 'ava') {
    const blackAI = aiConfig?.blackAI || { provider: DEFAULT_AI_PROVIDER };
    blackConfig.isAI = true;
    blackConfig.name = `AI (${blackAI.provider})`;
    blackConfig.aiProvider = blackAI.provider;
    blackConfig.aiModel = blackAI.model;
  }

  const state = gameManager.createGame(mode, blackConfig as any, whiteConfig as any);

  res.json({
    gameId: state.id,
    mode: state.mode,
    playerColor: mode !== 'ava' ? 'black' : undefined,
  });
});

// 获取游戏状态
app.get('/api/games/:id', (req, res) => {
  const state = gameManager.getGame(req.params.id);
  if (!state) {
    res.status(404).json({ error: '游戏不存在' });
    return;
  }
  res.json(state);
});

// 开始游戏
app.post('/api/games/:id/start', (req, res) => {
  const state = gameManager.startGame(req.params.id);
  if (!state) {
    res.status(404).json({ error: '游戏不存在' });
    return;
  }
  res.json(state);
});

// 列出所有游戏
app.get('/api/games', (_req, res) => {
  res.json(gameManager.listGames());
});

// ====== HTTP 服务器 + Socket.IO ======
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// ====== Socket.IO 事件处理 ======
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let currentGameId: string | null = null;
  let currentPlayer: 'black' | 'white' | null = null;

  // 加入游戏
  socket.on('game:join', (data: { gameId: string; playerName?: string; color?: 'black' | 'white' }) => {
    const { gameId, color } = data;
    const state = gameManager.getGame(gameId);

    if (!state) {
      socket.emit('game:error', '游戏不存在');
      return;
    }

    currentGameId = gameId;
    currentPlayer = color || 'black';
    socket.join(`game:${gameId}`);

    // 注册事件回调（广播给所有该游戏的客户端）
    gameManager.onGameEvent(gameId, (event, eventData) => {
      io.to(`game:${gameId}`).emit(event, eventData);
    });

    socket.emit('game:state', state);
    // 若当前已是 AI 回合（首回合 ai:thinking 在 socket 连接前发出，补发一次）
    if (state.status === 'playing' && state.players[state.currentTurn].isAI) {
      socket.emit('ai:thinking', state.currentTurn);
    }
    console.log(`Player ${socket.id} joined game ${gameId} as ${currentPlayer}`);
  });

  // 开始游戏
  socket.on('game:start', (data: { gameId: string }) => {
    const state = gameManager.startGame(data.gameId);
    if (state) {
      io.to(`game:${data.gameId}`).emit('game:state', state);
    }
  });

  // 放置棋子
  socket.on('game:place', async (data: { gameId: string; position: Position; player: 'black' | 'white' }) => {
    const { gameId, position, player } = data;
    const result = await gameManager.placePiece(gameId, player, position);
    if (!result.success) {
      socket.emit('game:error', result.reason || '落子失败');
    }
  });

  // 使用技能
  socket.on('game:skill', async (data: {
    gameId: string;
    player: 'black' | 'white';
    skillType: SkillType;
    targetPosition?: Position;
  }) => {
    const { gameId, player, skillType, targetPosition } = data;
    const result = await gameManager.useSkill(gameId, player, skillType, targetPosition);
    if (!result.success) {
      socket.emit('game:error', result.reason || '技能使用失败');
    }
  });

  // 认输
  socket.on('game:resign', (data: { gameId: string; player: 'black' | 'white' }) => {
    gameManager.resign(data.gameId, data.player);
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ====== 启动服务器 ======
httpServer.listen(PORT, () => {
  console.log(`\n🎮 Skill Gobang 服务器启动成功！`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO 已就绪`);
  console.log(`\n已注册 LLM 提供者: ${registry.list().join(', ') || '无'}`);
  console.log(`默认 AI 提供者: ${DEFAULT_AI_PROVIDER}\n`);
});

// 定期清理已结束的游戏
setInterval(() => gameManager.cleanup(), 30 * 60 * 1000);
