'use client';

import React from 'react';
import { Skill, SKILL_LIST } from '../types/game';
import SkillCard from './SkillCard';
import { useLang } from './LangContext';

interface SkillDeckProps {
  playerEnergy: number;
  isMyTurn: boolean;
  selectedSkill: Skill | null;
  onSkillSelect: (skill: Skill | null) => void;
}

export default function SkillDeck({ playerEnergy, isMyTurn, selectedSkill, onSkillSelect }: SkillDeckProps) {
  const { t } = useLang();

  const handleSelect = (skill: Skill) => {
    onSkillSelect(selectedSkill?.type === skill.type ? null : skill);
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{t.skillPanel}</h3>
        {selectedSkill && (
          <button onClick={() => onSkillSelect(null)} className="text-xs text-red-400 hover:text-red-300">
            {t.cancelSkill}
          </button>
        )}
        {!selectedSkill && isMyTurn && (
          <span className="text-xs text-slate-500">{t.clickSkill}</span>
        )}
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {SKILL_LIST.map(skill => (
          <SkillCard
            key={skill.type}
            skill={skill}
            playerEnergy={playerEnergy}
            isMyTurn={isMyTurn}
            isSelected={selectedSkill?.type === skill.type}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {selectedSkill && (
        <div className="mt-3 p-2 rounded-lg bg-blue-900/30 border border-blue-700/50">
          <p className="text-xs text-blue-300 font-medium">
            {t.selectedSkillLabel(t.skills[selectedSkill.type]?.name ?? selectedSkill.name)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedSkill.requiresTarget ? t.clickTarget : t.clickConfirm}
          </p>
          {!selectedSkill.requiresTarget && (
            <button
              onClick={() => {
                const event = new CustomEvent('skill:confirm', { detail: selectedSkill });
                window.dispatchEvent(event);
              }}
              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              {t.confirmUse(t.skills[selectedSkill.type]?.name ?? selectedSkill.name)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
