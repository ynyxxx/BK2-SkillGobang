'use client';

import React from 'react';
import { GameState, GameMove, SkillType } from '../types/game';
import { useI18n } from './I18nProvider';
import { getSkillName } from '../lib/i18n';

interface GameInfoProps {
  gameState: GameState;
  isAIThinking: boolean;
  lastSkillOutcome: string | null;
  error: string | null;
  playerColor: 'black' | 'white';
  onResign: () => void;
}

const SKILL_NAMES: Record<SkillType, string> = {
  [SkillType.DUST_AND_STONE]: '飞沙走石',
  [SkillType.UPROOT_MOUNT]: '力拔山兮',
  [SkillType.POLARITY_REVERSAL]: '两极反转',
  [SkillType.STILL_AS_POND]: '水静如镜',
  [SkillType.TEMPO_SPLIT]: '节拍分裂',
  [SkillType.SENTINEL_WARD]: '哨兵结界',
};

export default function GameInfo({
  gameState,
  isAIThinking,
  lastSkillOutcome,
  error,
  playerColor,
  onResign,
}: GameInfoProps) {
  const { t, locale } = useI18n();
  const isMyTurn = gameState.currentTurn === playerColor;
  const currentPlayer = gameState.players[gameState.currentTurn];
  const isFinished = gameState.status === 'finished';

  const getStatusText = () => {
    if (isFinished) {
      if (gameState.winner === 'draw') return t('gameInfo.draw');
      const winnerName = gameState.winner ? gameState.players[gameState.winner].name : '';
      return t('gameInfo.winner', { name: winnerName });
    }
    if (isAIThinking) return t('gameInfo.thinking', { name: currentPlayer.name });
    if (gameState.skippedTurns[gameState.currentTurn] > 0) {
      return t('gameInfo.turnSkipped', { name: currentPlayer.name });
    }
    return isMyTurn ? t('gameInfo.yourTurn') : t('game.turnOf', { name: currentPlayer.name });
  };

  const recentMoves = [...gameState.moveHistory].reverse().slice(0, 8);

  return (
    <div className="space-y-3">
      {/* 状态栏 */}
      <div className={`rounded-xl p-3 text-center transition-all duration-300 ${
        isFinished
          ? gameState.winner === (playerColor as string)
            ? 'bg-green-900/40 border border-green-600'
            : 'bg-red-900/30 border border-red-700/50'
          : isMyTurn
            ? 'bg-blue-900/30 border border-blue-600/50'
            : 'bg-slate-800/60 border border-slate-700/50'
      }`}>
        <p className="text-sm font-bold text-slate-100">{getStatusText()}</p>
        {gameState.winReason && (
          <p className="text-xs text-slate-400 mt-0.5">{gameState.winReason}</p>
        )}
        {isFinished && !gameState.winReason && (
          <p className="text-xs text-slate-400">{t('gameInfo.round', { round: gameState.turnNumber })}</p>
        )}
        {!isFinished && (
          <p className="text-xs text-slate-500 mt-0.5">{t('gameInfo.round', { round: gameState.turnNumber })}</p>
        )}
      </div>

      {/* 技能结果提示 */}
      {lastSkillOutcome && (
        <div className="rounded-lg p-2 bg-purple-900/40 border border-purple-600/50 animate-fade-in">
          <p className="text-xs text-purple-300">⚡ {lastSkillOutcome}</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg p-2 bg-red-900/40 border border-red-600/50 animate-fade-in">
          <p className="text-xs text-red-300">❌ {error}</p>
        </div>
      )}

      {/* 对手跳过提示 */}
      {!isFinished && gameState.skippedTurns[gameState.currentTurn === 'black' ? 'white' : 'black'] > 0 && (
        <div className="rounded-lg p-2 bg-amber-900/30 border border-amber-700/50">
          <p className="text-xs text-amber-300">
            {t('gameInfo.opponentSkip', { count: gameState.skippedTurns[gameState.currentTurn === 'black' ? 'white' : 'black'] })}
          </p>
        </div>
      )}

      {/* 对局记录 */}
      <div className="bg-slate-900/60 rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('gameInfo.history')}</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentMoves.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-2">{t('gameInfo.noHistory')}</p>
          ) : (
            recentMoves.map((move, i) => (
              <MoveEntry key={i} move={move} locale={locale} t={t} />
            ))
          )}
        </div>
      </div>

      {/* 认输按钮 */}
      {!isFinished && (
        <button
          onClick={onResign}
          className="w-full py-2 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm hover:bg-red-900/50 transition-colors"
        >
          {t('gameInfo.resign')}
        </button>
      )}
    </div>
  );
}

function MoveEntry({
  move,
  locale,
  t,
}: {
  move: GameMove;
  locale: 'zh' | 'en';
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const color = move.player === 'black' ? '●' : '○';
  const colorClass = move.player === 'black' ? 'text-slate-300' : 'text-amber-300';

  if (move.type === 'place' && move.position) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={colorClass}>{color}</span>
        <span className="text-slate-400">
          {t('gameInfo.movePlace', { turn: move.turn, pos: `${String.fromCharCode(65 + move.position.x)}${15 - move.position.y}` })}
        </span>
      </div>
    );
  }

  if (move.type === 'skill' && move.skill) {
    const skillName = getSkillName(locale, move.skill.type);
    return (
      <div className="flex items-start gap-1.5 text-xs">
        <span className={`shrink-0 ${colorClass}`}>{color}</span>
        <div>
          <span className="text-purple-400">
            {t('gameInfo.moveSkill', { turn: move.turn, skill: skillName || move.skill.type })}
          </span>
          {move.skill.outcome && (
            <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{move.skill.outcome}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
