/**
 * 游戏状态 Hook
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Position, SkillType, GameMove } from '../types/game';
import { getSocket, socketActions } from '../lib/socket';

interface UseGameOptions {
  gameId: string;
  playerColor: 'black' | 'white';
}

interface UseGameReturn {
  gameState: GameState | null;
  isConnected: boolean;
  isAIThinking: boolean;
  lastMove: GameMove | null;
  lastSkillOutcome: string | null;
  error: string | null;
  actions: {
    startGame: () => void;
    placePiece: (pos: Position) => void;
    useSkill: (skillType: SkillType, targetPosition?: Position) => void;
    resign: () => void;
  };
}

export function useGame({ gameId, playerColor }: UseGameOptions): UseGameReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastMove, setLastMove] = useState<GameMove | null>(null);
  const [lastSkillOutcome, setLastSkillOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleGameState = (state: GameState) => {
      setGameState(state);
      setIsAIThinking(false);
    };

    const handleMove = (data: { move: GameMove; state: GameState }) => {
      setGameState(data.state);
      setLastMove(data.move);
      setIsAIThinking(false);
    };

    const handleSkill = (data: { move: GameMove; state: GameState; outcome?: string }) => {
      setGameState(data.state);
      setLastMove(data.move);
      setLastSkillOutcome(data.outcome || null);
      setIsAIThinking(false);
      // 3秒后清除技能结果提示
      setTimeout(() => setLastSkillOutcome(null), 3000);
    };

    const handleGameEnd = (data: { winner: string; reason: string; state: GameState }) => {
      setGameState(data.state);
      setIsAIThinking(false);
    };

    const handleAIThinking = () => {
      setIsAIThinking(true);
    };

    const handleError = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('game:state', handleGameState);
    socket.on('game:move', handleMove);
    socket.on('game:skill', handleSkill);
    socket.on('game:end', handleGameEnd);
    socket.on('ai:thinking', handleAIThinking);
    socket.on('game:error', handleError);

    // 加入游戏
    if (socket.connected) {
      setIsConnected(true);
      socketActions.joinGame(gameId, playerColor);
    } else {
      socket.once('connect', () => {
        socketActions.joinGame(gameId, playerColor);
      });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game:state', handleGameState);
      socket.off('game:move', handleMove);
      socket.off('game:skill', handleSkill);
      socket.off('game:end', handleGameEnd);
      socket.off('ai:thinking', handleAIThinking);
      socket.off('game:error', handleError);
    };
  }, [gameId, playerColor]);

  const actions = {
    startGame: useCallback(() => {
      socketActions.startGame(gameId);
    }, [gameId]),

    placePiece: useCallback((pos: Position) => {
      if (!gameState || gameState.status !== 'playing') return;
      // PvP 模式下由当前回合的玩家操作，PvA/AvA 模式下只有指定颜色可操作
      const actingPlayer = gameState.mode === 'pvp' ? gameState.currentTurn : playerColor;
      if (gameState.currentTurn !== actingPlayer) return;
      socketActions.placePiece(gameId, actingPlayer, pos);
    }, [gameId, playerColor, gameState]),

    useSkill: useCallback((skillType: SkillType, targetPosition?: Position) => {
      if (!gameState || gameState.status !== 'playing') return;
      const actingPlayer = gameState.mode === 'pvp' ? gameState.currentTurn : playerColor;
      if (gameState.currentTurn !== actingPlayer) return;
      socketActions.useSkill(gameId, actingPlayer, skillType, targetPosition);
    }, [gameId, playerColor, gameState]),

    resign: useCallback(() => {
      socketActions.resign(gameId, playerColor);
    }, [gameId, playerColor]),
  };

  return { gameState, isConnected, isAIThinking, lastMove, lastSkillOutcome, error, actions };
}
