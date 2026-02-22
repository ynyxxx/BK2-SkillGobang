'use client';

import React from 'react';
import { PlayerState } from '../types/game';
import { useI18n } from './I18nProvider';

interface EnergyBarProps {
  player: PlayerState;
  isCurrentTurn: boolean;
  isAIThinking?: boolean;
}

export default function EnergyBar({ player, isCurrentTurn, isAIThinking }: EnergyBarProps) {
  const { t } = useI18n();
  const pct = Math.round((player.energy / player.maxEnergy) * 100);

  const barColor = isCurrentTurn
    ? player.color === 'black' ? 'bg-slate-300' : 'bg-amber-300'
    : 'bg-slate-600';

  return (
    <div className={`rounded-xl p-3 transition-all duration-300 ${isCurrentTurn ? 'ring-2 ring-blue-400 bg-slate-800/80' : 'bg-slate-900/60'}`}>
      <div className="flex items-center gap-3">
        {/* 棋子颜色标识 */}
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
          ${player.color === 'black'
            ? 'bg-slate-900 border-slate-400'
            : 'bg-white border-amber-300'
          }`}>
          {player.isAI && (
            <span className="text-xs">🤖</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate text-slate-200">
              {player.name}
              {isCurrentTurn && (
                <span className="ml-2 text-xs text-blue-400">
                  {isAIThinking ? t('energy.thinking') : t('energy.acting')}
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400 ml-2 shrink-0">
              {player.energy}/{player.maxEnergy}
            </span>
          </div>

          {/* 能量条 */}
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* 能量点显示 */}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {Array.from({ length: player.maxEnergy }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < player.energy
                    ? isCurrentTurn ? 'bg-blue-400' : 'bg-slate-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
