/**
 * 五子棋AI决策引擎
 * 支持非标准情况下的智能落子分析
 */

import { Position, BoardState, MoveScore, PieceType } from '../../../shared/types/game.types';
import { BOARD_SIZE, WIN_CONDITION, SCORE_WEIGHTS, DIRECTIONS } from '../../../shared/constants/gameConstants';

export class GobangAI {
  private board: number[][];
  private boardSize: number;

  constructor(boardSize: number = BOARD_SIZE) {
    this.boardSize = boardSize;
    this.board = Array(boardSize).fill(0).map(() => Array(boardSize).fill(PieceType.EMPTY));
  }

  /**
   * 主入口：根据当前棋局推荐最佳落子位置
   */
  public recommendMove(boardState: BoardState): Position | null {
    this.initializeBoard(boardState);

    const allMoves = this.getAllPossibleMoves(boardState);
    if (allMoves.length === 0) {
      return null;
    }

    const scoredMoves = allMoves.map(pos => ({
      position: pos,
      score: this.evaluatePosition(pos, boardState),
      reason: this.getPositionReason(pos, boardState)
    }));

    // 按分数排序，返回最高分的位置
    scoredMoves.sort((a, b) => b.score - a.score);

    console.log('Top 5 moves:');
    scoredMoves.slice(0, 5).forEach((move, i) => {
      console.log(`${i + 1}. (${move.position.x}, ${move.position.y}) - Score: ${move.score} - ${move.reason}`);
    });

    return scoredMoves[0].position;
  }

  /**
   * 初始化棋盘状态
   */
  private initializeBoard(boardState: BoardState): void {
    this.board = Array(this.boardSize).fill(0).map(() => Array(this.boardSize).fill(PieceType.EMPTY));

    // 放置自己的棋子
    boardState.myPieces.forEach(pos => {
      if (this.isValidPosition(pos)) {
        this.board[pos.y][pos.x] = PieceType.BLACK;
      }
    });

    // 放置对手的棋子
    boardState.opponentPieces.forEach(pos => {
      if (this.isValidPosition(pos)) {
        this.board[pos.y][pos.x] = PieceType.WHITE;
      }
    });

    // 标记禁止位置（用特殊值-1表示）
    boardState.blockedPositions.forEach(pos => {
      if (this.isValidPosition(pos)) {
        this.board[pos.y][pos.x] = -1;
      }
    });
  }

