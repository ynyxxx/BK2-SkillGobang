'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Board from '../../../components/Board';
import SkillDeck from '../../../components/SkillDeck';
import EnergyBar from '../../../components/EnergyBar';
import GameInfo from '../../../components/GameInfo';
import LanguageToggle from '../../../components/LanguageToggle';
import { useI18n } from '../../../components/I18nProvider';
import { useGame } from '../../../hooks/useGame';
import { Skill, SkillType, Position, PieceType } from '../../../types/game';
import { getSkillName } from '../../../lib/i18n';

export default function GamePage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  // 固定颜色：PvA/AvA 时从 URL 读取，PvP 时动态跟随当前回合
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

  // PvP 模式下，始终操控当前回合的玩家
  const isPvP = gameState?.mode === 'pvp';
  const isAvA = gameState?.mode === 'ava';
  const activeColor = isPvP ? (gameState?.currentTurn ?? urlColor) : urlColor;

  // 监听技能确认事件（无需目标的技能）
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

    // 验证目标（基于当前活跃玩家）
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
            {isConnected ? t('game.loadingGame') : t('game.connectingServer')}
          </p>
        </div>
      </div>
    );
  }

  const myPlayer = gameState.players[activeColor];
  const opponentColor = activeColor === 'black' ? 'white' : 'black';
  const opponentPlayer = gameState.players[opponentColor];
  // AvA 观战模式不可操作；PvP 始终可操作；PvA 仅己方回合可操作
  const isMyTurn = !isAvA && gameState.status === 'playing' &&
    (isPvP || (gameState.currentTurn === urlColor && !isAIThinking));
  const lastMovePos = lastMove?.position || null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-200 text-sm">← {t('common.home')}</a>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500 font-mono uppercase">
            {gameState.mode === 'pvp' ? t('mode.pvp') : gameState.mode === 'pva' ? t('mode.pva') : t('mode.ava')}
          </span>
          {/* PvP 模式显示当前操作方 */}
          {isPvP && gameState.status === 'playing' && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              gameState.currentTurn === 'black'
                ? 'bg-slate-700 text-slate-200'
                : 'bg-white/10 text-white'
            }`}>
              {t('game.turnOf', { name: gameState.players[gameState.currentTurn].name })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-500">{isConnected ? t('common.connected') : t('common.connecting')}</span>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">

        {/* 左侧：玩家信息 + 游戏状态 */}
        <div className="lg:w-64 xl:w-72 space-y-3 order-2 lg:order-1">
          {/* 对手信息 */}
          <EnergyBar
            player={opponentPlayer}
            isCurrentTurn={gameState.currentTurn === opponentColor}
            isAIThinking={isAIThinking && gameState.currentTurn === opponentColor}
          />

          {/* 游戏信息 */}
          <GameInfo
            gameState={gameState}
            isAIThinking={isAIThinking}
            lastSkillOutcome={lastSkillOutcome}
            error={error}
            playerColor={activeColor}
            onResign={actions.resign}
          />

          {/* 己方信息 */}
          <EnergyBar
            player={myPlayer}
            isCurrentTurn={gameState.currentTurn === activeColor}
            isAIThinking={false}
          />
        </div>

        {/* 中间：棋盘 */}
        <div className="flex-1 flex items-center justify-center order-1 lg:order-2">
          <div className="space-y-3 w-full flex flex-col items-center">
            {/* AI思考提示 */}
            {isAIThinking && (
              <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-700/30">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                {t('game.aiThinking')}
              </div>
            )}

            {/* 技能选择提示 */}
            {selectedSkill && (
              <div className="flex items-center gap-2 text-sm text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-700/30 animate-fade-in">
                <span>⚡</span>
                <span>{t('game.selectedSkill', { skill: getSkillName(locale, selectedSkill.type) })} — {selectedSkill.requiresTarget ? t('game.selectTarget') : t('game.clickToConfirm')}</span>
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

            {/* 轮次提示 */}
            <div className="text-xs text-slate-500 text-center">
              {isMyTurn
                ? selectedSkill
                  ? selectedSkill.requiresTarget ? t('game.clickTargetOnBoard') : ''
                  : isPvP
                    ? t('game.placeOrSkillPvp', { name: myPlayer.name })
                    : t('game.placeOrSkill')
                : isAIThinking
                  ? t('game.aiAnalyzing')
                  : isPvP
                    ? t('game.waitingForMove', { name: opponentPlayer.name })
                    : t('game.waitingForMove', { name: opponentPlayer.name })
              }
            </div>
          </div>
        </div>

        {/* 右侧：技能面板 */}
        {(gameState.mode !== 'ava') && (
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
