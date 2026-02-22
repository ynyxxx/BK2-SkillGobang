/**
 * Socket.IO 客户端连接管理
 */

import { io, Socket } from 'socket.io-client';
import { GameState, GameMove, Position, SkillType } from '../types/game';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// 类型化的事件发送函数
export const socketActions = {
  joinGame: (gameId: string, color?: 'black' | 'white') => {
    getSocket().emit('game:join', { gameId, color });
  },

  startGame: (gameId: string) => {
    getSocket().emit('game:start', { gameId });
  },

  placePiece: (gameId: string, player: 'black' | 'white', position: Position) => {
    getSocket().emit('game:place', { gameId, player, position });
  },

  useSkill: (gameId: string, player: 'black' | 'white', skillType: SkillType, targetPosition?: Position) => {
    getSocket().emit('game:skill', { gameId, player, skillType, targetPosition });
  },

  resign: (gameId: string, player: 'black' | 'white') => {
    getSocket().emit('game:resign', { gameId, player });
  },
};
