'use client';

import React, { useState, useCallback } from 'react';
import { GameState, Position, PieceType, Skill, SkillType } from '../types/game';

interface BoardProps {
  gameState: GameState;
  playerColor: 'black' | 'white';
  selectedSkill: Skill | null;
  onPlace: (pos: Position) => void;
  onSkillTarget: (pos: Position) => void;
  lastMove?: Position | null;
}

const BOARD_SIZE = 15;
const CELL_SIZE = 36;

export default function Board({
  gameState,
  playerColor,
  selectedSkill,
  onPlace,
  onSkillTarget,
  lastMove,
}: BoardProps) {
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  // PvP 模式下 playerColor 会随 currentTurn 动态变化，所以这里始终正确
  const isMyTurn = gameState.currentTurn === playerColor && gameState.status === 'playing';
  const board = gameState.board;

  const getCellValue = (x: number, y: number): number => {
    if (!board || !board[y]) return 0;
    return board[y][x] ?? 0;
  };

  const isBlocked = useCallback((x: number, y: number) => {
    return gameState.blockedPositions.some(p => p.x === x && p.y === y);
  }, [gameState.blockedPositions]);

  const isSkillBlocked = useCallback((x: number, y: number) => {
    return (gameState.skillBlocks ?? []).some(
      b => b.x === x && b.y === y && gameState.turnNumber <= b.expireTurn
    );
  }, [gameState.skillBlocks, gameState.turnNumber]);

  const isLastMove = (x: number, y: number) => lastMove?.x === x && lastMove?.y === y;

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn) return;
    const pos = { x, y };

    if (selectedSkill) {
      // 使用技能时
      if (selectedSkill.requiresTarget) {
        onSkillTarget(pos);
      }
      return;
    }

    // 普通落子
    if (getCellValue(x, y) === PieceType.EMPTY && !isBlocked(x, y) && !isSkillBlocked(x, y)) {
      onPlace(pos);
    }
  };

  const getCellCursor = (x: number, y: number): string => {
    if (!isMyTurn) return 'cursor-not-allowed';
    const cell = getCellValue(x, y);
    if (selectedSkill) {
      if (selectedSkill.targetType === 'opponent_piece') {
        const opponentType = playerColor === 'black' ? PieceType.WHITE : PieceType.BLACK;
        return cell === opponentType ? 'cursor-crosshair' : 'cursor-not-allowed';
      }
      if (selectedSkill.targetType === 'empty_cell') {
        return cell === PieceType.EMPTY ? 'cursor-crosshair' : 'cursor-not-allowed';
      }
      return 'cursor-crosshair';
    }
    return cell === PieceType.EMPTY && !isBlocked(x, y) && !isSkillBlocked(x, y)
      ? 'cursor-pointer'
      : 'cursor-not-allowed';
  };

  const shouldShowHover = (x: number, y: number): boolean => {
    if (!isMyTurn || !hoverPos || hoverPos.x !== x || hoverPos.y !== y) return false;
    if (selectedSkill) return true;
    return getCellValue(x, y) === PieceType.EMPTY && !isBlocked(x, y) && !isSkillBlocked(x, y);
  };

  // 星位点
  const starPoints = [3, 7, 11].flatMap(y => [3, 7, 11].map(x => ({ x, y })));
  const isStarPoint = (x: number, y: number) => starPoints.some(p => p.x === x && p.y === y);

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative bg-[#1a1a2e] rounded-xl shadow-2xl border border-slate-700/50 p-5"
        style={{ userSelect: 'none' }}
      >
        {/* 坐标标签 - 列 */}
        <div className="flex mb-1 ml-5">
          {Array.from({ length: BOARD_SIZE }, (_, i) => (
            <div key={i} className="text-center text-[10px] text-slate-600" style={{ width: CELL_SIZE }}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* 坐标标签 - 行 */}
          <div className="flex flex-col mr-1">
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <div key={i} className="flex items-center justify-end text-[10px] text-slate-600 pr-1" style={{ height: CELL_SIZE }}>
                {BOARD_SIZE - i}
              </div>
            ))}
          </div>

          {/* 棋盘格 */}
          <div
            className="relative"
            style={{ width: BOARD_SIZE * CELL_SIZE, height: BOARD_SIZE * CELL_SIZE }}
          >
            {/* 棋盘线（绘制在底层） */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={BOARD_SIZE * CELL_SIZE}
              height={BOARD_SIZE * CELL_SIZE}
            >
              {/* 横线 */}
              {Array.from({ length: BOARD_SIZE }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={CELL_SIZE / 2}
                  y1={CELL_SIZE / 2 + i * CELL_SIZE}
                  x2={BOARD_SIZE * CELL_SIZE - CELL_SIZE / 2}
                  y2={CELL_SIZE / 2 + i * CELL_SIZE}
                  stroke="#2d4a7a"
                  strokeWidth="1"
                />
              ))}
              {/* 竖线 */}
              {Array.from({ length: BOARD_SIZE }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={CELL_SIZE / 2 + i * CELL_SIZE}
                  y1={CELL_SIZE / 2}
                  x2={CELL_SIZE / 2 + i * CELL_SIZE}
                  y2={BOARD_SIZE * CELL_SIZE - CELL_SIZE / 2}
                  stroke="#2d4a7a"
                  strokeWidth="1"
                />
              ))}
              {/* 星位 */}
              {starPoints.map(({ x, y }) => (
                <circle
                  key={`star-${x}-${y}`}
                  cx={CELL_SIZE / 2 + x * CELL_SIZE}
                  cy={CELL_SIZE / 2 + y * CELL_SIZE}
                  r={3}
                  fill="#2d4a7a"
                />
              ))}
            </svg>

            {/* 格子和棋子 */}
            {Array.from({ length: BOARD_SIZE }, (_, y) =>
              Array.from({ length: BOARD_SIZE }, (_, x) => {
                const cell = getCellValue(x, y);
                const blocked = isBlocked(x, y);
                const skillBlocked = isSkillBlocked(x, y);
                const isLast = isLastMove(x, y);

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`absolute flex items-center justify-center ${getCellCursor(x, y)}`}
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                    onClick={() => handleCellClick(x, y)}
                    onMouseEnter={() => setHoverPos({ x, y })}
                    onMouseLeave={() => setHoverPos(null)}
                  >
                    {/* 哨兵结界封锁（红色） */}
                    {blocked && cell === PieceType.EMPTY && (
                      <div className="w-5 h-5 border-2 border-red-500/70 rounded-sm bg-red-900/20" />
                    )}

                    {/* 飞沙走石临时封锁（橙色） */}
                    {skillBlocked && cell === PieceType.EMPTY && !blocked && (
                      <div className="w-5 h-5 border-2 border-orange-400/80 rounded-sm bg-orange-900/20 animate-pulse" />
                    )}

                    {/* 棋子 */}
                    {cell !== PieceType.EMPTY && (
                      <div
                        className={`
                          rounded-full piece-enter z-10 relative
                          ${cell === PieceType.BLACK
                            ? 'bg-gradient-to-br from-slate-600 to-slate-900 border border-slate-500'
                            : 'bg-gradient-to-br from-white to-slate-200 border border-slate-300'
                          }
                          ${isLast ? 'ring-2 ring-yellow-400' : ''}
                          ${gameState.winner && (
                            (gameState.winner === 'black' && cell === PieceType.BLACK) ||
                            (gameState.winner === 'white' && cell === PieceType.WHITE)
                          ) ? 'winning-piece' : ''}
                        `}
                        style={{ width: CELL_SIZE * 0.78, height: CELL_SIZE * 0.78 }}
                      />
                    )}

                    {/* 悬停预览 */}
                    {shouldShowHover(x, y) && cell === PieceType.EMPTY && (
                      <div
                        className={`
                          rounded-full opacity-40 z-10 relative
                          ${selectedSkill
                            ? 'bg-red-400 border border-red-300'
                            : playerColor === 'black'
                              ? 'bg-slate-700 border border-slate-500'
                              : 'bg-white border border-slate-300'
                          }
                        `}
                        style={{ width: CELL_SIZE * 0.78, height: CELL_SIZE * 0.78 }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
