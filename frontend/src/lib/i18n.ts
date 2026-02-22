import { SkillType } from '../types/game';

export type Locale = 'zh' | 'en';

type MessageValue = string | ((params?: Record<string, string | number>) => string);
type Messages = Record<string, MessageValue>;

const zh: Messages = {
  'common.home': '首页',
  'common.connected': '已连接',
  'common.connecting': '连接中...',
  'common.loading': '加载中...',
  'common.cancel': '取消选择',
  'common.confirm': '确认',

  'lang.zh': '中文',
  'lang.en': 'English',
  'lang.switchToZh': '切换到中文',
  'lang.switchToEn': 'Switch to English',

  'mode.pvp': '人人对战',
  'mode.pva': '人机对战',
  'mode.ava': '机机对战',

  'home.subtitle': '技能五子棋 · CS307 BK Project',
  'home.mode': '游戏模式',
  'home.playerName': '玩家名称',
  'home.blackPlayerName': '黑方玩家名称',
  'home.whitePlayerName': '白方玩家名称',
  'home.blackNamePlaceholder': '黑方名字',
  'home.whiteNamePlaceholder': '白方名字',
  'home.yourNamePlaceholder': '输入你的名字',
  'home.aiProvider': 'AI 提供者',
  'home.blackAI': '● 黑方 AI',
  'home.whiteAI': '○ 白方 AI',
  'home.creating': '创建中...',
  'home.startGame': '开始游戏',
  'home.quickRules': '快速规则',
  'home.rule1': '率先连成 5 子获胜',
  'home.rule2': '每回合开始获得 1 点能量',
  'home.rule3': '连成三子额外获得 1 点能量',
  'home.rule4': '可以消耗能量使用技能替代落子',
  'home.createGameFailed': '创建游戏失败',
  'home.createGameFailedHint': '创建游戏失败，请确认后端服务已启动',
  'home.builtinOnly': '仅使用内置算法 AI（无需 API Key）',
  'home.builtinHint': '内置 GobangAI 算法驱动，无需外部 API',
  'home.unavailable': '不可用',

  'game.loadingGame': '加载游戏中...',
  'game.connectingServer': '连接服务器中...',
  'game.turnOf': ({ name }) => `${name} 的回合`,
  'game.aiThinking': 'AI 正在思考...',
  'game.selectedSkill': ({ skill }) => `已选择 ${skill}`,
  'game.selectTarget': '点击棋盘选择目标',
  'game.clickToConfirm': '点击确认使用',
  'game.clickTargetOnBoard': '点击棋盘上的目标位置',
  'game.placeOrSkillPvp': ({ name }) => `${name} 落子，或在右侧选择技能`,
  'game.placeOrSkill': '点击棋盘落子，或在右侧选择技能',
  'game.aiAnalyzing': 'AI 正在分析棋局...',
  'game.waitingForMove': ({ name }) => `等待 ${name} 落子`,

  'skill.deckTitle': '技能卡牌',
  'skill.clickToSelect': '点击选择技能',
  'skill.selected': ({ skill }) => `已选择：${skill}`,
  'skill.chooseTarget': '请点击棋盘选择目标位置',
  'skill.clickConfirm': '点击确认按钮使用技能',
  'skill.confirmUse': ({ skill }) => `确认使用 ${skill}`,
  'skill.cost': ({ energy }) => `消耗 ${energy} 能量`,
  'skill.available': '可用',
  'skill.missingEnergy': ({ value }) => `差 ${value} 点`,

  'gameInfo.draw': '平局！',
  'gameInfo.winner': ({ name }) => `${name} 获胜！`,
  'gameInfo.thinking': ({ name }) => `${name} 思考中...`,
  'gameInfo.turnSkipped': ({ name }) => `${name} 的回合被跳过`,
  'gameInfo.yourTurn': '你的回合',
  'gameInfo.round': ({ round }) => `第 ${round} 回合`,
  'gameInfo.opponentSkip': ({ count }) => `⏸ 对手还将跳过 ${count} 个回合`,
  'gameInfo.history': '对局记录',
  'gameInfo.noHistory': '暂无记录',
  'gameInfo.resign': '认输',
  'gameInfo.movePlace': ({ turn, pos }) => `回合${turn}: 落子 (${pos})`,
  'gameInfo.moveSkill': ({ turn, skill }) => `回合${turn}: 使用 ${skill}`,

  'energy.thinking': '思考中...',
  'energy.acting': '行动中',

  'skill.dust_and_stone.name': '飞沙走石',
  'skill.dust_and_stone.desc': '移除对手一枚棋子，该格下一回合无法落子',
  'skill.uproot_mount.name': '力拔山兮',
  'skill.uproot_mount.desc': '50%立即获胜 / 30%额外回合 / 20%无效',
  'skill.polarity_reversal.name': '两极反转',
  'skill.polarity_reversal.desc': '跳过下一回合，棋盘黑白棋子全部互换',
  'skill.still_as_pond.name': '水静如镜',
  'skill.still_as_pond.desc': '阻止对手接下来的2个回合',
  'skill.tempo_split.name': '节拍分裂',
  'skill.tempo_split.desc': '本轮可额外落一子，但放弃下一回合',
  'skill.sentinel_ward.name': '哨兵结界',
  'skill.sentinel_ward.desc': '封锁一格一回合，对手无法在此落子',
};

