/**
 * 积分管理服务
 * 负责积分的计算、更新和查询
 */

import { scoreDAO } from '../../dao/ScoreDAO';
import {
  PlayerScoreRecord,
  GameRecord,
  ScoreChangeRecord,
  PlayerStats,
  LeaderboardEntry,
  createInitialPlayerRecord
} from '../../models/ScoreRecord';
import { v4 as uuidv4 } from 'uuid';

export class ScoreService {
  /**
   * 记录游戏结果并更新积分
   */
  recordGameResult(
    userId: string,
    username: string,
    gameRecord: GameRecord
  ): { newScore: number; scoreChange: number; achievements: string[] } {
    // 获取或创建玩家记录
    const playerRecord = scoreDAO.getOrCreatePlayerRecord(userId, username);

    // 计算积分变化
    const scoreBefore = playerRecord.totalScore;
    const baseChange = gameRecord.scoreChange;
    let scoreAfter = scoreBefore + baseChange;
    let effectiveChange = baseChange;

    // 机器人积分保护：如果是机器人玩家且本局结算后积分小于等于 0，则自动将总积分重置为 500000
    if (this.isBotUser(userId) && scoreAfter <= 0) {
      const rechargeTo = 500000;
      console.log(
        `🤖 机器人 ${username} 积分耗尽，系统自动充值到 ${rechargeTo}`
      );
      scoreAfter = rechargeTo;
      effectiveChange = scoreAfter - scoreBefore;
    }

    // 真人玩家积分下限保护：不能变成负数，最多扣到 0 分，差额由系统补足
    if (!this.isBotUser(userId) && scoreAfter < 0) {
      console.log(
        `⚖️ 玩家 ${username} 本局扣分超出余额，实际扣至 0 分（系统补足差额）`
      );
      scoreAfter = 0;
      effectiveChange = scoreAfter - scoreBefore; // 等于 -scoreBefore
    }

    // 更新统计数据
    playerRecord.gamesPlayed += 1;
    
    if (gameRecord.isWinner) {
      playerRecord.gamesWon += 1;
      playerRecord.currentStreak += 1;
      playerRecord.maxStreak = Math.max(playerRecord.maxStreak, playerRecord.currentStreak);
    } else {
      playerRecord.gamesLost += 1;
      playerRecord.currentStreak = 0;
    }

    // 更新胜率
    playerRecord.winRate = (playerRecord.gamesWon / playerRecord.gamesPlayed) * 100;

    // 更新角色统计
    if (gameRecord.role === 'landlord') {
      playerRecord.landlordGames += 1;
      if (gameRecord.isWinner) {
        playerRecord.landlordWins += 1;
      }
    } else {
      playerRecord.farmerGames += 1;
      if (gameRecord.isWinner) {
        playerRecord.farmerWins += 1;
      }
    }

    // 更新积分
    playerRecord.totalScore = scoreAfter;
    playerRecord.maxScore = Math.max(playerRecord.maxScore, scoreAfter);
    playerRecord.minScore = Math.min(playerRecord.minScore, scoreAfter);

    // 保存更新
    scoreDAO.updatePlayerRecord(userId, playerRecord);

    // 添加游戏记录
    scoreDAO.addGameRecord(userId, gameRecord);

    // 添加积分变化记录
    const changeRecord: ScoreChangeRecord = {
      id: uuidv4(),
      userId,
      gameId: gameRecord.gameId,
      scoreBefore,
      scoreAfter,
      scoreChange: effectiveChange,
      reason: gameRecord.isWinner ? 'game_win' : 'game_lose',
      timestamp: gameRecord.timestamp
    };
    scoreDAO.addScoreChange(changeRecord);

    // 检查成就
    const newAchievements = this.checkAchievements(userId, playerRecord);

    console.log(
      `📊 玩家 ${username} 积分更新: ${scoreBefore} → ${scoreAfter} (${effectiveChange > 0 ? '+' : ''}${effectiveChange})`
    );

    return {
      newScore: scoreAfter,
      scoreChange: effectiveChange,
      achievements: newAchievements
    };
  }

