/**
 * MCP服务器手动测试脚本
 * 用于在不启动Claude Desktop的情况下测试MCP工具
 */

import { GobangAI } from '../ai/gobangAI.js';
import { BoardState } from '../../../shared/types/game.types.js';

console.log('=== MCP工具测试 ===\n');

// 测试1: gobang_recommend_move
console.log('【测试1】gobang_recommend_move');
const testCase1: BoardState = {
  myPieces: [
    { x: 9, y: 9 },
    { x: 10, y: 9 },
  ],
  opponentPieces: [
    { x: 9, y: 10 },
  ],
  blockedPositions: [],
  boardSize: 19,
};

const ai1 = new GobangAI(19);
const move1 = ai1.recommendMove(testCase1);
console.log('输入:', JSON.stringify(testCase1, null, 2));
console.log('输出:', JSON.stringify({
  success: true,
  recommendedMove: move1,
  message: `推荐落子位置: (${move1?.x}, ${move1?.y})`
}, null, 2));

// 测试2: 带禁手的场景
console.log('\n【测试2】带禁手位置');
const testCase2: BoardState = {
  myPieces: [
    { x: 9, y: 9 },
    { x: 10, y: 9 },
    { x: 11, y: 9 },
  ],
  opponentPieces: [
    { x: 9, y: 10 },
    { x: 10, y: 10 },
  ],
  blockedPositions: [
    { x: 12, y: 9 },
    { x: 8, y: 9 },
  ],
  boardSize: 19,
};

const ai2 = new GobangAI(19);
const move2 = ai2.recommendMove(testCase2);
console.log('输入:', JSON.stringify(testCase2, null, 2));
console.log('输出:', JSON.stringify({
  success: true,
  recommendedMove: move2,
  message: `推荐落子位置: (${move2?.x}, ${move2?.y})`
}, null, 2));

// 测试3: 复杂对攻局面
console.log('\n【测试3】复杂对攻局面');
const testCase3: BoardState = {
  myPieces: [
    { x: 9, y: 9 },
    { x: 10, y: 10 },
    { x: 11, y: 11 },
  ],
  opponentPieces: [
    { x: 9, y: 10 },
    { x: 10, y: 9 },
    { x: 11, y: 8 },
    { x: 12, y: 7 },
  ],
  blockedPositions: [],
  boardSize: 19,
};

const ai3 = new GobangAI(19);
const move3 = ai3.recommendMove(testCase3);
console.log('输入:', JSON.stringify(testCase3, null, 2));
console.log('输出:', JSON.stringify({
  success: true,
  recommendedMove: move3,
  message: `推荐落子位置: (${move3?.x}, ${move3?.y})`
}, null, 2));

console.log('\n=== 测试完成 ===');
console.log('如果上述测试正常输出，说明MCP工具可以正常工作。');
console.log('接下来可以配置Claude Desktop使用这个MCP服务器。');
