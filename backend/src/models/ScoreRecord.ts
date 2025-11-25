/**
 * 积分记录数据模型
 * 用于存储玩家的积分、战绩和游戏历史
 */

/**
 * 游戏记录
 */
export interface GameRecord {
  /** 游戏ID */
  gameId: string;
  
  /** 游戏时间 */
  timestamp: Date;
  
  /** 房间ID */
  roomId: string;
  
  /** 玩家角色 */
  role: 'landlord' | 'farmer';
  
  /** 是否获胜 */
  isWinner: boolean;
  
  /** 积分变化 */
  scoreChange: number;
  
  /** 倍数信息 */
  multipliers: {
    base: number;
    bomb: number;
    rocket: number;
    spring: number;
    antiSpring: number;
    total: number;
  };
  
  /** 对手玩家ID列表 */
  opponents: string[];
  
  /** 游戏时长（秒） */
  duration?: number;
  
  /** 特殊标记 */
  tags?: string[]; // 如: ['春天', '王炸', '连胜']
}

/**
 * 玩家积分记录
 */
export interface PlayerScoreRecord {
  /** 玩家ID */
  userId: string;
  
  /** 玩家名称 */
  username: string;
  
  /** 玩家头像（可选，供个人资料与排行榜展示） */
  avatar?: string;
  
  /** 当前总积分 */
  totalScore: number;
  
  /** 总游戏场次 */
  gamesPlayed: number;
  
  /** 获胜场次 */
  gamesWon: number;
  
  /** 失败场次 */
  gamesLost: number;
  
  /** 胜率（百分比） */
  winRate: number;
  
  /** 最高连胜 */
  maxStreak: number;
  
  /** 当前连胜 */
  currentStreak: number;
  
  /** 最高积分 */
  maxScore: number;
  
  /** 最低积分 */
  minScore: number;
  
  /** 地主游戏次数 */
  landlordGames: number;
  
  /** 地主获胜次数 */
  landlordWins: number;
  
  /** 农民游戏次数 */
  farmerGames: number;
  
  /** 农民获胜次数 */
  farmerWins: number;
  
  /** 游戏历史记录 */
  gameHistory: GameRecord[];
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后更新时间 */
  updatedAt: Date;
  
  /** 最后游戏时间 */
  lastPlayedAt?: Date;
}

/**
 * 积分变化记录（用于历史追踪）
 */
export interface ScoreChangeRecord {
  /** 记录ID */
  id: string;
  
  /** 玩家ID */
  userId: string;
  
  /** 游戏ID */
  gameId: string;
  
  /** 变化前积分 */
  scoreBefore: number;
  
  /** 变化后积分 */
  scoreAfter: number;
  
  /** 积分变化 */
  scoreChange: number;
  
  /** 变化原因 */
  reason: 'game_win' | 'game_lose' | 'admin_adjust' | 'system_reward';
  
  /** 时间戳 */
  timestamp: Date;
  
  /** 备注 */
  note?: string;
}

/**
 * 成就定义
 */
export interface Achievement {
  /** 成就ID */
  id: string;
  
  /** 成就名称 */
  name: string;
  
  /** 成就描述 */
  description: string;
  
  /** 成就图标 */
  icon: string;
  
  /** 成就类型 */
  type: 'milestone' | 'streak' | 'special' | 'master';
  
  /** 解锁条件 */
  condition: {
    type: 'games_played' | 'games_won' | 'win_streak' | 'total_score' | 'special_card';
    value: number;
  };
  
  /** 奖励积分 */
  rewardScore?: number;
}

/**
 * 玩家成就记录
 */
export interface PlayerAchievement {
  /** 玩家ID */
  userId: string;
  
  /** 成就ID */
  achievementId: string;
  
  /** 解锁时间 */
  unlockedAt: Date;
  
  /** 进度（0-100） */
  progress: number;
  
  /** 是否已解锁 */
  isUnlocked: boolean;
}

/**
 * 排行榜条目
 */
export interface LeaderboardEntry {
  /** 排名 */
  rank: number;
  
  /** 玩家ID */
  userId: string;
  
  /** 玩家名称 */
  username: string;
  
  /** 积分/胜率等数值 */
  value: number;
  