  /**
   * 检查并解锁成就
   */
  private checkAchievements(userId: string, playerRecord: PlayerScoreRecord): string[] {
    const achievements = scoreDAO.getAchievements();
    const playerAchievements = scoreDAO.getPlayerAchievements(userId);
    const unlockedIds = new Set(playerAchievements.map(a => a.achievementId));
    const newAchievements: string[] = [];

    for (const achievement of achievements) {
      // 跳过已解锁的成就
      if (unlockedIds.has(achievement.id)) {
        continue;
      }

      let shouldUnlock = false;

      // 检查解锁条件
      switch (achievement.condition.type) {
        case 'games_played':
          shouldUnlock = playerRecord.gamesPlayed >= achievement.condition.value;
          break;
        case 'games_won':
          shouldUnlock = playerRecord.gamesWon >= achievement.condition.value;
          break;
        case 'win_streak':
          shouldUnlock = playerRecord.currentStreak >= achievement.condition.value;
          break;
        case 'total_score':
          shouldUnlock = playerRecord.totalScore >= achievement.condition.value;
          break;
      }

      if (shouldUnlock) {
        scoreDAO.unlockAchievement(userId, achievement.id);
        newAchievements.push(achievement.id);

        // 奖励积分
        if (achievement.rewardScore) {
          this.adjustScore(
            userId,
            achievement.rewardScore,
            'system_reward',
            `解锁成就: ${achievement.name}`
          );
        }

        console.log(`🏆 玩家 ${playerRecord.username} 解锁成就: ${achievement.name}`);
      }
    }

    return newAchievements;
  }

  /**
   * 调整玩家积分（管理员操作）
   */
  adjustScore(
    userId: string,
    amount: number,
    reason: 'admin_adjust' | 'system_reward',
    note?: string
  ): void {
    const playerRecord = scoreDAO.getPlayerRecord(userId);
    
    if (!playerRecord) {
      throw new Error(`玩家记录不存在: ${userId}`);
    }

    const scoreBefore = playerRecord.totalScore;
    const scoreAfter = scoreBefore + amount;

    playerRecord.totalScore = scoreAfter;
    playerRecord.maxScore = Math.max(playerRecord.maxScore, scoreAfter);
    playerRecord.minScore = Math.min(playerRecord.minScore, scoreAfter);

    scoreDAO.updatePlayerRecord(userId, playerRecord);

    // 添加积分变化记录
    const changeRecord: ScoreChangeRecord = {
      id: uuidv4(),
      userId,
      gameId: '',
      scoreBefore,
      scoreAfter,
      scoreChange: amount,
      reason,
      timestamp: new Date(),
      note
    };
    scoreDAO.addScoreChange(changeRecord);

    console.log(`💰 玩家 ${playerRecord.username} 积分调整: ${scoreBefore} → ${scoreAfter} (${amount > 0 ? '+' : ''}${amount})`);
  }

  /**
   * 更新玩家资料（昵称 / 头像）
   * 如果玩家记录不存在，则创建一条初始记录
   */
  updatePlayerProfile(
    userId: string,
    params: { username?: string; avatar?: string }
  ): PlayerScoreRecord {
    const safeName = typeof params.username === 'string'
      ? params.username.trim()
      : undefined;

    // 确保存在积分记录
    const record = scoreDAO.getOrCreatePlayerRecord(userId, safeName || userId);

    const updates: Partial<PlayerScoreRecord> = {};

    if (safeName) {
      updates.username = safeName;
    }

    if (params.avatar !== undefined) {
      updates.avatar = params.avatar;
    }

    if (Object.keys(updates).length > 0) {
      scoreDAO.updatePlayerRecord(userId, updates);
    }

    const latest = scoreDAO.getPlayerRecord(userId) as PlayerScoreRecord | null;
    return latest || record;
  }

  /**
   * 获取玩家积分记录
   * 机器人如果没有记录，会自动创建并存储（初始50万积分）
   */
  getPlayerScore(userId: string): PlayerScoreRecord | null {
    const record = scoreDAO.getPlayerRecord(userId);
    
    // 如果是机器人且没有记录，创建并存储默认积分记录
    if (!record && this.isBotUser(userId)) {
      return scoreDAO.getOrCreatePlayerRecord(userId, userId);
    }
    
    return record;
  }

  /**
   * 简单判断是否为机器人玩家：当前机器人 ID 统一为 bot_XXX
   */
  private isBotUser(userId: string): boolean {
    return typeof userId === 'string' && userId.startsWith('bot_');
  }

