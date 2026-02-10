/**
 * 五子棋AI测试脚本
 * 用于测试和演示AI决策功能
 */

import { GobangAI } from './gobangAI';
import { BoardState, Position } from '../../../shared/types/game.types';

/**
 * 测试用例
 */
function runTestCases() {
  console.log('=== 五子棋AI决策测试 ===\n');

  // 测试1: 简单开局
  console.log('【测试1】开局第一手');
  testCase1();

  // 测试2: 进攻场景 - 可以形成活四
  console.log('\n【测试2】进攻场景 - 形成活四');
  testCase2();

  // 测试3: 防守场景 - 阻止对手获胜
  console.log('\n【测试3】防守场景 - 阻止对手获胜');
  testCase3();

  // 测试4: 带禁手的场景
  console.log('\n【测试4】带禁手位置的场景');
  testCase4();

  // 测试5: 复杂局面
  console.log('\n【测试5】复杂对攻局面');
  testCase5();
}

// 测试1: 开局
function testCase1() {
  const boardState: BoardState = {
    myPieces: [],
    opponentPieces: [],
    blockedPositions: [],
    boardSize: 19
  };

  const ai = new GobangAI(19);
  const move = ai.recommendMove(boardState);
  console.log(`推荐落子: (${move?.x}, ${move?.y})`);
  ai.printBoard();
}

// 测试2: 进攻 - 活四
function testCase2() {
  const boardState: BoardState = {
    myPieces: [
      { x: 9, y: 9 },
      { x: 10, y: 9 },
      { x: 11, y: 9 },
    ],
    opponentPieces: [
      { x: 9, y: 10 },
      { x: 10, y: 10 },
    ],
    blockedPositions: [],
    boardSize: 19
  };

  const ai = new GobangAI(19);
  const move = ai.recommendMove(boardState);
  console.log(`推荐落子: (${move?.x}, ${move?.y})`);
  console.log(`说明: 在(8,9)或(12,9)落子可形成活四`);
  ai.printBoard();
}

// 测试3: 防守 - 阻止对手
function testCase3() {
  const boardState: BoardState = {
    myPieces: [
      { x: 7, y: 7 },
      { x: 8, y: 8 },
    ],
    opponentPieces: [
      { x: 9, y: 9 },
      { x: 10, y: 10 },
      { x: 11, y: 11 },
      { x: 12, y: 12 },
    ],
    blockedPositions: [],
    boardSize: 19
  };

  const ai = new GobangAI(19);
  const move = ai.recommendMove(boardState);
  console.log(`推荐落子: (${move?.x}, ${move?.y})`);
  console.log(`说明: 必须在(8,9)或(13,13)防守，否则对手下一步获胜`);
  ai.printBoard();
}

// 测试4: 带禁手
function testCase4() {
  const boardState: BoardState = {
    myPieces: [
      { x: 9, y: 9 },
      { x: 10, y: 9 },
    ],
    opponentPieces: [
      { x: 9, y: 10 },
    ],
    blockedPositions: [
      { x: 11, y: 9 },  // 禁手位置
      { x: 12, y: 9 },
    ],
    boardSize: 19
  };

  const ai = new GobangAI(19);
  const move = ai.recommendMove(boardState);
  console.log(`推荐落子: (${move?.x}, ${move?.y})`);
  console.log(`说明: (11,9)和(12,9)被禁，AI会选择其他策略`);
  ai.printBoard();
}

// 测试5: 复杂局面
function testCase5() {
  const boardState: BoardState = {
    myPieces: [
      { x: 9, y: 9 },
      { x: 10, y: 10 },
      { x: 11, y: 11 },
      { x: 8, y: 10 },
    ],
    opponentPieces: [
      { x: 9, y: 10 },
      { x: 10, y: 9 },
      { x: 11, y: 8 },
      { x: 10, y: 11 },
    ],
    blockedPositions: [],
    boardSize: 19
  };

  const ai = new GobangAI(19);
  const move = ai.recommendMove(boardState);
  console.log(`推荐落子: (${move?.x}, ${move?.y})`);
  console.log(`说明: 复杂对攻局面，AI需要权衡进攻和防守`);
  ai.printBoard();
}

/**
 * 自定义测试函数
 * @param myPieces 自己的棋子坐标列表
 * @param opponentPieces 对手的棋子坐标列表
 * @param blockedPositions 禁止落子坐标列表
 * @param boardSize 棋盘大小，默认19
 */
export function customTest(
  myPieces: Position[],
  opponentPieces: Position[],
  blockedPositions: Position[] = [],
  boardSize: number = 19
): Position | null {
  console.log('\n=== 自定义测试 ===');
  console.log(`我的棋子: ${JSON.stringify(myPieces)}`);
  console.log(`对手棋子: ${JSON.stringify(opponentPieces)}`);
  console.log(`禁止位置: ${JSON.stringify(blockedPositions)}`);

  const boardState: BoardState = {
    myPieces,
    opponentPieces,
    blockedPositions,
    boardSize
  };

  const ai = new GobangAI(boardSize);
  const move = ai.recommendMove(boardState);

  if (move) {
    console.log(`\n推荐落子位置: (${move.x}, ${move.y})`);
  } else {
    console.log('\n无可用落子位置');
  }

  ai.printBoard();
  return move;
}

// 运行测试
if (require.main === module) {
  runTestCases();

  // 示例：自定义测试
  console.log('\n\n=== 自定义测试示例 ===');
  customTest(
    [{ x: 9, y: 9 }, { x: 10, y: 9 }],  // 我的棋子
    [{ x: 9, y: 10 }],                   // 对手的棋子
    [{ x: 11, y: 9 }]                    // 禁止位置
  );
}
