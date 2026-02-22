/**
 * 技能引擎 - 处理所有技能效果
 */

import { GameState, SkillType, Position, GameMove, PieceType } from '../../../shared/types/game.types';
import { SKILLS } from '../../../shared/constants/gameConstants';

export interface SkillResult {
  success: boolean;
  outcome: string;
  stateChanges: Partial<GameState>;
  extraTurn?: boolean;
  gameEnd?: { winner: 'black' | 'white' | 'draw'; reason: string };
}

export class SkillEngine {
  /**
   * 验证技能使用是否合法
   */
  static validate(
    state: GameState,
    player: 'black' | 'white',
    skillType: SkillType,
    targetPosition?: Position
  ): { valid: boolean; reason?: string } {
    const skill = SKILLS[skillType];
    if (!skill) return { valid: false, reason: '未知技能' };

    const playerState = state.players[player];

    if (playerState.energy < skill.energyCost) {
      return { valid: false, reason: `能量不足，需要 ${skill.energyCost} 点，当前 ${playerState.energy} 点` };
    }

    if (skill.requiresTarget && !targetPosition) {
      return { valid: false, reason: '该技能需要指定目标位置' };
    }

    if (targetPosition) {
      const { x, y } = targetPosition;
      if (x < 0 || x >= state.board.length || y < 0 || y >= state.board.length) {
        return { valid: false, reason: '目标位置超出棋盘范围' };
      }

      if ('targetType' in skill && skill.targetType === 'opponent_piece') {
        const opponent = player === 'black' ? PieceType.WHITE : PieceType.BLACK;
        if (state.board[y][x] !== opponent) {
          return { valid: false, reason: '目标位置没有对手棋子' };
        }
      }

      if ('targetType' in skill && skill.targetType === 'empty_cell') {
        if (state.board[y][x] !== PieceType.EMPTY) {
          return { valid: false, reason: '目标位置不为空' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * 应用技能效果，返回结果
   */
  static apply(
    state: GameState,
    player: 'black' | 'white',
    skillType: SkillType,
    targetPosition?: Position
  ): SkillResult {
    const skill = SKILLS[skillType];
    const newBoard = state.board.map(row => [...row]);
    const newSkippedTurns = { ...state.skippedTurns };
    const newExtraTurns = { ...state.extraTurns };
    const newPlayers = {
      black: { ...state.players.black },
      white: { ...state.players.white },
    };
    const opponent = player === 'black' ? 'white' : 'black';

    // 消耗能量
    newPlayers[player].energy -= skill.energyCost;

    switch (skillType) {
      case SkillType.DUST_AND_STONE: {
        // 移除对手一枚棋子，该格下一回合无法落子
        if (targetPosition) {
          newBoard[targetPosition.y][targetPosition.x] = PieceType.EMPTY;
        }
        const newSkillBlocks = [
          ...state.skillBlocks,
          {
            x: targetPosition!.x,
            y: targetPosition!.y,
            expireTurn: state.turnNumber + 1,
          },
        ];
        return {
          success: true,
          outcome: `飞沙走石！移除了对手位于 (${targetPosition!.x}, ${targetPosition!.y}) 的棋子，该格下一回合封锁`,
          stateChanges: { board: newBoard, players: newPlayers, skillBlocks: newSkillBlocks },
        };
      }

      case SkillType.UPROOT_MOUNT: {
        // 50% 立即获胜, 30% 额外回合, 20% 无效
        const rand = Math.random();
        if (rand < 0.5) {
          return {
            success: true,
            outcome: '力拔山兮！（50%）天命所归，立即获胜！',
            stateChanges: { players: newPlayers },
            gameEnd: { winner: player, reason: '技能"力拔山兮"触发必胜效果' },
          };
        } else if (rand < 0.8) {
          newExtraTurns[player] += 1;
          return {
            success: true,
            outcome: '力拔山兮！（30%）力透山河，获得额外一回合！',
            stateChanges: { players: newPlayers, extraTurns: newExtraTurns },
            extraTurn: true,
          };
        } else {
          return {
            success: true,
            outcome: '力拔山兮！（20%）力竭而返，无效，交给对手',
            stateChanges: { players: newPlayers },
          };
        }
      }

      case SkillType.POLARITY_REVERSAL: {
        // 黑白棋子互换，跳过下一回合
        const size = newBoard.length;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            if (newBoard[y][x] === PieceType.BLACK) {
              newBoard[y][x] = PieceType.WHITE;
            } else if (newBoard[y][x] === PieceType.WHITE) {
              newBoard[y][x] = PieceType.BLACK;
            }
          }
        }
        newSkippedTurns[player] += 1;
        return {
          success: true,
          outcome: '两极反转！棋盘上所有黑白棋子互换，你将跳过下一回合',
          stateChanges: { board: newBoard, players: newPlayers, skippedTurns: newSkippedTurns },
        };
      }

      case SkillType.STILL_AS_POND: {
        // 对手跳过接下来2回合
        newSkippedTurns[opponent] += 2;
        return {
          success: true,
          outcome: `水静如镜！对手将跳过接下来的 2 个回合`,
          stateChanges: { players: newPlayers, skippedTurns: newSkippedTurns },
        };
      }

      case SkillType.TEMPO_SPLIT: {
        // 获得额外落子（2枚），但跳过下一回合
        newExtraTurns[player] += 1;
        newSkippedTurns[player] += 1;
        return {
          success: true,
          outcome: '节拍分裂！本轮可额外再落一子，但将跳过下一回合',
          stateChanges: { players: newPlayers, extraTurns: newExtraTurns, skippedTurns: newSkippedTurns },
          extraTurn: true,
        };
      }

      case SkillType.SENTINEL_WARD: {
        // 封锁指定格子1回合
        const newBlockedPositions = [...state.blockedPositions];
        if (targetPosition) {
          newBlockedPositions.push(targetPosition);
        }
        return {
          success: true,
          outcome: `哨兵结界！封锁了位置 (${targetPosition!.x}, ${targetPosition!.y}) 一回合`,
          stateChanges: { board: newBoard, players: newPlayers, blockedPositions: newBlockedPositions },
        };
      }

      default:
        return {
          success: false,
          outcome: '未知技能',
          stateChanges: {},
        };
    }
  }
}