  /**
   * 获取玩家统计数据
   */
  getPlayerStats(userId: string): PlayerStats | null {
    const record = scoreDAO.getPlayerRecord(userId);
    
    if (!record) {
      return null;
    }

    // 计算统计数据
    const totalPlayTime = record.gameHistory.reduce((sum, game) => sum + (game.duration || 0), 0);
    const avgGameDuration = record.gamesPlayed > 0 ? totalPlayTime / record.gamesPlayed : 0;

    const landlordWinRate = record.landlordGames > 0
      ? (record.landlordWins / record.landlordGames) * 100
      : 0;

    const farmerWinRate = record.farmerGames > 0
      ? (record.farmerWins / record.farmerGames) * 100
      : 0;

    // 统计炸弹和王炸
    let bombCount = 0;
    let rocketCount = 0;
    let springCount = 0;
    let antiSpringCount = 0;

    record.gameHistory.forEach(game => {
      bombCount += game.multipliers.bomb > 1 ? 1 : 0;
      rocketCount += game.multipliers.rocket > 1 ? 1 : 0;
      springCount += game.multipliers.spring > 1 ? 1 : 0;
      antiSpringCount += game.multipliers.antiSpring > 1 ? 1 : 0;
    });

    // 积分趋势（最近30天）
    const scoreTrend = this.calculateScoreTrend(userId, 30);

    return {
      userId,
      totalPlayTime,
      avgGameDuration,
      landlordWinRate,
      farmerWinRate,
      bombCount,
      rocketCount,
      springCount,
      antiSpringCount,
      mostUsedCardTypes: [], // TODO: 实现牌型统计
      scoreTrend
    };
  }

  /**
   * 计算积分趋势
   */
  private calculateScoreTrend(userId: string, days: number): { date: string; score: number }[] {
    const changes = scoreDAO.getScoreChanges(userId, 1000);
    const trend: { date: string; score: number }[] = [];
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 按日期分组
    const dailyScores = new Map<string, number>();
    
    changes.forEach(change => {
      if (change.timestamp >= startDate) {
        const dateKey = change.timestamp.toISOString().split('T')[0];
        dailyScores.set(dateKey, change.scoreAfter);
      }
    });

    // 转换为数组
    dailyScores.forEach((score, date) => {
      trend.push({ date, score });
    });

    // 按日期排序
    trend.sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  }

  /**
   * 获取排行榜
   */
  getLeaderboard(
    type: 'score' | 'winRate' | 'wins' = 'score',
    limit: number = 100
  ): LeaderboardEntry[] {
    const sortBy = type === 'score' ? 'totalScore' : type === 'winRate' ? 'winRate' : 'gamesWon';
    const players = scoreDAO.getLeaderboard(sortBy, limit);

    return players.map((player, index) => ({
      rank: index + 1,
      userId: player.userId,
      username: player.username,
      value: type === 'score' ? player.totalScore : type === 'winRate' ? player.winRate : player.gamesWon,
      gamesPlayed: player.gamesPlayed,
      winRate: player.winRate,
      updatedAt: player.updatedAt
    }));
  }

  /**
   * 获取玩家排名
   */
  getPlayerRank(userId: string, type: 'score' | 'winRate' | 'wins' = 'score'): number {
    const sortBy = type === 'score' ? 'totalScore' : type === 'winRate' ? 'winRate' : 'gamesWon';
    return scoreDAO.getPlayerRank(userId, sortBy);
  }

  /**
   * 获取玩家成就
   */
  getPlayerAchievements(userId: string) {
    const achievements = scoreDAO.getAchievements();
    const playerAchievements = scoreDAO.getPlayerAchievements(userId);
    
    return achievements.map(achievement => {
      const playerAchievement = playerAchievements.find(pa => pa.achievementId === achievement.id);
      
      return {
        ...achievement,
        isUnlocked: playerAchievement?.isUnlocked || false,
        unlockedAt: playerAchievement?.unlockedAt,
        progress: playerAchievement?.progress || 0
      };
    });
  }

  /**
   * 获取数据库统计信息
   */
  getSystemStats() {
    return scoreDAO.getStats();
  }

  /**
   * 备份数据库
   */
  backup(): void {
    scoreDAO.backup();
  }
}

// 导出单例
export const scoreService = new ScoreService();
