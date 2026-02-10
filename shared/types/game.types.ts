/**
 * 共享游戏类型定义
 */

// 坐标类型
export type Position = {
  x: number;
  y: number;
};

// 棋子类型
export enum PieceType {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

// 棋盘状态
export type BoardState = {
  myPieces: Position[];      // 自己的棋子位置
  opponentPieces: Position[]; // 对手的棋子位置
  blockedPositions: Position[]; // 禁止落子位置
  boardSize: number;          // 棋盘大小（默认19）
};

// 落子建议
export type MoveScore = {
  position: Position;
  score: number;
  reason: string;  // 落子原因（进攻/防守/战术）
};

// 方向枚举
export enum Direction {
  HORIZONTAL = 0,    // 水平
  VERTICAL = 1,      // 垂直
  DIAGONAL_LEFT = 2, // 左斜 (\)
  DIAGONAL_RIGHT = 3, // 右斜 (/)
}
