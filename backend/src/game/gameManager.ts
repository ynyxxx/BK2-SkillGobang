/**
 * 游戏管理器 - 管理所有活跃游戏实例
 */

import { GameState, PlayerState, Position, SkillType } from '../../../shared/types/game.types';
import { GameEngine } from './gameEngine';
import { AIOpponent } from '../llm/aiOpponent';
import { LLMProviderRegistry } from '../llm/llmProvider';

type GameEventCallback = (event: string, data: unknown) => void;

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private eventCallbacks: Map<string, GameEventCallback> = new Map();
  private aiOpponent: AIOpponent;
  private registry: LLMProviderRegistry;
  private aiTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(aiOpponent: AIOpponent, registry: LLMProviderRegistry) {
    this.aiOpponent = aiOpponent;
    this.registry = registry;
  }

  /**
   * 创建新游戏
   */
  createGame(
    mode: 'pvp' | 'pva' | 'ava',
    blackConfig: Partial<PlayerState>,
    whiteConfig: Partial<PlayerState>
  ): GameState {
    const state = GameEngine.createGame(mode, blackConfig, whiteConfig);
    this.games.set(state.id, state);
    return state;
  }

  /**
   * 获取游戏状态
   */
  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * 注册事件回调
   */
  onGameEvent(gameId: string, callback: GameEventCallback): void {
    this.eventCallbacks.set(gameId, callback);
  }

  /**
   * 开始游戏
   */
  startGame(gameId: string): GameState | null {
    const state = this.games.get(gameId);
    if (!state) return null;

    const newState = GameEngine.startGame(state);
    this.games.set(gameId, newState);
    this.emit(gameId, 'game:state', newState);

    // 如果第一个行动方是AI，触发AI思考
    this.triggerAIIfNeeded(gameId, newState);

    return newState;
  }

  /**
   * 玩家放置棋子
   */
  async placePiece(gameId: string, player: 'black' | 'white', pos: Position): Promise<{
    success: boolean;
    state?: GameState;
    reason?: string;
  }> {
    const state = this.games.get(gameId);
    if (!state) return { success: false, reason: '游戏不存在' };
    if (state.status !== 'playing') return { success: false, reason: '游戏未在进行中' };

    const result = GameEngine.placePiece(state, player, pos);
    if (!result.valid) return { success: false, reason: result.reason };

    this.games.set(gameId, result.newState);
    this.emit(gameId, 'game:move', { move: result.newState.moveHistory[result.newState.moveHistory.length - 1], state: result.newState });

    if (result.winDetected) {
      this.emit(gameId, 'game:end', {
        winner: result.newState.winner,
        reason: result.newState.winReason,
        state: result.newState,
      });
    } else {
      this.emit(gameId, 'game:state', result.newState);
      this.triggerAIIfNeeded(gameId, result.newState);
    }

    return { success: true, state: result.newState };
  }

  /**
   * 玩家使用技能
   */
  async useSkill(gameId: string, player: 'black' | 'white', skillType: SkillType, targetPosition?: Position): Promise<{
    success: boolean;
    state?: GameState;
    reason?: string;
    outcome?: string;
  }> {
    const state = this.games.get(gameId);
    if (!state) return { success: false, reason: '游戏不存在' };
    if (state.status !== 'playing') return { success: false, reason: '游戏未在进行中' };

    const result = GameEngine.useSkill(state, player, skillType, targetPosition);
    if (!result.valid) return { success: false, reason: result.reason };

    this.games.set(gameId, result.newState);
    this.emit(gameId, 'game:skill', { move: result.newState.moveHistory[result.newState.moveHistory.length - 1], state: result.newState, outcome: result.outcome });

    if (result.winDetected) {
      this.emit(gameId, 'game:end', {
        winner: result.newState.winner,
        reason: result.newState.winReason,
        state: result.newState,
      });
    } else {
      this.emit(gameId, 'game:state', result.newState);
      this.triggerAIIfNeeded(gameId, result.newState);
    }

    return { success: true, state: result.newState, outcome: result.outcome };
  }

  /**
   * 玩家认输
   */
  resign(gameId: string, player: 'black' | 'white'): GameState | null {
    const state = this.games.get(gameId);
    if (!state) return null;

    const winner = player === 'black' ? 'white' : 'black';
    const newState: GameState = {
      ...state,
      status: 'finished',
      phase: 'GAME_END',
      winner,
      winReason: `${player === 'black' ? '黑方' : '白方'}认输`,
      updatedAt: Date.now(),
    };

    this.games.set(gameId, newState);
    this.emit(gameId, 'game:end', { winner, reason: newState.winReason, state: newState });

    return newState;
  }

  /**
   * 触发AI思考（如果当前是AI回合）
   */
  private triggerAIIfNeeded(gameId: string, state: GameState): void {
    if (state.status !== 'playing') return;
    const player = state.currentTurn;
    if (!state.players[player].isAI) return;

    // 延迟一点触发，让UI先更新
    const timer = setTimeout(async () => {
      this.aiTimers.delete(gameId);
      await this.processAITurn(gameId);
    }, 800);

    this.aiTimers.set(gameId, timer);
    this.emit(gameId, 'ai:thinking', player);
  }

  /**
   * 处理AI回合
   */
  private async processAITurn(gameId: string): Promise<void> {
    const state = this.games.get(gameId);
    if (!state || state.status !== 'playing') return;

    const player = state.currentTurn;
    if (!state.players[player].isAI) return;

    try {
      // 根据玩家配置的 provider 查找对应的 LLM，实现 per-player 模型
      const aiProviderKey = state.players[player].aiProvider;
      const playerProvider = aiProviderKey ? this.registry.get(aiProviderKey) : undefined;
      const action = await this.aiOpponent.decideAction(state, player, playerProvider);

      if (action.type === 'place' && action.position) {
        const result = await this.placePiece(gameId, player, action.position);
        if (!result.success) {
          // AI推荐的位置无效（例如被飞沙走石封锁），降级到兜底落子
          console.warn(`AI place failed (${result.reason}), using fallback`);
          await this.runFallback(gameId, player);
        }
      } else if (action.type === 'skill' && action.skillType) {
        const result = await this.useSkill(gameId, player, action.skillType, action.targetPosition);
        if (!result.success) {
          // 技能使用失败，改为落子
          console.warn(`AI skill failed (${result.reason}), falling back to place`);
          await this.runFallback(gameId, player);
        }
      } else {
        // 未识别行动，兜底
        await this.runFallback(gameId, player);
      }
    } catch (error) {
      console.error(`AI turn error for game ${gameId}:`, error);
      await this.runFallback(gameId, player);
    }
  }

  /**
   * AI兜底落子（GobangAI直接决定，避免游戏卡死）
   */
  private async runFallback(gameId: string, player: 'black' | 'white'): Promise<void> {
    const state = this.games.get(gameId);
    if (!state || state.status !== 'playing') return;

    const fallback = await this.aiOpponent.fallbackMove(state, player);
    if (fallback) {
      const result = await this.placePiece(gameId, player, fallback);
      if (!result.success) {
        console.error(`AI fallback also failed for game ${gameId}: ${result.reason}`);
      }
    } else {
      console.error(`AI has no valid move in game ${gameId}`);
    }
  }

  /**
   * 发送事件
   */
  private emit(gameId: string, event: string, data: unknown): void {
    const cb = this.eventCallbacks.get(gameId);
    if (cb) cb(event, data);
  }

  /**
   * 获取所有游戏列表
   */
  listGames(): { id: string; mode: string; status: string; players: string[] }[] {
    const result: { id: string; mode: string; status: string; players: string[] }[] = [];
    this.games.forEach((state, id) => {
      result.push({
        id,
        mode: state.mode,
        status: state.status,
        players: [state.players.black.name, state.players.white.name],
      });
    });
    return result;
  }

  /**
   * 清理已结束的游戏
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2小时
    this.games.forEach((state, id) => {
      if ((state.status === 'finished' || state.status === 'abandoned') && now - state.updatedAt > maxAge) {
        this.games.delete(id);
        this.eventCallbacks.delete(id);
      }
    });
  }
}
