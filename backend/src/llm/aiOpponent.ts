/**
 * AI 对手 - 混合方案：GobangAI (MCP工具) + LLM 决策
 *
 * 架构：
 * 1. GobangAI 提供最佳落子候选列表
 * 2. LLM 接收游戏状态 + AI候选 + 可用技能，决定行动
 * 3. LLM 返回：使用技能 或 采用某个候选位置落子
 */

import { GameState, Position, SkillType, PieceType } from '../../../shared/types/game.types';
import { SKILLS, BOARD_SIZE } from '../../../shared/constants/gameConstants';
import { GobangAI } from '../ai/gobangAI';
import { LLMProvider } from './llmProvider';

export interface AIAction {
  type: 'place' | 'skill';
  position?: Position;
  skillType?: SkillType;
  targetPosition?: Position;
  reasoning?: string;
}

export class AIOpponent {
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  setProvider(provider: LLMProvider): void {
    this.llmProvider = provider;
  }

  /**
   * 决定AI的行动
   * @param providerOverride 覆盖默认 LLM provider（用于 per-player 配置）
   */
  async decideAction(state: GameState, player: 'black' | 'white', providerOverride?: LLMProvider): Promise<AIAction> {
    const pieceType = player === 'black' ? PieceType.BLACK : PieceType.WHITE;
    const opponentType = player === 'black' ? PieceType.WHITE : PieceType.BLACK;

    // 1. 获取 GobangAI 推荐
    const ai = new GobangAI(state.board.length);
    const myPieces = this.getPieces(state.board, pieceType);
    const opponentPieces = this.getPieces(state.board, opponentType);

    // 合并永久封锁（哨兵结界）和临时封锁（飞沙走石）
    const activeSkillBlocks: Position[] = state.skillBlocks
      .filter(b => state.turnNumber <= b.expireTurn)
      .map(b => ({ x: b.x, y: b.y }));
    const allBlocked = [...state.blockedPositions, ...activeSkillBlocks];

    const boardState = {
      myPieces,
      opponentPieces,
      blockedPositions: allBlocked,
      boardSize: state.board.length,
    };

    const recommendedMove = ai.recommendMove(boardState);

    // 2. 确定使用哪个 LLM provider（优先 per-player 覆盖，其次默认）
    const effectiveProvider = providerOverride ?? this.llmProvider;

    if (!effectiveProvider) {
      return recommendedMove
        ? { type: 'place', position: recommendedMove }
        : { type: 'place', position: { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) } };
    }