  /**
   * 获取所有可能的落子位置
   */
  private getAllPossibleMoves(boardState: BoardState): Position[] {
    const moves: Position[] = [];

    // 如果棋盘为空，返回中心位置
    if (boardState.myPieces.length === 0 && boardState.opponentPieces.length === 0) {
      const center = Math.floor(this.boardSize / 2);
      return [{ x: center, y: center }];
    }

    // 只考虑已有棋子周围的位置（优化搜索空间）
    const searchRadius = 2;
    const candidatePositions = new Set<string>();

    const allPieces = [...boardState.myPieces, ...boardState.opponentPieces];
    allPieces.forEach(piece => {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          const x = piece.x + dx;
          const y = piece.y + dy;
          const pos = { x, y };

          if (this.isValidPosition(pos) && this.board[y][x] === PieceType.EMPTY) {
            candidatePositions.add(`${x},${y}`);
          }
        }
      }
    });

    candidatePositions.forEach(posStr => {
      const [x, y] = posStr.split(',').map(Number);
      moves.push({ x, y });
    });

    return moves;
  }

  /**
   * 评估某个位置的得分
   */
  private evaluatePosition(pos: Position, boardState: BoardState): number {
    let score = 0;

    // 1. 评估进攻得分（自己落子）
    const attackScore = this.evaluateMove(pos, PieceType.BLACK);
    score += attackScore;

    // 2. 评估防守得分（阻止对手）
    const defenseScore = this.evaluateMove(pos, PieceType.WHITE) * 0.9; // 防守稍微降低优先级
    score += defenseScore;

    // 3. 位置得分（靠近中心和已有棋子）
    score += this.getPositionScore(pos, boardState);

    return Math.round(score);
  }

  /**
   * 评估在某个位置落子后的得分
   */
  private evaluateMove(pos: Position, pieceType: PieceType): number {
    let totalScore = 0;

    // 临时放置棋子
    const originalValue = this.board[pos.y][pos.x];
    this.board[pos.y][pos.x] = pieceType;

    // 检查四个方向
    DIRECTIONS.forEach(dir => {
      const pattern = this.getLinePattern(pos, dir, pieceType);
      const score = this.evaluatePattern(pattern, pieceType);
      totalScore += score;
    });

    // 恢复原状
    this.board[pos.y][pos.x] = originalValue;

    return totalScore;
  }

  /**
   * 获取某个方向上的棋型
   */
  private getLinePattern(pos: Position, dir: { dx: number, dy: number }, pieceType: PieceType): number[] {
    const pattern: number[] = [];
    const checkRange = WIN_CONDITION - 1;

    // 向两个方向延伸
    for (let i = -checkRange; i <= checkRange; i++) {
      const x = pos.x + dir.dx * i;
      const y = pos.y + dir.dy * i;

      if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) {
        pattern.push(-1); // 边界
      } else {
        pattern.push(this.board[y][x]);
      }
    }

    return pattern;
  }

  /**
   * 评估棋型得分
   */
  private evaluatePattern(pattern: number[], pieceType: PieceType): number {
    const opponent = pieceType === PieceType.BLACK ? PieceType.WHITE : PieceType.BLACK;
    const center = Math.floor(pattern.length / 2);

    // 统计连续子数
    let consecutive = 0;
    let openEnds = 0;
    let blocks = 0;

    // 向左统计
    let leftCount = 0;
    for (let i = center - 1; i >= 0; i--) {
      if (pattern[i] === pieceType) {
        leftCount++;
      } else {
        if (pattern[i] === PieceType.EMPTY) openEnds++;
        else blocks++;
        break;
      }
    }

    // 向右统计
    let rightCount = 0;
    for (let i = center + 1; i < pattern.length; i++) {
      if (pattern[i] === pieceType) {
        rightCount++;
      } else {
        if (pattern[i] === PieceType.EMPTY) openEnds++;
        else blocks++;
        break;
      }
    }

    consecutive = leftCount + rightCount + 1; // +1 是当前位置

    // 根据棋型评分
    if (consecutive >= 5) {
      return pieceType === PieceType.BLACK ? SCORE_WEIGHTS.WIN : SCORE_WEIGHTS.BLOCK_WIN;
    }

    if (consecutive === 4) {
      if (openEnds === 2) {
        return pieceType === PieceType.BLACK ? SCORE_WEIGHTS.OPEN_FOUR : SCORE_WEIGHTS.BLOCK_OPEN_FOUR;
      } else if (openEnds === 1) {
        return SCORE_WEIGHTS.HALF_FOUR;
      }
    }

    if (consecutive === 3) {
      if (openEnds === 2) {
        return pieceType === PieceType.BLACK ? SCORE_WEIGHTS.OPEN_THREE : SCORE_WEIGHTS.BLOCK_OPEN_THREE;
      } else if (openEnds === 1) {
        return SCORE_WEIGHTS.HALF_THREE;
      }
    }

    if (consecutive === 2 && openEnds >= 1) {
      return SCORE_WEIGHTS.TWO;
    }

    return 0;
  }

  /**
   * 位置得分（靠近中心和已有棋子更好）
   */
  private getPositionScore(pos: Position, boardState: BoardState): number {
    const center = Math.floor(this.boardSize / 2);
    const distanceFromCenter = Math.abs(pos.x - center) + Math.abs(pos.y - center);

    // 中心位置加分
    let score = SCORE_WEIGHTS.POSITION * (this.boardSize - distanceFromCenter);

    // 靠近已有棋子加分
    const allPieces = [...boardState.myPieces, ...boardState.opponentPieces];
    allPieces.forEach(piece => {
      const distance = Math.abs(pos.x - piece.x) + Math.abs(pos.y - piece.y);
      if (distance <= 2) {
        score += SCORE_WEIGHTS.POSITION * (3 - distance);
      }
    });

    return score;
  }

  /**
   * 获取落子原因说明
   */
  private getPositionReason(pos: Position, boardState: BoardState): string {
    const attackScore = this.evaluateMove(pos, PieceType.BLACK);
    const defenseScore = this.evaluateMove(pos, PieceType.WHITE);

    if (attackScore >= SCORE_WEIGHTS.WIN) {
      return '必胜落子（五连）';
    }
    if (defenseScore >= SCORE_WEIGHTS.BLOCK_WIN) {
      return '防守关键点（阻止对手五连）';
    }
    if (attackScore >= SCORE_WEIGHTS.OPEN_FOUR) {
      return '进攻-活四';
    }
    if (defenseScore >= SCORE_WEIGHTS.BLOCK_OPEN_FOUR) {
      return '防守-阻止对手活四';
    }
    if (attackScore >= SCORE_WEIGHTS.OPEN_THREE) {
      return '进攻-活三';
    }
    if (defenseScore >= SCORE_WEIGHTS.BLOCK_OPEN_THREE) {
      return '防守-阻止对手活三';
    }
    if (attackScore >= SCORE_WEIGHTS.HALF_THREE) {
      return '战术-眠三';
    }
    return '位置布局';
  }

  /**
   * 验证位置是否合法
   */
  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.boardSize && pos.y >= 0 && pos.y < this.boardSize;
  }

  /**
   * 打印棋盘状态（调试用）
   */
  public printBoard(): void {
    console.log('\n当前棋盘状态:');
    console.log('  ' + Array.from({ length: this.boardSize }, (_, i) => i.toString().padStart(2)).join(' '));
    this.board.forEach((row, y) => {
      const rowStr = row.map(cell => {
        if (cell === PieceType.BLACK) return '●';
        if (cell === PieceType.WHITE) return '○';
        if (cell === -1) return '✕';
        return '·';
      }).join(' ');
      console.log(y.toString().padStart(2) + ' ' + rowStr);
    });
    console.log();
  }
}
