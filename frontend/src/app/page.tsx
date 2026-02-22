'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageToggle from '../components/LanguageToggle';
import { useI18n } from '../components/I18nProvider';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface AIProvider {
  key: string;
  name: string;
  available: boolean;
  model?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
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
        setProviders([{ key: 'gobang-only', name: t('home.builtinOnly'), available: true }]);
      });
  }, [t]);

  const createGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          playerName: playerName.trim() || 'Player 1',
          player2Name: mode === 'pvp' ? (player2Name.trim() || 'Player 2') : undefined,
          aiConfig: mode === 'ava'
            ? { blackAI: { provider: blackAIProvider }, whiteAI: { provider: whiteAIProvider } }
            : { whiteAI: { provider: aiProvider } },
        }),
      });

      if (!response.ok) throw new Error(t('home.createGameFailed'));

      const data = await response.json() as { gameId: string; playerColor?: string };

      // 启动游戏
      await fetch(`${BACKEND_URL}/api/games/${data.gameId}/start`, { method: 'POST' });

      router.push(`/game/${data.gameId}?color=${data.playerColor || 'black'}&mode=${mode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.createGameFailedHint'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3">
          <LanguageToggle />
        </div>
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            SKILL<br />GOBANG
          </h1>
          <p className="text-slate-400 text-sm">{t('home.subtitle')}</p>
        </div>

        {/* 游戏配置卡片 */}
        <div className="bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-700/50 p-6 space-y-5">

          {/* 游戏模式 */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t('home.mode')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pvp', label: t('mode.pvp'), icon: '👥' },
                { value: 'pva', label: t('mode.pva'), icon: '🤖' },
                { value: 'ava', label: t('mode.ava'), icon: '🔮' },
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
                  {mode === 'pvp' ? t('home.blackPlayerName') : t('home.playerName')}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder={mode === 'pvp' ? t('home.blackNamePlaceholder') : t('home.yourNamePlaceholder')}
                  maxLength={20}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 text-sm"
                />
              </div>
              {mode === 'pvp' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {t('home.whitePlayerName')}
                  </label>
                  <input
                    type="text"
                    value={player2Name}
                    onChange={e => setPlayer2Name(e.target.value)}
                    placeholder={t('home.whiteNamePlaceholder')}
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
                {t('home.aiProvider')}
              </label>
              <AIProviderSelect value={aiProvider} onChange={setAIProvider} providers={providers} t={t} />
            </div>
          )}

          {/* AI 提供者（机机模式，黑白独立选择） */}
          {mode === 'ava' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('home.blackAI')}
                </label>
                <AIProviderSelect value={blackAIProvider} onChange={setBlackAIProvider} providers={providers} t={t} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {t('home.whiteAI')}
                </label>
                <AIProviderSelect value={whiteAIProvider} onChange={setWhiteAIProvider} providers={providers} t={t} />
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
            {loading ? t('home.creating') : t('home.startGame')}
          </button>
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 bg-slate-900/50 rounded-xl border border-slate-700/30 p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t('home.quickRules')}</h3>
          <div className="space-y-1.5 text-xs text-slate-500">
            <p>• {t('home.rule1')}</p>
            <p>• {t('home.rule2')}</p>
            <p>• {t('home.rule3')}</p>
            <p>• {t('home.rule4')}</p>
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
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  providers: AIProvider[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-400 text-sm"
      >
        <option value="gobang-only">{t('home.builtinOnly')}</option>
        {providers
          .filter(p => p.key !== 'gobang-only')
          .map(p => (
            <option key={p.key} value={p.key} disabled={!p.available}>
              {p.name.toUpperCase()} ({p.model}){!p.available ? ` - ${t('home.unavailable')}` : ''}
            </option>
          ))}
      </select>
      {value === 'gobang-only' && (
        <p className="text-xs text-slate-500 mt-1">{t('home.builtinHint')}</p>
      )}
    </>
  );
}
