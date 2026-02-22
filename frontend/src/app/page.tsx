'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface AIProvider {
  key: string;
  name: string;
  available: boolean;
  model?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [mode, setMode] = useState<'pvp' | 'pva' | 'ava'>('pva');
  const [aiProvider, setAIProvider] = useState('gobang-only');
  const [blackAIProvider, setBlackAIProvider] = useState('gobang-only');
  const [whiteAIProvider, setWhiteAIProvider] = useState('gobang-only');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载可用AI提供者
  React.useEffect(() => {
    fetch(`${BACKEND_URL}/api/ai/providers`)
      .then(r => r.json())
      .then((data: { providers: AIProvider[]; default: string }) => {
        setProviders(data.providers);
        setAIProvider(data.default || 'gobang-only');
      })
      .catch(() => {
        setProviders([{ key: 'gobang-only', name: '仅使用内置AI', available: true }]);
      });
  }, []);

  const createGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          playerName: playerName.trim() || '玩家1',
          player2Name: mode === 'pvp' ? (player2Name.trim() || '玩家2') : undefined,
          aiConfig: mode === 'ava'
            ? { blackAI: { provider: blackAIProvider }, whiteAI: { provider: whiteAIProvider } }
            : { whiteAI: { provider: aiProvider } },
        }),
      });

      if (!response.ok) throw new Error('创建游戏失败');

      const data = await response.json() as { gameId: string; playerColor?: string };

      // 启动游戏
      await fetch(`${BACKEND_URL}/api/games/${data.gameId}/start`, { method: 'POST' });

      router.push(`/game/${data.gameId}?color=${data.playerColor || 'black'}&mode=${mode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建游戏失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            SKILL<br />GOBANG
          </h1>
          <p className="text-slate-400 text-sm">技能五子棋 · CS307 BK Project</p>
        </div>

        {/* 游戏配置卡片 */}
        <div className="bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-700/50 p-6 space-y-5">

          {/* 游戏模式 */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              游戏模式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pvp', label: '人人对战', icon: '👥' },
                { value: 'pva', label: '人机对战', icon: '🤖' },
                { value: 'ava', label: '机机对战', icon: '🔮' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value as 'pvp' | 'pva' | 'ava')}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    mode === value
                      ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                      : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="text-xl mb-0.5">{icon}</div>
                  <div className="text-xs">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 玩家名称 */}
          {mode !== 'ava' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {mode === 'pvp' ? '黑方玩家名称' : '玩家名称'}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder={mode === 'pvp' ? '黑方名字' : '输入你的名字'}
                  maxLength={20}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 text-sm"
                />
              </div>
              {mode === 'pvp' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    白方玩家名称
                  </label>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={e => setPlayer2Name(e.target.value)}
                    placeholder="白方名字"
                    maxLength={20}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* AI 提供者（人机模式） */}
          {mode === 'pva' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                AI 提供者
              </label>
              <AIProviderSelect value={aiProvider} onChange={setAIProvider} providers={providers} />
            </div>
          )}

          {/* AI 提供者（机机模式，黑白独立选择） */}
          {mode === 'ava' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ● 黑方 AI
                </label>
                <AIProviderSelect value={blackAIProvider} onChange={setBlackAIProvider} providers={providers} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  ○ 白方 AI
                </label>
                <AIProviderSelect value={whiteAIProvider} onChange={setWhiteAIProvider} providers={providers} />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 开始按钮 */}
          <button
            onClick={createGame}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-bold text-base transition-all"
          >
            {loading ? '创建中...' : '开始游戏'}
          </button>
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">快速规则</h3>
          <div className="space-y-1.5 text-xs text-slate-500">
            <p>• 率先连成 <span className="text-slate-300">5 子</span>获胜</p>
            <p>• 每回合开始获得 <span className="text-slate-300">1 点能量</span></p>
            <p>• 连成三子额外获得 <span className="text-slate-300">1 点能量</span></p>
            <p>• 可以消耗能量使用技能替代落子</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIProviderSelect({
  value,
  onChange,
  providers,
}: {
  value: string;
  onChange: (v: string) => void;
  providers: AIProvider[];
}) {
  return (
    <>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-400 text-sm"
      >
        <option value="gobang-only">仅使用内置算法 AI（无需 API Key）</option>
        {providers
          .filter(p => p.key !== 'gobang-only')
          .map(p => (
            <option key={p.key} value={p.key} disabled={!p.available}>
              {p.name.toUpperCase()} ({p.model}){!p.available ? ' - 不可用' : ''}
            </option>
          ))}
      </select>
      {value === 'gobang-only' && (
        <p className="text-xs text-slate-500 mt-1">内置 GobangAI 算法驱动，无需外部 API</p>
      )}
    </>
  );
}
