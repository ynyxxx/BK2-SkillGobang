/**
 * 游戏常量配置
 */

// 棋盘配置
export const BOARD_SIZE = 15;
export const WIN_CONDITION = 5;

// 能量系统
export const MAX_ENERGY = 10;
export const ENERGY_PER_TURN = 1;
export const ENERGY_THREE_IN_ROW = 1;

// AI评分权重
export const SCORE_WEIGHTS = {
  WIN: 100000,
  BLOCK_WIN: 50000,
  OPEN_FOUR: 10000,
  BLOCK_OPEN_FOUR: 8000,
  HALF_FOUR: 5000,
  OPEN_THREE: 2000,
  BLOCK_OPEN_THREE: 1500,
  HALF_THREE: 500,
  TWO: 100,
  POSITION: 10,
};

// 方向向量
export const DIRECTIONS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
];

// 技能定义 (pure JS objects, no TypeScript enums)
export const SKILLS = {
  dust_and_stone: {
    type: 'dust_and_stone',
    name: '飞沙走石',
    description: '移除对手一枚棋子，该格下一回合无法落子',
    energyCost: 3,
    requiresTarget: true,
    targetType: 'opponent_piece',
  },
  uproot_mount: {
    type: 'uproot_mount',
    name: '力拔山兮',
    description: '50%概率立即获胜；30%概率获得额外一回合；20%概率无效，交给对手',
    energyCost: 5,
    requiresTarget: false,
  },
  polarity_reversal: {
    type: 'polarity_reversal',
    name: '两极反转',
    description: '跳过下一回合，将棋盘上所有黑白棋子互换',
    energyCost: 8,
    requiresTarget: false,
  },
  still_as_pond: {
    type: 'still_as_pond',
    name: '水静如镜',
    description: '阻止对手接下来的2个回合',
    energyCost: 6,
    requiresTarget: false,
  },
  tempo_split: {
    type: 'tempo_split',
    name: '节拍分裂',
    description: '本轮放置2枚棋子，但放弃下一回合',
    energyCost: 5,
    requiresTarget: false,
  },
  sentinel_ward: {
    type: 'sentinel_ward',
    name: '哨兵结界',
    description: '封锁棋盘上指定一格，持续1回合，对手无法落子',
    energyCost: 3,
    requiresTarget: true,
    targetType: 'empty_cell',
  },
};

export const SKILL_LIST = Object.values(SKILLS);

// 游戏超时设置 (ms)
export const GAME_TIMEOUT = 5 * 60 * 1000;
export const TURN_TIMEOUT = 60 * 1000;