    // 3. 构建LLM上下文，让LLM决策
    try {
      const action = await this.llmDecide(state, player, recommendedMove, effectiveProvider);
      return action;
    } catch (error) {
      console.error('LLM decision failed, falling back to GobangAI:', error);
      return recommendedMove
        ? { type: 'place', position: recommendedMove }
        : { type: 'place', position: { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) } };
    }
  }

  /**
   * LLM 决策
   */
  private async llmDecide(
    state: GameState,
    player: 'black' | 'white',
    recommendedMove: Position | null,
    provider: LLMProvider
  ): Promise<AIAction> {
    const playerState = state.players[player];
    const opponent = player === 'black' ? 'white' : 'black';
    const opponentState = state.players[opponent];

    const systemPrompt = `你是技能五子棋游戏中的AI棋手。你控制${player === 'black' ? '黑方' : '白方'}棋子。

游戏规则：
- 标准五子棋：率先连成5子则获胜
- 每回合开始获得1点能量；连成三子可额外获得1点能量
- 可以选择落子或使用技能（消耗能量）
- 使用技能时跳过落子

你必须以JSON格式回复，且只回复JSON，不要有任何额外文字：
{
  "action": "place" | "skill",
  "position": {"x": number, "y": number},  // 仅action=place时需要
  "skillType": string,   // 仅action=skill时需要，可选值：dust_and_stone, uproot_mount, polarity_reversal, still_as_pond, tempo_split, sentinel_ward
  "targetPosition": {"x": number, "y": number},  // 需要目标的技能才填（dust_and_stone填对手棋子坐标，sentinel_ward填空格坐标）
  "reasoning": "简短说明"
}`;

    const availableSkills = Object.entries(SKILLS)
      .filter(([, skill]) => playerState.energy >= skill.energyCost)
      .map(([type, skill]) => `${type}: ${skill.name}（消耗${skill.energyCost}能量）- ${skill.description}`)
      .join('\n');

    const boardStr = this.boardToString(state.board, player);

    const userMessage = `当前棋局：
己方：${player === 'black' ? '黑子(●)' : '白子(○)'}，能量：${playerState.energy}/${playerState.maxEnergy}
对手能量：${opponentState.energy}/${opponentState.maxEnergy}
回合数：${state.turnNumber}

棋盘（. = 空，● = 黑，○ = 白）：
${boardStr}

己方棋子数量：${this.getPieces(state.board, player === 'black' ? PieceType.BLACK : PieceType.WHITE).length}
对手棋子数量：${this.getPieces(state.board, player === 'black' ? PieceType.WHITE : PieceType.BLACK).length}

AI推荐落子位置：${recommendedMove ? `(${recommendedMove.x}, ${recommendedMove.y})` : '无'}

可用技能（能量 >= 消耗量）：
${availableSkills || '（无可用技能）'}

请分析局势，决定最佳行动。`;

    const response = await provider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ]);

    return this.parseAction(response.content, recommendedMove);
  }

  /**
   * 解析LLM返回的行动
   */
  private parseAction(content: string, fallback: Position | null): AIAction {
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      const parsed = JSON.parse(jsonMatch[0]) as {
        action: string;
        position?: { x: number; y: number };
        skillType?: string;
        targetPosition?: { x: number; y: number };
        reasoning?: string;
      };

      if (parsed.action === 'skill' && parsed.skillType) {
        // 验证技能类型有效
        const validSkills = Object.values(SkillType) as string[];
        if (validSkills.includes(parsed.skillType)) {
          return {
            type: 'skill',
            skillType: parsed.skillType as SkillType,
            targetPosition: parsed.targetPosition,
            reasoning: parsed.reasoning,
          };
        }
      }

      if (parsed.action === 'place' && parsed.position) {
        return {
          type: 'place',
          position: { x: Math.round(parsed.position.x), y: Math.round(parsed.position.y) },
          reasoning: parsed.reasoning,
        };
      }
    } catch {
      // 解析失败，使用fallback
    }

    return fallback
      ? { type: 'place', position: fallback }
      : { type: 'place', position: { x: Math.floor(BOARD_SIZE / 2), y: Math.floor(BOARD_SIZE / 2) } };
  }

  /**
   * 备用落子（AI完全失败时使用）
   */
  async fallbackMove(state: GameState, player: 'black' | 'white'): Promise<Position | null> {
    const pieceType = player === 'black' ? PieceType.BLACK : PieceType.WHITE;
    const opponentType = player === 'black' ? PieceType.WHITE : PieceType.BLACK;

    const activeSkillBlocks: Position[] = state.skillBlocks
      .filter(b => state.turnNumber <= b.expireTurn)
      .map(b => ({ x: b.x, y: b.y }));
    const allBlocked = [...state.blockedPositions, ...activeSkillBlocks];

    const ai = new GobangAI(state.board.length);
    const move = ai.recommendMove({
      myPieces: this.getPieces(state.board, pieceType),
      opponentPieces: this.getPieces(state.board, opponentType),
      blockedPositions: allBlocked,
      boardSize: state.board.length,
    });

    if (move) return move;

    // 最后兜底：扫描棋盘找第一个合法空位
    for (let y = 0; y < state.board.length; y++) {
      for (let x = 0; x < state.board.length; x++) {
        if (
          state.board[y][x] === PieceType.EMPTY &&
          !allBlocked.some(p => p.x === x && p.y === y)
        ) {
          return { x, y };
        }
      }
    }
    return null;
  }

  /**
   * 将棋盘转为字符串（便于LLM理解）
   */
  private boardToString(board: number[][], perspective: 'black' | 'white'): string {
    const size = board.length;
    const header = '   ' + Array.from({ length: size }, (_, i) => i.toString().padStart(2)).join('');
    const rows = board.map((row, y) => {
      const cells = row.map(cell => {
        if (cell === PieceType.BLACK) return ' ●';
        if (cell === PieceType.WHITE) return ' ○';
        return ' .';
      }).join('');
      return y.toString().padStart(2) + ' ' + cells;
    });
    return [header, ...rows].join('\n');
  }

  /**
   * 获取指定颜色的棋子位置列表
   */
  private getPieces(board: number[][], pieceType: PieceType): Position[] {
    const pieces: Position[] = [];
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === pieceType) pieces.push({ x, y });
      });
    });
    return pieces;
  }
}
