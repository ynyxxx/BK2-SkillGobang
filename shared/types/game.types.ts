/**
 * 共享游戏类型定义
 */

// 坐标类型
export type Position = {
  x: number;
  y: number;
};

// 棋子类型 (const object for ESM compatibility)
export const PieceType = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2,
} as const;
export type PieceType = (typeof PieceType)[keyof typeof PieceType];

// 棋盘状态 (用于AI)
export type BoardState = {
  myPieces: Position[];
  opponentPieces: Position[];
  blockedPositions: Position[];
  boardSize: number;
};

// 落子建议
export type MoveScore = {
  position: Position;
  score: number;
  reason: string;
};

// 方向
export const Direction = {
  HORIZONTAL: 0,
  VERTICAL: 1,
  DIAGONAL_LEFT: 2,
  DIAGONAL_RIGHT: 3,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

// ========== 技能系统 ==========

export const SkillType = {
  DUST_AND_STONE: 'dust_and_stone',
  UPROOT_MOUNT: 'uproot_mount',
  POLARITY_REVERSAL: 'polarity_reversal',
  STILL_AS_POND: 'still_as_pond',
  TEMPO_SPLIT: 'tempo_split',
  SENTINEL_WARD: 'sentinel_ward',
} as const;
export type SkillType = (typeof SkillType)[keyof typeof SkillType];

export interface Skill {
  type: SkillType;
  name: string;
  description: string;
  energyCost: number;
  requiresTarget: boolean;
  targetType?: 'opponent_piece' | 'empty_cell' | 'any_cell';
}

// ========== 玩家状态 ==========

export interface PlayerState {
  id: string;
  name: string;
  color: 'black' | 'white';
  energy: number;
  maxEnergy: number;
  isAI: boolean;
  aiProvider?: string;
  aiModel?: string;
  isConnected: boolean;
}

// ========== 游戏历史 ==========

export interface GameMove {
  turn: number;
  player: 'black' | 'white';
  type: 'place' | 'skill';
  position?: Position;
  skill?: {
    type: SkillType;
    targetPosition?: Position;
    outcome?: string;
  };
  energyBefore: number;
  energyAfter: number;
  timestamp: number;
}

// ========== 游戏状态机 ==========

export type GameStatus =
  | 'waiting'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'abandoned';

export type TurnPhase =
  | 'TURN_START'
  | 'AWAIT_ACTION'
  | 'RESOLVING_ACTION'
  | 'POST_CHECK'
  | 'ADVANCE_TURN'
  | 'AI_THINKING'
  | 'GAME_END';

// ========== 完整游戏状态 ==========

export interface GameState {
  id: string;
  mode: 'pvp' | 'pva' | 'ava';
  status: GameStatus;
  phase: TurnPhase;
  board: number[][];
  blockedPositions: Position[];
  skillBlocks: { x: number; y: number; expireTurn: number }[];
  players: {
    black: PlayerState;
    white: PlayerState;
  };
  currentTurn: 'black' | 'white';
  turnNumber: number;
  skippedTurns: { black: number; white: number };
  extraTurns: { black: number; white: number };
  polarityReversalPending: boolean;
  winner?: 'black' | 'white' | 'draw';
  winReason?: string;
  moveHistory: GameMove[];
  createdAt: number;
  updatedAt: number;
}

// ========== API 请求/响应 ==========

export interface CreateGameRequest {
  mode: 'pvp' | 'pva' | 'ava';
  aiConfig?: {
    blackAI?: { provider: string; model: string };
    whiteAI?: { provider: string; model: string };
  };
  playerName?: string;
}

export interface CreateGameResponse {
  gameId: string;
  playerColor?: 'black' | 'white';
}
