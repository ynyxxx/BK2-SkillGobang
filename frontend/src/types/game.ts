/**
 * 前端游戏类型定义
 */

export type Position = { x: number; y: number };

export const PieceType = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2,
} as const;
export type PieceType = (typeof PieceType)[keyof typeof PieceType];

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

export interface PlayerState {
  id: string;
  name: string;
  color: 'black' | 'white';
  energy: number;
  maxEnergy: number;
  isAI: boolean;
  aiProvider?: string;
  isConnected: boolean;
}

export interface GameMove {
  turn: number;
  player: 'black' | 'white';
  type: 'place' | 'skill';
  position?: Position;
  skill?: { type: SkillType; targetPosition?: Position; outcome?: string };
  energyBefore: number;
  energyAfter: number;
  timestamp: number;
}

export type GameStatus = 'waiting' | 'ready' | 'playing' | 'paused' | 'finished' | 'abandoned';
export type TurnPhase = 'TURN_START' | 'AWAIT_ACTION' | 'RESOLVING_ACTION' | 'POST_CHECK' | 'ADVANCE_TURN' | 'AI_THINKING' | 'GAME_END';

export interface GameState {
  id: string;
  mode: 'pvp' | 'pva' | 'ava';
  status: GameStatus;
  phase: TurnPhase;
  board: number[][];
  blockedPositions: Position[];
  skillBlocks: { x: number; y: number; expireTurn: number }[];
  players: { black: PlayerState; white: PlayerState };
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

// 技能配置
export const SKILLS_CONFIG: Record<string, Skill> = {
  dust_and_stone: {
    type: 'dust_and_stone', name: '飞沙走石',
    description: '移除对手一枚棋子，该格下一回合无法落子', energyCost: 3,
    requiresTarget: true, targetType: 'opponent_piece',
  },
  uproot_mount: {
    type: 'uproot_mount', name: '力拔山兮',
    description: '50%立即获胜 / 30%额外回合 / 20%无效', energyCost: 5,
    requiresTarget: false,
  },
  polarity_reversal: {
    type: 'polarity_reversal', name: '两极反转',
    description: '跳过下一回合，棋盘黑白棋子全部互换', energyCost: 8,
    requiresTarget: false,
  },
  still_as_pond: {
    type: 'still_as_pond', name: '水静如镜',
    description: '阻止对手接下来的2个回合', energyCost: 6,
    requiresTarget: false,
  },
  tempo_split: {
    type: 'tempo_split', name: '节拍分裂',
    description: '本轮可额外落一子，但放弃下一回合', energyCost: 5,
    requiresTarget: false,
  },
  sentinel_ward: {
    type: 'sentinel_ward', name: '哨兵结界',
    description: '封锁一格一回合，对手无法在此落子', energyCost: 3,
    requiresTarget: true, targetType: 'empty_cell',
  },
};

export const SKILL_LIST: Skill[] = Object.values(SKILLS_CONFIG);
