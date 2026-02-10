/**
 * 游戏常量配置
 */

// 棋盘配置
export const BOARD_SIZE = 19; // 标准围棋棋盘
export const WIN_CONDITION = 5; // 五子连珠

// AI评分权重
export const SCORE_WEIGHTS = {
  WIN: 100000,           // 必胜（五连）
  BLOCK_WIN: 50000,      // 阻止对手获胜
  OPEN_FOUR: 10000,      // 活四（两端都可延伸）
  BLOCK_OPEN_FOUR: 8000, // 阻止对手活四
  HALF_FOUR: 5000,       // 冲四（一端被堵）
  OPEN_THREE: 2000,      // 活三
  BLOCK_OPEN_THREE: 1500, // 阻止对手活三
  HALF_THREE: 500,       // 眠三
  TWO: 100,              // 连二
  POSITION: 10,          // 位置分（靠近中心）
};

// 方向向量
export const DIRECTIONS = [
  { dx: 1, dy: 0 },   // 水平
  { dx: 0, dy: 1 },   // 垂直
  { dx: 1, dy: 1 },   // 左斜 (\)
  { dx: 1, dy: -1 },  // 右斜 (/)
];
