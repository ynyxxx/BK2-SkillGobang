'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Board from '../../../components/Board';
import SkillDeck from '../../../components/SkillDeck';
import EnergyBar from '../../../components/EnergyBar';
import GameInfo from '../../../components/GameInfo';
import { useGame } from '../../../hooks/useGame';
import { useLang, LangToggle } from '../../../components/LangContext';
import { Skill, SkillType, Position, PieceType } from '../../../types/game';

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const gameId = params.id as string;
  const urlColor = (searchParams.get('color') || 'black') as 'black' | 'white';

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const {
    gameState,
    isConnected,
    isAIThinking,
    lastMove,
    lastSkillOutcome,
    error,
    actions,
  } = useGame({ gameId, playerColor: urlColor });

  const isPvP = gameState?.mode === 'pvp';
  const isAvA = gameState?.mode === 'ava';
  const activeColor = isPvP ? (gameState?.currentTurn ?? urlColor) : urlColor;

  useEffect(() => {
    const handler = (e: Event) => {
      const skill = (e as CustomEvent<Skill>).detail;
      actions.useSkill(skill.type);
      setSelectedSkill(null);
    };
    window.addEventListener('skill:confirm', handler);
    return () => window.removeEventListener('skill:confirm', handler);
  }, [actions]);

  const handleSkillSelect = useCallback((skill: Skill | null) => {
    setSelectedSkill(skill);
  }, []);

  const handleSkillTarget = useCallback((pos: Position) => {
    if (!selectedSkill || !gameState) return;
    if (selectedSkill.targetType === 'opponent_piece') {
      const opponentType = activeColor === 'black' ? PieceType.WHITE : PieceType.BLACK;
      if (gameState.board[pos.y]?.[pos.x] !== opponentType) return;
    }
    if (selectedSkill.targetType === 'empty_cell') {
      if (gameState.board[pos.y]?.[pos.x] !== PieceType.EMPTY) return;
    }
    actions.useSkill(selectedSkill.type, pos);
    setSelectedSkill(null);
  }, [selectedSkill, gameState, activeColor, actions]);

  const handlePlace = useCallback((pos: Position) => {
    setSelectedSkill(null);
    actions.placePiece(pos);
  }, [actions]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-400">
            {isConnected ? t.loadingGame : t.connectingServer}
          </p>
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players[activeColor];
  const opponentColor = activeColor === 'black' ? 'white' : 'black';
  const opponentPlayer = gameState.players[opponentColor];
  const isMyTurn = !isAvA && gameState.status === 'playing' &&
    (isPvP || (gameState.currentTurn === urlColor && !isAIThinking));
  const lastMovePos = lastMove?.position || null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-200 text-sm">←</a>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500 font-mono uppercase">
            {t.modeLabels[gameState.mode]}
          </span>
          {isPvP && gameState.status === 'playing' && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              gameState.currentTurn === 'black'
                ? 'bg-slate-700 text-slate-200'
                : 'bg-white/10 text-white'
            }`}>
              {gameState.players[gameState.currentTurn].name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LangToggle />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500">{isConnected ? t.connected : t.disconnected}</span>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">

        {/* 左侧：玩家信息 + 游戏状态 */}
        <div className="lg:w-64 xl:w-72 space-y-3 order-2 lg:order-1">
          <EnergyBar
            player={opponentPlayer}
            isCurrentTurn={gameState.currentTurn === opponentColor}
            isAIThinking={isAIThinking && gameState.currentTurn === opponentColor}
          />
          <GameInfo
            gameState={gameState}
            isAIThinking={isAIThinking}
            lastSkillOutcome={lastSkillOutcome}
            error={error}
            playerColor={activeColor}
            onResign={actions.resign}
          />
          <EnergyBar
            player={myPlayer}
            isCurrentTurn={gameState.currentTurn === activeColor}
            isAIThinking={false}
          />
        </div>

        {/* 中间：棋盘 */}
        <div className="flex-1 flex items-center justify-center order-1 lg:order-2">
          <div className="space-y-3 w-full flex flex-col items-center">
            {isAIThinking && (
              <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-700/30">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                {t.aiThinkingBanner}
              </div>
            )}

            {selectedSkill && (
              <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-700/30 animate-fade-in">
                <span>⚡</span>
                <span>
                  {t.selectedSkillLabel(t.skills[selectedSkill.type]?.name ?? selectedSkill.name)}
                  {' — '}
                  {selectedSkill.requiresTarget ? t.skillTargetHint : t.clickConfirm}
                </span>
                <button onClick={() => setSelectedSkill(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
              </div>
            )}

            <Board
              gameState={gameState}
              playerColor={activeColor}
              selectedSkill={selectedSkill}
              onPlace={handlePlace}
              onSkillTarget={handleSkillTarget}
              lastMove={lastMovePos}
            />

            <div className="text-xs text-slate-500 text-center">
              {isMyTurn
                ? selectedSkill
                  ? selectedSkill.requiresTarget ? t.skillTargetHint : ''
                  : isPvP
                    ? t.pvpTurnHint(myPlayer.name)
                    : t.myTurnHint
                : isAIThinking
                  ? t.aiAnalyzing
                  : t.waitingFor(opponentPlayer.name)
              }
            </div>
          </div>
        </div>

        {/* 右侧：技能面板 */}
        {gameState.mode !== 'ava' && (
          <div className="lg:w-64 xl:w-72 order-3">
            <SkillDeck
              playerEnergy={myPlayer.energy}
              isMyTurn={isMyTurn && !isAIThinking}
              selectedSkill={selectedSkill}
              onSkillSelect={handleSkillSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