  /** 游戏场次 */
  gamesPlayed: number;
  
  /** 胜率 */
  winRate: number;
  
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 统计数据
 */
export interface PlayerStats {
  /** 玩家ID */
  userId: string;
  
  /** 总游戏时长（秒） */
  totalPlayTime: number;
  
  /** 平均每局时长（秒） */
  avgGameDuration: number;
  
  /** 地主胜率 */
  landlordWinRate: number;
  
  /** 农民胜率 */
  farmerWinRate: number;
  
  /** 炸弹使用次数 */
  bombCount: number;
  
  /** 王炸使用次数 */
  rocketCount: number;
  
  /** 春天次数 */
  springCount: number;
  
  /** 反春次数 */
  antiSpringCount: number;
  
  /** 最常用牌型 */
  mostUsedCardTypes: { type: string; count: number }[];
  
  /** 积分趋势（最近30天） */
  scoreTrend: { date: string; score: number }[];
}

/**
 * 数据库存储格式（JSON文件）
 */
export interface ScoreDatabase {
  /** 版本号 */
  version: string;
  
  /** 玩家积分记录 */
  players: { [userId: string]: PlayerScoreRecord };
  
  /** 积分变化历史 */
  scoreChanges: ScoreChangeRecord[];
  
  /** 成就定义 */
  achievements: Achievement[];
  
  /** 玩家成就记录 */
  playerAchievements: { [userId: string]: PlayerAchievement[] };
  
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 默认成就列表
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: '首胜',
    description: '赢得第一场游戏',
    icon: '🎉',
    type: 'milestone',
    condition: { type: 'games_won', value: 1 },
    rewardScore: 10
  },
  {
    id: 'win_10',
    name: '小有成就',
    description: '赢得10场游戏',
    icon: '🏅',
    type: 'milestone',
    condition: { type: 'games_won', value: 10 },
    rewardScore: 50
  },
  {
    id: 'win_50',
    name: '游戏高手',
    description: '赢得50场游戏',
    icon: '🏆',
    type: 'milestone',
    condition: { type: 'games_won', value: 50 },
    rewardScore: 200
  },
  {
    id: 'win_100',
    name: '斗地主大师',
    description: '赢得100场游戏',
    icon: '👑',
    type: 'master',
    condition: { type: 'games_won', value: 100 },
    rewardScore: 500
  },
  {
    id: 'streak_3',
    name: '三连胜',
    description: '连续赢得3场游戏',
    icon: '🔥',
    type: 'streak',
    condition: { type: 'win_streak', value: 3 },
    rewardScore: 30
  },
  {
    id: 'streak_5',
    name: '五连胜',
    description: '连续赢得5场游戏',
    icon: '⚡',
    type: 'streak',
    condition: { type: 'win_streak', value: 5 },
    rewardScore: 100
  },
  {
    id: 'streak_10',
    name: '十连胜',
    description: '连续赢得10场游戏',
    icon: '💫',
    type: 'streak',
    condition: { type: 'win_streak', value: 10 },
    rewardScore: 300
  },
  {
    id: 'score_1000',
    name: '千分玩家',
    description: '总积分达到1000',
    icon: '💰',
    type: 'milestone',
    condition: { type: 'total_score', value: 1000 },
    rewardScore: 100
  },
  {
    id: 'score_5000',
    name: '五千分大佬',
    description: '总积分达到5000',
    icon: '💎',
    type: 'milestone',
    condition: { type: 'total_score', value: 5000 },
    rewardScore: 500
  },
  {
    id: 'games_100',
    name: '百场老将',
    description: '参与100场游戏',
    icon: '🎮',
    type: 'milestone',
    condition: { type: 'games_played', value: 100 },
    rewardScore: 200
  }
];

/**
 * 初始化玩家积分记录
 */
export function createInitialPlayerRecord(userId: string, username: string): PlayerScoreRecord {
  return {
    userId,
    username,
    avatar: undefined,
    totalScore: 500000, // 初始积分：50万
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    maxStreak: 0,
    currentStreak: 0,
    maxScore: 500000,
    minScore: 500000,
    landlordGames: 0,
    landlordWins: 0,
    farmerGames: 0,
    farmerWins: 0,
    gameHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
