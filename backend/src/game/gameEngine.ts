/**
 * 游戏引擎 - 核心游戏逻辑与状态机
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GameState, Position, SkillType, GameMove,
  PieceType, PlayerState, TurnPhase, GameStatus,
} from '../../../shared/types/game.types';
import {
  BOARD_SIZE, WIN_CONDITION, MAX_ENERGY,
  ENERGY_PER_TURN, ENERGY_THREE_IN_ROW, DIRECTIONS, SKILLS,
} from '../../../shared/constants/gameConstants';
import { SkillEngine } from './skillEngine';

export class GameEngine {
  /**
   * 创建新游戏状态
   */
  static createGame(
    mode: 'pvp' | 'pva' | 'ava',
    blackPlayer: Partial<PlayerState>,
    whitePlayer: Partial<PlayerState>
  ): GameState {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(PieceType.EMPTY));

    const mkPlayer = (color: 'black' | 'white', p: Partial<PlayerState>): PlayerState => ({
      id: p.id || uuidv4(),
      name: p.name || (color === 'black' ? '玩家1' : '玩家2'),
      color,
      energy: 0,
      maxEnergy: MAX_ENERGY,
      isAI: p.isAI || false,
      aiProvider: p.aiProvider,
      aiModel: p.aiModel,
      isConnected: true,
    });

    return {
      id: uuidv4(),
      mode,
      status: 'waiting' as GameStatus,
      phase: 'TURN_START' as TurnPhase,
      board,
      blockedPositions: [],
      skillBlocks: [],
      players: {
        black: mkPlayer('black', blackPlayer),
        white: mkPlayer('white', whitePlayer),
      },
      currentTurn: 'black',
      turnNumber: 1,
      skippedTurns: { black: 0, white: 0 },
      extraTurns: { black: 0, white: 0 },
      polarityReversalPending: false,
      moveHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 开始游戏
   */
  static startGame(state: GameState): GameState {
    const newState = { ...state, status: 'playing' as GameStatus, updatedAt: Date.now() };
    return this.processTurnStart(newState);
  }

  /**
   * 回合开始处理
   */
  static processTurnStart(state: GameState): GameState {
    const player = state.currentTurn;
    const newPlayers = {
      black: { ...state.players.black },
      white: { ...state.players.white },
    };

    // 检查是否需要跳过
    if (state.skippedTurns[player] > 0) {
      const newSkippedTurns = { ...state.skippedTurns };
      newSkippedTurns[player]--;

      // 记录跳过
      const skipMove: GameMove = {
        turn: state.turnNumber,
        player,
        type: 'place',
        energyBefore: newPlayers[player].energy,
        energyAfter: newPlayers[player].energy,
        timestamp: Date.now(),
        skill: { type: SkillType.STILL_AS_POND, outcome: '回合被跳过' },
      };

      return this.advanceTurn({
        ...state,
        players: newPlayers,
        skippedTurns: newSkippedTurns,
        moveHistory: [...state.moveHistory, skipMove],
        updatedAt: Date.now(),
      });
    }

    // 发放能量
    const energyBefore = newPlayers[player].energy;
    newPlayers[player].energy = Math.min(newPlayers[player].energy + ENERGY_PER_TURN, MAX_ENERGY);

    const nextPhase = newPlayers[player].isAI ? 'AI_THINKING' : 'AWAIT_ACTION';

    return {
      ...state,
      players: newPlayers,
      phase: nextPhase as TurnPhase,
      updatedAt: Date.now(),
    };
  }

  /**
   * 放置棋子
   */
  static placePiece(state: GameState, player: 'black' | 'white', pos: Position): {
    newState: GameState;
    valid: boolean;
    reason?: string;
    winDetected?: boolean;
  } {
    if (state.currentTurn !== player) {
      return { newState: state, valid: false, reason: '不是你的回合' };
    }

    const { x, y } = pos;
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
      return { newState: state, valid: false, reason: '位置超出棋盘范围' };
    }

    if (state.board[y][x] !== PieceType.EMPTY) {
      return { newState: state, valid: false, reason: '该位置已有棋子' };
    }

    // 检查永久封锁（哨兵结界）
    const isBlocked = state.blockedPositions.some(p => p.x === x && p.y === y);
    if (isBlocked) {
      return { newState: state, valid: false, reason: '该位置被哨兵结界封锁' };
    }

    // 检查技能临时封锁（飞沙走石）
    const isSkillBlocked = state.skillBlocks.some(
      b => b.x === x && b.y === y && state.turnNumber <= b.expireTurn
    );
    if (isSkillBlocked) {
      return { newState: state, valid: false, reason: '该位置被飞沙走石临时封锁，下一回合方可落子' };
    }

    const pieceColor = player === 'black' ? PieceType.BLACK : PieceType.WHITE;
    const newBoard = state.board.map(row => [...row]);
    newBoard[y][x] = pieceColor;

    const newPlayers = {
      black: { ...state.players.black },
      white: { ...state.players.white },
    };

    // 检查连三奖励
    if (this.hasThreeInRow(newBoard, pos, pieceColor)) {
      newPlayers[player].energy = Math.min(newPlayers[player].energy + ENERGY_THREE_IN_ROW, MAX_ENERGY);
    }

    const move: GameMove = {
      turn: state.turnNumber,
      player,
      type: 'place',
      position: pos,
      energyBefore: state.players[player].energy,
      energyAfter: newPlayers[player].energy,
      timestamp: Date.now(),
    };

    // 清理过期的封锁位置（封锁位置在这个位置被落子后消失，或在回合推进时清理）
    const newBlockedPositions = state.blockedPositions.filter(p => !(p.x === x && p.y === y));

    let newState: GameState = {
      ...state,
      board: newBoard,
      players: newPlayers,
      blockedPositions: newBlockedPositions,
      phase: 'POST_CHECK' as TurnPhase,
      moveHistory: [...state.moveHistory, move],
      updatedAt: Date.now(),
    };

    // 检查胜负
    if (this.checkWin(newBoard, pos, pieceColor)) {
      newState = {
        ...newState,
        status: 'finished' as GameStatus,
        phase: 'GAME_END' as TurnPhase,
        winner: player,
        winReason: '五子连珠',
      };
      return { newState, valid: true, winDetected: true };
    }

    // 平局检查
    if (this.isBoardFull(newBoard)) {
      newState = {
        ...newState,
        status: 'finished' as GameStatus,
        phase: 'GAME_END' as TurnPhase,
        winner: 'draw' as any,
        winReason: '棋盘已满，平局',
      };
      return { newState, valid: true, winDetected: true };
    }

    // 推进回合
    newState = this.advanceTurn(newState);
    return { newState, valid: true };
  }

  /**
   * 使用技能
   */
  static useSkill(
    state: GameState,
    player: 'black' | 'white',
    skillType: SkillType,
    targetPosition?: Position
  ): {
    newState: GameState;
    valid: boolean;
    reason?: string;
    outcome?: string;
    winDetected?: boolean;
  } {
    if (state.currentTurn !== player) {
      return { newState: state, valid: false, reason: '不是你的回合' };
    }

    const validation = SkillEngine.validate(state, player, skillType, targetPosition);
    if (!validation.valid) {
      return { newState: state, valid: false, reason: validation.reason };
    }

    const result = SkillEngine.apply(state, player, skillType, targetPosition);

    const move: GameMove = {
      turn: state.turnNumber,
      player,
      type: 'skill',
      skill: { type: skillType, targetPosition, outcome: result.outcome },
      energyBefore: state.players[player].energy,
      energyAfter: state.players[player].energy - (SKILLS[skillType]?.energyCost || 0),
      timestamp: Date.now(),
    };

    let newState: GameState = {
      ...state,
      ...result.stateChanges,
      moveHistory: [...state.moveHistory, move],
      phase: 'POST_CHECK' as TurnPhase,
      updatedAt: Date.now(),
    };

    // 处理游戏结束
    if (result.gameEnd) {
      newState = {
        ...newState,
        status: 'finished' as GameStatus,
        phase: 'GAME_END' as TurnPhase,
        winner: result.gameEnd.winner,
        winReason: result.gameEnd.reason,
      };
      return { newState, valid: true, outcome: result.outcome, winDetected: true };
    }

    // 检查极性反转后的胜负
    if (skillType === SkillType.POLARITY_REVERSAL) {
      const winCheck = this.checkBoardWin(newState.board);
      if (winCheck) {
        newState = {
          ...newState,
          status: 'finished' as GameStatus,
          phase: 'GAME_END' as TurnPhase,
          winner: winCheck,
          winReason: '极性反转后五子连珠',
        };
        return { newState, valid: true, outcome: result.outcome, winDetected: true };
      }
    }

    // 处理额外回合（TEMPO_SPLIT 或 UPROOT_MOUNT 的30%）
    if (result.extraTurn && skillType !== SkillType.TEMPO_SPLIT) {
      // 额外回合：不切换玩家
      newState = {
        ...newState,
        phase: newState.players[player].isAI ? 'AI_THINKING' : 'AWAIT_ACTION' as TurnPhase,
      };
    } else {
      newState = this.advanceTurn(newState);
    }

    return { newState, valid: true, outcome: result.outcome };
  }

  /**
   * 推进到下一个回合
   */
  static advanceTurn(state: GameState): GameState {
    const current = state.currentTurn;
    const opponent = current === 'black' ? 'white' : 'black';

    // 清理当前玩家本回合的封锁（哨兵结界持续1回合）
    // 简单处理：封锁位置在对方使用后才消失
    // 实际按回合计数处理会更复杂，这里简化为使用后永久清除（在placePiece中处理）

    let nextTurn: 'black' | 'white' = opponent;
    let newTurnNumber = state.turnNumber + 1;

    // 清理已过期的技能封锁
    const newSkillBlocks = state.skillBlocks.filter(b => b.expireTurn >= newTurnNumber);

    // 检查额外回合
    if (state.extraTurns[current] > 0) {
      const newExtraTurns = { ...state.extraTurns };
      newExtraTurns[current]--;
      nextTurn = current; // 保持当前玩家

      const nextPhase = state.players[nextTurn].isAI ? 'AI_THINKING' : 'AWAIT_ACTION';
      return this.processTurnStart({
        ...state,
        currentTurn: nextTurn,
        turnNumber: newTurnNumber,
        extraTurns: newExtraTurns,
        skillBlocks: newSkillBlocks,
        phase: nextPhase as TurnPhase,
        updatedAt: Date.now(),
      });
    }

    const nextPhase = state.players[nextTurn].isAI ? 'AI_THINKING' : 'AWAIT_ACTION';
    return this.processTurnStart({
      ...state,
      currentTurn: nextTurn,
      turnNumber: newTurnNumber,
      skillBlocks: newSkillBlocks,
      phase: nextPhase as TurnPhase,
      updatedAt: Date.now(),
    });
  }

  /**
   * 检查指定位置是否形成五连
   */
  static checkWin(board: number[][], pos: Position, pieceType: PieceType): boolean {
    const size = board.length;
    const { x, y } = pos;

    for (const dir of DIRECTIONS) {
      let count = 1;

      for (let i = 1; i < WIN_CONDITION; i++) {
        const nx = x + dir.dx * i;
        const ny = y + dir.dy * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || board[ny][nx] !== pieceType) break;
        count++;
      }
      for (let i = 1; i < WIN_CONDITION; i++) {
        const nx = x - dir.dx * i;
        const ny = y - dir.dy * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || board[ny][nx] !== pieceType) break;
        count++;
      }

      if (count >= WIN_CONDITION) return true;
    }
    return false;
  }

  /**
   * 扫描整个棋盘检查胜负（极性反转后使用）
   */
  static checkBoardWin(board: number[][]): 'black' | 'white' | null {
    const size = board.length;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = board[y][x];
        if (cell === PieceType.EMPTY) continue;
        const pieceType = cell as PieceType;
        if (this.checkWin(board, { x, y }, pieceType)) {
          return pieceType === PieceType.BLACK ? 'black' : 'white';
        }
      }
    }
    return null;
  }

  /**
   * 检查是否形成三连（用于能量奖励）
   */
  static hasThreeInRow(board: number[][], pos: Position, pieceType: PieceType): boolean {
    const size = board.length;
    const { x, y } = pos;

    for (const dir of DIRECTIONS) {
      let count = 1;

      for (let i = 1; i <= 2; i++) {
        const nx = x + dir.dx * i;
        const ny = y + dir.dy * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || board[ny][nx] !== pieceType) break;
        count++;
      }
      for (let i = 1; i <= 2; i++) {
        const nx = x - dir.dx * i;
        const ny = y - dir.dy * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || board[ny][nx] !== pieceType) break;
        count++;
      }

      if (count >= 3) return true;
    }
    return false;
  }

  /**
   * 棋盘是否已满
   */
  static isBoardFull(board: number[][]): boolean {
    return board.every(row => row.every(cell => cell !== PieceType.EMPTY));
  }

  /**
   * 获取棋盘上某种颜色的棋子列表
   */
  static getPieces(board: number[][], pieceType: PieceType): Position[] {
    const pieces: Position[] = [];
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === pieceType) pieces.push({ x, y });
      });
    });
    return pieces;
  }
}
