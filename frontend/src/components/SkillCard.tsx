'use client';

import React from 'react';
import { Skill, SkillType } from '../types/game';
import { useLang } from './LangContext';

interface SkillCardProps {
  skill: Skill;
  playerEnergy: number;
  isMyTurn: boolean;
  isSelected: boolean;
  onSelect: (skill: Skill) => void;
}

const SKILL_ICONS: Record<SkillType, string> = {
  [SkillType.DUST_AND_STONE]: '💨',
  [SkillType.UPROOT_MOUNT]: '💪',
  [SkillType.POLARITY_REVERSAL]: '🔄',
  [SkillType.STILL_AS_POND]: '🌊',
  [SkillType.TEMPO_SPLIT]: '✂️',
  [SkillType.SENTINEL_WARD]: '🛡️',
};

const SKILL_CATEGORY: Record<SkillType, string> = {
  [SkillType.DUST_AND_STONE]: 'CONTROL',
  [SkillType.UPROOT_MOUNT]: 'GAMBLE',
  [SkillType.POLARITY_REVERSAL]: 'CHAOS',
  [SkillType.STILL_AS_POND]: 'CONTROL',
  [SkillType.TEMPO_SPLIT]: 'TEMPO',
  [SkillType.SENTINEL_WARD]: 'DEFENSE',
};

const CATEGORY_COLORS: Record<string, string> = {
  CONTROL: 'text-blue-400 bg-blue-900/30 border-blue-700/50',
  GAMBLE: 'text-amber-400 bg-amber-900/30 border-amber-700/50',
  CHAOS: 'text-purple-400 bg-purple-900/30 border-purple-700/50',
  TEMPO: 'text-green-400 bg-green-900/30 border-green-700/50',
  DEFENSE: 'text-cyan-400 bg-cyan-900/30 border-cyan-700/50',
};

export default function SkillCard({ skill, playerEnergy, isMyTurn, isSelected, onSelect }: SkillCardProps) {
  const { t } = useLang();
  const canAfford = playerEnergy >= skill.energyCost;
  const isReady = canAfford && isMyTurn;
  const category = SKILL_CATEGORY[skill.type];
  const categoryColor = CATEGORY_COLORS[category] || 'text-slate-400 bg-slate-800 border-slate-600';
  const skillTr = t.skills[skill.type];

  return (
    <button
      onClick={() => isReady && onSelect(skill)}
      disabled={!isReady}
      className={`
        w-full text-left p-3 rounded-lg border transition-all duration-200
        ${isSelected
          ? 'border-blue-400 bg-blue-900/40 ring-1 ring-blue-400'
          : isReady
            ? `${categoryColor} hover:border-opacity-100 hover:bg-opacity-50 cursor-pointer`
            : 'border-slate-700 bg-slate-800/40 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0 mt-0.5">{SKILL_ICONS[skill.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-100 truncate">
              {skillTr?.name ?? skill.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[category]}`}>
                {category}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {skillTr?.description ?? skill.description}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs font-medium ${canAfford ? 'text-blue-300' : 'text-red-400'}`}>
              {t.costLabel(skill.energyCost)}
            </span>
            {isReady && <span className="text-xs text-green-400 font-medium">{t.available}</span>}
            {!canAfford && (
              <span className="text-xs text-slate-500">{t.needMore(skill.energyCost - playerEnergy)}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
