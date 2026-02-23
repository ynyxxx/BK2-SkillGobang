'use client';

import React from 'react';
import { GameState, GameMove, SkillType } from '../types/game';
import { useLang } from './LangContext';

interface GameInfoProps {
  gameState: GameState;
  isAIThinking: boolean;
  lastSkillOutcome: string | null;
  error: string | null;
  playerColor: 'black' | 'white';
  onResign: () => void;
}

export default function GameInfo({
  gameState,
  isAIThinking,
  lastSkillOutcome,
  error,
  playerColor,
  onResign,
}: GameInfoProps) {
  const { t } = useLang();
  const isMyTurn = gameState.currentTurn === playerColor;
  const currentPlayer = gameState.players[gameState.currentTurn];
  const isFinished = gameState.status === 'finished';

  const getStatusText = () => {
    if (isFinished) {
      if (gameState.winner === 'draw') return t.draw;
      const winnerName = gameState.winner ? gameState.players[gameState.winner].name : '';
      return t.wins(winnerName);
    }
    if (isAIThinking) return t.aiThinkingStatus(currentPlayer.name);
    if (gameState.skippedTurns[gameState.currentTurn] > 0) {
      return t.turnSkipped(currentPlayer.name);
    }
    return isMyTurn ? t.myTurn : t.opponentTurn(currentPlayer.name);
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
          <p className="text-xs text-slate-400">{t.round(gameState.turnNumber)}</p>
        )}
        {!isFinished && (
          <p className="text-xs text-slate-500 mt-0.5">{t.round(gameState.turnNumber)}</p>
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
            {t.opponentSkip(gameState.skippedTurns[gameState.currentTurn === 'black' ? 'white' : 'black'])}
          </p>
        </div>
      )}

      {/* 对局记录 */}
      <div className="bg-slate-900/60 rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.moveHistory}</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentMoves.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-2">{t.noHistory}</p>
          ) : (
            recentMoves.map((move, i) => (
              <MoveEntry key={i} move={move} />
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
          {t.resign}
        </button>
      )}
    </div>
  );
}

function MoveEntry({ move }: { move: GameMove }) {
  const { t } = useLang();
  const color = move.player === 'black' ? '●' : '○';
  const colorClass = move.player === 'black' ? 'text-slate-300' : 'text-amber-300';

  if (move.type === 'place' && move.position) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={colorClass}>{color}</span>
        <span>{t.round(move.turn)}:</span>
        <span className="text-slate-400">
          {t.placeAt(String.fromCharCode(65 + move.position.x), 15 - move.position.y)}
        </span>
      </div>
    );
  }

  if (move.type === 'skill' && move.skill) {
    const skillName = t.skills[move.skill.type]?.name ?? move.skill.type;
    return (
      <div className="flex items-start gap-1.5 text-xs">
        <span className={`shrink-0 ${colorClass}`}>{color}</span>
        <div>
          <span className="text-slate-500">{t.round(move.turn)}: </span>
          <span className="text-purple-400">{t.useSkillLabel} {skillName}</span>
          {move.skill.outcome && (
            <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{move.skill.outcome}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
