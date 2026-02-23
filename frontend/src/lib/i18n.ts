export type Lang = 'zh' | 'en';

export type SkillTr = { name: string; description: string };

export interface Translations {
  // ── Home ──────────────────────────────────────────────
  subtitle: string;
  modeLabel: string;
  modeNames: Record<string, string>;
  blackPlayerLabel: string;
  whitePlayerLabel: string;
  playerLabel: string;
  blackPlaceholder: string;
  whitePlaceholder: string;
  playerPlaceholder: string;
  aiProviderLabel: string;
  blackAILabel: string;
  whiteAILabel: string;
  aiBuiltin: string;
  aiBuiltinDesc: string;
  aiUnavailable: string;
  startBtn: string;
  startingBtn: string;
  rulesTitle: string;
  rules: { pre: string; highlight: string; post: string }[];
  errorCreate: string;

  // ── Game page ─────────────────────────────────────────
  modeLabels: Record<string, string>;
  connected: string;
  disconnected: string;
  loadingGame: string;
  connectingServer: string;
  aiThinkingBanner: string;
  aiAnalyzing: string;
  myTurnHint: string;
  pvpTurnHint: (name: string) => string;
  waitingFor: (name: string) => string;
  skillTargetHint: string;

  // ── GameInfo ──────────────────────────────────────────
  draw: string;
  wins: (name: string) => string;
  aiThinkingStatus: (name: string) => string;
  turnSkipped: (name: string) => string;
  myTurn: string;
  opponentTurn: (name: string) => string;
  round: (n: number) => string;
  moveHistory: string;
  noHistory: string;
  placeAt: (col: string, row: number) => string;
  useSkillLabel: string;
  opponentSkip: (n: number) => string;
  resign: string;

  // ── SkillDeck ─────────────────────────────────────────
  skillPanel: string;
  cancelSkill: string;
  clickSkill: string;
  selectedSkillLabel: (name: string) => string;
  clickTarget: string;
  clickConfirm: string;
  confirmUse: (name: string) => string;

  // ── SkillCard ─────────────────────────────────────────
  costLabel: (n: number) => string;
  available: string;
  needMore: (n: number) => string;

  // ── EnergyBar ─────────────────────────────────────────
  thinking: string;
  acting: string;

  // ── Skill data ────────────────────────────────────────
  skills: Record<string, SkillTr>;
}

const zh: Translations = {
  subtitle: '技能五子棋 · CS307 BK Project',
  modeLabel: '游戏模式',
  modeNames: { pvp: '人人对战', pva: '人机对战', ava: '机机对战' },
  blackPlayerLabel: '黑方玩家名称',
  whitePlayerLabel: '白方玩家名称',
  playerLabel: '玩家名称',
  blackPlaceholder: '黑方名字',
  whitePlaceholder: '白方名字',
  playerPlaceholder: '输入你的名字',
  aiProviderLabel: 'AI 提供者',
  blackAILabel: '● 黑方 AI',
  whiteAILabel: '○ 白方 AI',
  aiBuiltin: '仅使用内置算法 AI（无需 API Key）',
  aiBuiltinDesc: '内置 GobangAI 算法驱动，无需外部 API',
  aiUnavailable: ' - 不可用',
  startBtn: '开始游戏',
  startingBtn: '创建中...',
  rulesTitle: '快速规则',
  rules: [
    { pre: '率先连成', highlight: '5 子', post: '获胜' },
    { pre: '每回合开始获得', highlight: '1 点能量', post: '' },
    { pre: '连成三子额外获得', highlight: '1 点能量', post: '' },
    { pre: '可以消耗能量使用技能替代落子', highlight: '', post: '' },
  ],
  errorCreate: '创建游戏失败，请确认后端服务已启动',

  modeLabels: { pvp: '人人对战', pva: '人机对战', ava: '机机对战' },
  connected: '已连接',
  disconnected: '连接中...',
  loadingGame: '加载游戏中...',
  connectingServer: '连接服务器中...',
  aiThinkingBanner: 'AI 正在思考...',
  aiAnalyzing: 'AI 正在分析棋局...',
  myTurnHint: '点击棋盘落子，或在右侧选择技能',
  pvpTurnHint: (name) => `${name} 落子，或在右侧选择技能`,
  waitingFor: (name) => `等待 ${name} 落子`,
  skillTargetHint: '点击棋盘上的目标位置',

  draw: '平局！',
  wins: (name) => `${name} 获胜！`,
  aiThinkingStatus: (name) => `${name} 思考中...`,
  turnSkipped: (name) => `${name} 的回合被跳过`,
  myTurn: '你的回合',
  opponentTurn: (name) => `${name} 的回合`,
  round: (n) => `第 ${n} 回合`,
  moveHistory: '对局记录',
  noHistory: '暂无记录',
  placeAt: (col, row) => `落子 (${col}${row})`,
  useSkillLabel: '使用',
  opponentSkip: (n) => `⏸ 对手还将跳过 ${n} 个回合`,
  resign: '认输',

  skillPanel: '技能卡牌',
  cancelSkill: '取消选择',
  clickSkill: '点击选择技能',
  selectedSkillLabel: (name) => `已选择：${name}`,
  clickTarget: '请点击棋盘选择目标位置',
  clickConfirm: '点击确认按钮使用技能',
  confirmUse: (name) => `确认使用 ${name}`,

  costLabel: (n) => `消耗 ${n} 能量`,
  available: '可用',
  needMore: (n) => `差 ${n} 点`,

  thinking: '思考中...',
  acting: '行动中',

  skills: {
    dust_and_stone: { name: '飞沙走石', description: '移除对手一枚棋子，该格下一回合无法落子' },
    uproot_mount: { name: '力拔山兮', description: '50%立即获胜 / 30%额外回合 / 20%无效' },
    polarity_reversal: { name: '两极反转', description: '跳过下一回合，棋盘黑白棋子全部互换' },
    still_as_pond: { name: '水静如镜', description: '阻止对手接下来的2个回合' },
    tempo_split: { name: '节拍分裂', description: '本轮可额外落一子，但放弃下一回合' },
    sentinel_ward: { name: '哨兵结界', description: '封锁一格一回合，对手无法在此落子' },
  },
};

