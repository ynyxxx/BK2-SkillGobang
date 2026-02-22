'use client';

import React from 'react';
import { Skill, SkillType, SKILL_LIST } from '../types/game';
import SkillCard from './SkillCard';

interface SkillDeckProps {
  playerEnergy: number;
  isMyTurn: boolean;
  selectedSkill: Skill | null;
  onSkillSelect: (skill: Skill | null) => void;
}

export default function SkillDeck({ playerEnergy, isMyTurn, selectedSkill, onSkillSelect }: SkillDeckProps) {
  const handleSelect = (skill: Skill) => {
    if (selectedSkill?.type === skill.type) {
      onSkillSelect(null); // 取消选择
    } else {
      onSkillSelect(skill);
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">技能卡牌</h3>
        {selectedSkill && (
          <button
            onClick={() => onSkillSelect(null)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            取消选择
          </button>
        )}
        {!selectedSkill && isMyTurn && (
          <span className="text-xs text-slate-500">点击选择技能</span>
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
            已选择：{selectedSkill.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedSkill.requiresTarget
              ? '请点击棋盘选择目标位置'
              : '点击确认按钮使用技能'}
          </p>
          {!selectedSkill.requiresTarget && (
            <button
              onClick={() => {
                // 通过 onSkillSelect 传递 null 但带有特殊标记
                // 实际确认由父组件处理
                const event = new CustomEvent('skill:confirm', { detail: selectedSkill });
                window.dispatchEvent(event);
              }}
              className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              确认使用 {selectedSkill.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
