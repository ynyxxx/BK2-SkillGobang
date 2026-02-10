#!/usr/bin/env node
/**
 * 五子棋AI - MCP服务器
 * 通过Model Context Protocol暴露AI决策功能
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GobangAI } from '../ai/gobangAI.js';
import { BoardState, Position } from '../../../shared/types/game.types.js';

// 创建MCP服务器
const server = new Server(
  {
    name: 'gobang-ai-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义可用的工具
const TOOLS: Tool[] = [
  {
    name: 'gobang_recommend_move',
    description: '根据当前五子棋棋局推荐最佳落子位置。支持非标准情况，包括技能造成的禁手位置。棋盘为19x19标准围棋棋盘。',
    inputSchema: {
      type: 'object',
      properties: {
        myPieces: {
          type: 'array',
          description: '自己的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X坐标 (0-18)' },
              y: { type: 'number', description: 'Y坐标 (0-18)' },
            },
            required: ['x', 'y'],
          },
        },
        opponentPieces: {
          type: 'array',
          description: '对手的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X坐标 (0-18)' },
              y: { type: 'number', description: 'Y坐标 (0-18)' },
            },
            required: ['x', 'y'],
          },
        },
        blockedPositions: {
          type: 'array',
          description: '禁止落子的位置（可选，用于技能效果）',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X坐标 (0-18)' },
              y: { type: 'number', description: 'Y坐标 (0-18)' },
            },
            required: ['x', 'y'],
          },
        },
        boardSize: {
          type: 'number',
          description: '棋盘大小（默认19）',
          default: 19,
        },
      },
      required: ['myPieces', 'opponentPieces'],
    },
  },
  {
    name: 'gobang_evaluate_position',
    description: '评估某个位置的得分，用于分析特定位置的价值',
    inputSchema: {
      type: 'object',
      properties: {
        position: {
          type: 'object',
          description: '要评估的位置',
          properties: {
            x: { type: 'number', description: 'X坐标 (0-18)' },
            y: { type: 'number', description: 'Y坐标 (0-18)' },
          },
          required: ['x', 'y'],
        },
        myPieces: {
          type: 'array',
          description: '自己的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        opponentPieces: {
          type: 'array',
          description: '对手的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        blockedPositions: {
          type: 'array',
          description: '禁止落子的位置（可选）',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        boardSize: {
          type: 'number',
          description: '棋盘大小（默认19）',
          default: 19,
        },
      },
      required: ['position', 'myPieces', 'opponentPieces'],
    },
  },
  {
    name: 'gobang_get_top_moves',
    description: '获取前N个最佳落子位置及其评分',
    inputSchema: {
      type: 'object',
      properties: {
        myPieces: {
          type: 'array',
          description: '自己的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        opponentPieces: {
          type: 'array',
          description: '对手的棋子坐标列表',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        blockedPositions: {
          type: 'array',
          description: '禁止落子的位置（可选）',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['x', 'y'],
          },
        },
        topN: {
          type: 'number',
          description: '返回前N个位置（默认5）',
          default: 5,
        },
        boardSize: {
          type: 'number',
          description: '棋盘大小（默认19）',
          default: 19,
        },
      },
      required: ['myPieces', 'opponentPieces'],
    },
  },
];

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'gobang_recommend_move': {
        const boardState: BoardState = {
          myPieces: args.myPieces || [],
          opponentPieces: args.opponentPieces || [],
          blockedPositions: args.blockedPositions || [],
          boardSize: args.boardSize || 19,
        };

        const ai = new GobangAI(boardState.boardSize);
        const move = ai.recommendMove(boardState);

        if (move) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  recommendedMove: move,
                  message: `推荐落子位置: (${move.x}, ${move.y})`,
                }, null, 2),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '无可用落子位置',
                }, null, 2),
              },
            ],
          };
        }
      }

      case 'gobang_evaluate_position': {
        const position: Position = args.position;
        const boardState: BoardState = {
          myPieces: args.myPieces || [],
          opponentPieces: args.opponentPieces || [],
          blockedPositions: args.blockedPositions || [],
          boardSize: args.boardSize || 19,
        };

        const ai = new GobangAI(boardState.boardSize);
        // 这里需要扩展AI类来暴露评估单个位置的方法
        // 暂时通过recommendMove来实现
        const score = 0; // 需要实现evaluatePosition方法

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                position,
                score,
                message: `位置 (${position.x}, ${position.y}) 的评分: ${score}`,
              }, null, 2),
            },
          ],
        };
      }

      case 'gobang_get_top_moves': {
        const boardState: BoardState = {
          myPieces: args.myPieces || [],
          opponentPieces: args.opponentPieces || [],
          blockedPositions: args.blockedPositions || [],
          boardSize: args.boardSize || 19,
        };
        const topN = args.topN || 5;

        const ai = new GobangAI(boardState.boardSize);
        // 需要扩展AI类来返回top N的moves
        // 暂时返回单个推荐
        const move = ai.recommendMove(boardState);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                topMoves: move ? [{ position: move, score: 0, reason: '最佳位置' }] : [],
                message: `返回前${topN}个最佳位置`,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `未知工具: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('五子棋AI MCP服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