const en: Translations = {
  subtitle: 'Skill Gobang · CS307 BK Project',
  modeLabel: 'Game Mode',
  modeNames: { pvp: 'Human vs Human', pva: 'Human vs AI', ava: 'AI vs AI' },
  blackPlayerLabel: 'Black Player Name',
  whitePlayerLabel: 'White Player Name',
  playerLabel: 'Player Name',
  blackPlaceholder: 'Black name',
  whitePlaceholder: 'White name',
  playerPlaceholder: 'Enter your name',
  aiProviderLabel: 'AI Provider',
  blackAILabel: '● Black AI',
  whiteAILabel: '○ White AI',
  aiBuiltin: 'Built-in algorithm only (no API key needed)',
  aiBuiltinDesc: 'Powered by GobangAI solver, no external API needed',
  aiUnavailable: ' - Unavailable',
  startBtn: 'Start Game',
  startingBtn: 'Creating...',
  rulesTitle: 'Quick Rules',
  rules: [
    { pre: 'First to connect', highlight: '5 stones', post: 'wins' },
    { pre: 'Gain', highlight: '1 energy', post: 'at the start of each turn' },
    { pre: 'Form a three-in-a-row for', highlight: '1 bonus energy', post: '' },
    { pre: 'Spend energy to use a skill instead of placing', highlight: '', post: '' },
  ],
  errorCreate: 'Failed to create game. Make sure the backend server is running.',

  modeLabels: { pvp: 'PvP', pva: 'PvA', ava: 'AvA' },
  connected: 'Connected',
  disconnected: 'Connecting...',
  loadingGame: 'Loading game...',
  connectingServer: 'Connecting to server...',
  aiThinkingBanner: 'AI is thinking...',
  aiAnalyzing: 'AI is analyzing the board...',
  myTurnHint: 'Click the board to place a stone, or select a skill on the right',
  pvpTurnHint: (name) => `${name}: place a stone or select a skill`,
  waitingFor: (name) => `Waiting for ${name}`,
  skillTargetHint: 'Click the board to select a target',

  draw: 'Draw!',
  wins: (name) => `${name} wins!`,
  aiThinkingStatus: (name) => `${name} is thinking...`,
  turnSkipped: (name) => `${name}'s turn is skipped`,
  myTurn: 'Your turn',
  opponentTurn: (name) => `${name}'s turn`,
  round: (n) => `Round ${n}`,
  moveHistory: 'Move History',
  noHistory: 'No moves yet',
  placeAt: (col, row) => `Place (${col}${row})`,
  useSkillLabel: 'Use',
  opponentSkip: (n) => `⏸ Opponent skips ${n} more turn(s)`,
  resign: 'Resign',

  skillPanel: 'Skill Cards',
  cancelSkill: 'Cancel',
  clickSkill: 'Click to select a skill',
  selectedSkillLabel: (name) => `Selected: ${name}`,
  clickTarget: 'Click the board to select a target',
  clickConfirm: 'Click the confirm button to use the skill',
  confirmUse: (name) => `Confirm: ${name}`,

  costLabel: (n) => `${n} Energy`,
  available: 'Ready',
  needMore: (n) => `Need ${n} more`,

  thinking: 'Thinking...',
  acting: 'Acting',

  skills: {
    dust_and_stone: { name: 'Dust & Stone', description: 'Remove an opponent stone. That cell is blocked for the next turn.' },
    uproot_mount: { name: 'Uproot Mount', description: '50% win instantly / 30% extra turn / 20% nothing happens' },
    polarity_reversal: { name: 'Polarity Reversal', description: 'Skip your next turn. All black/white stones swap.' },
    still_as_pond: { name: 'Still as Pond', description: 'Force the opponent to skip the next 2 turns.' },
    tempo_split: { name: 'Tempo Split', description: 'Place 2 stones this turn, but skip your next turn.' },
    sentinel_ward: { name: 'Sentinel Ward', description: 'Block an empty cell for 1 turn. Opponent cannot place there.' },
  },
};

export const translations: Record<Lang, Translations> = { zh, en };