const en: Messages = {
  'common.home': 'Home',
  'common.connected': 'Connected',
  'common.connecting': 'Connecting...',
  'common.loading': 'Loading...',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',

  'lang.zh': '中文',
  'lang.en': 'English',
  'lang.switchToZh': '切换到中文',
  'lang.switchToEn': 'Switch to English',

  'mode.pvp': 'PvP',
  'mode.pva': 'PvA',
  'mode.ava': 'AvA',

  'home.subtitle': 'Skill Gobang · CS307 BK Project',
  'home.mode': 'Mode',
  'home.playerName': 'Player Name',
  'home.blackPlayerName': 'Black Player Name',
  'home.whitePlayerName': 'White Player Name',
  'home.blackNamePlaceholder': 'Black player name',
  'home.whiteNamePlaceholder': 'White player name',
  'home.yourNamePlaceholder': 'Enter your name',
  'home.aiProvider': 'AI Provider',
  'home.blackAI': '● Black AI',
  'home.whiteAI': '○ White AI',
  'home.creating': 'Creating...',
  'home.startGame': 'Start Game',
  'home.quickRules': 'Quick Rules',
  'home.rule1': 'Connect 5 stones first to win',
  'home.rule2': 'Gain 1 energy at the start of each turn',
  'home.rule3': 'Gain +1 bonus energy for making three in a row',
  'home.rule4': 'Use skills with energy instead of placing a stone',
  'home.createGameFailed': 'Failed to create game',
  'home.createGameFailedHint': 'Failed to create game. Make sure backend server is running.',
  'home.builtinOnly': 'Built-in AI only (no API key needed)',
  'home.builtinHint': 'Powered by built-in GobangAI, no external API required',
  'home.unavailable': 'Unavailable',

  'game.loadingGame': 'Loading game...',
  'game.connectingServer': 'Connecting to server...',
  'game.turnOf': ({ name }) => `${name}'s turn`,
  'game.aiThinking': 'AI is thinking...',
  'game.selectedSkill': ({ skill }) => `Selected ${skill}`,
  'game.selectTarget': 'Click the board to pick a target',
  'game.clickToConfirm': 'Click confirm to use',
  'game.clickTargetOnBoard': 'Click a target position on the board',
  'game.placeOrSkillPvp': ({ name }) => `${name}: place a stone or use a skill on the right`,
  'game.placeOrSkill': 'Place a stone or use a skill on the right',
  'game.aiAnalyzing': 'AI is analyzing the board...',
  'game.waitingForMove': ({ name }) => `Waiting for ${name} to move`,

  'skill.deckTitle': 'Skill Cards',
  'skill.clickToSelect': 'Click to select a skill',
  'skill.selected': ({ skill }) => `Selected: ${skill}`,
  'skill.chooseTarget': 'Click the board to choose a target',
  'skill.clickConfirm': 'Click confirm to use the skill',
  'skill.confirmUse': ({ skill }) => `Use ${skill}`,
  'skill.cost': ({ energy }) => `Cost ${energy} energy`,
  'skill.available': 'Ready',
  'skill.missingEnergy': ({ value }) => `${value} short`,

  'gameInfo.draw': 'Draw!',
  'gameInfo.winner': ({ name }) => `${name} wins!`,
  'gameInfo.thinking': ({ name }) => `${name} is thinking...`,
  'gameInfo.turnSkipped': ({ name }) => `${name}'s turn is skipped`,
  'gameInfo.yourTurn': 'Your turn',
  'gameInfo.round': ({ round }) => `Round ${round}`,
  'gameInfo.opponentSkip': ({ count }) => `⏸ Opponent will skip ${count} more turn(s)`,
  'gameInfo.history': 'Move History',
  'gameInfo.noHistory': 'No moves yet',
  'gameInfo.resign': 'Resign',
  'gameInfo.movePlace': ({ turn, pos }) => `Turn ${turn}: Place at ${pos}`,
  'gameInfo.moveSkill': ({ turn, skill }) => `Turn ${turn}: Use ${skill}`,

  'energy.thinking': 'Thinking...',
  'energy.acting': 'Acting',

  'skill.dust_and_stone.name': 'Dust and Stone',
  'skill.dust_and_stone.desc': 'Remove one opponent stone; that cell is blocked for the next turn',
  'skill.uproot_mount.name': 'Uproot the Mountain',
  'skill.uproot_mount.desc': '50% instant win / 30% extra turn / 20% no effect',
  'skill.polarity_reversal.name': 'Polarity Reversal',
  'skill.polarity_reversal.desc': 'Skip next turn and swap all black/white stones on board',
  'skill.still_as_pond.name': 'Still as Pond',
  'skill.still_as_pond.desc': 'Force opponent to skip the next 2 turns',
  'skill.tempo_split.name': 'Tempo Split',
  'skill.tempo_split.desc': 'Gain one extra move this round, but skip next turn',
  'skill.sentinel_ward.name': 'Sentinel Ward',
  'skill.sentinel_ward.desc': 'Block one cell for one turn; opponent cannot place there',
};

const allMessages: Record<Locale, Messages> = { zh, en };

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const value = allMessages[locale][key] ?? allMessages.zh[key];
  if (!value) return key;
  if (typeof value === 'function') {
    return value(params);
  }
  return value;
}

export function getSkillName(locale: Locale, skillType: SkillType): string {
  return translate(locale, `skill.${skillType}.name`);
}

export function getSkillDescription(locale: Locale, skillType: SkillType): string {
  return translate(locale, `skill.${skillType}.desc`);
}
