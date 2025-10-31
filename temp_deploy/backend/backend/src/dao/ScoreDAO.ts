/**
 * 积分数据访问层
 * 负责积分数据的读写操作
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ScoreDatabase,
  PlayerScoreRecord,
  GameRecord,
  ScoreChangeRecord,
  PlayerAchievement,
  Achievement,
  DEFAULT_ACHIEVEMENTS,
  createInitialPlayerRecord
} from '../models/ScoreRecord';

export class ScoreDAO {
  private dbPath: string;
  private db: ScoreDatabase;

  constructor(dbPath: string = path.join(__dirname, '../../data/scores.json')) {
    this.dbPath = dbPath;
    this.db = this.loadDatabase();
  }

  /**
   * 加载数据库
   */
  private loadDatabase(): ScoreDatabase {
    try {
      // 确保数据目录存在
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 如果文件存在，读取数据
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const db = JSON.parse(data);
        
        // 转换日期字符串为Date对象
        this.convertDates(db);
        
        return db;
      }

      // 如果文件不存在，创建初始数据库
      return this.createInitialDatabase();
    } catch (error) {
      console.error('❌ 加载积分数据库失败:', error);
      return this.createInitialDatabase();
    }
  }

  /**
   * 创建初始数据库
   */
  private createInitialDatabase(): ScoreDatabase {
    const db: ScoreDatabase = {
      version: '1.0.0',
      players: {},
      scoreChanges: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      playerAchievements: {},
      lastUpdated: new Date()
    };

    this.saveDatabase(db);
    return db;
  }

  /**
   * 转换日期字符串为Date对象
   */
  private convertDates(obj: any): void {
    if (!obj) return;

    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        // 递归处理嵌套对象
        this.convertDates(obj[key]);
      } else if (
        typeof obj[key] === 'string' &&
        (key.includes('At') || key === 'timestamp' || key === 'date')
      ) {
        // 转换日期字符串
        obj[key] = new Date(obj[key]);
      }
    }
  }

  /**
   * 保存数据库
   */
  private saveDatabase(db?: ScoreDatabase): void {
    try {
      const dataToSave = db || this.db;
      dataToSave.lastUpdated = new Date();
      
      fs.writeFileSync(
        this.dbPath,
        JSON.stringify(dataToSave, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('❌ 保存积分数据库失败:', error);
      throw error;
    }
  }

  /**
   * 获取玩家积分记录
   */
  getPlayerRecord(userId: string): PlayerScoreRecord | null {
    return this.db.players[userId] || null;
  }

  /**
   * 获取或创建玩家积分记录
   */
  getOrCreatePlayerRecord(userId: string, username: string): PlayerScoreRecord {
    let record = this.db.players[userId];
    
    if (!record) {
      record = createInitialPlayerRecord(userId, username);
      this.db.players[userId] = record;
      this.saveDatabase();
    }
    
    return record;
  }

  /**
   * 更新玩家积分记录
   */
  updatePlayerRecord(userId: string, updates: Partial<PlayerScoreRecord>): void {
    const record = this.db.players[userId];
    
    if (!record) {
      throw new Error(`玩家记录不存在: ${userId}`);
    }

    // 更新字段
    Object.assign(record, updates);
    record.updatedAt = new Date();

    this.saveDatabase();
  }

  /**
   * 添加游戏记录
   */
  addGameRecord(userId: string, gameRecord: GameRecord): void {
    const record = this.db.players[userId];
    
    if (!record) {
      throw new Error(`玩家记录不存在: ${userId}`);
    }

    // 添加到历史记录
    record.gameHistory.unshift(gameRecord);

    // 只保留最近100场记录
    if (record.gameHistory.length > 100) {
      record.gameHistory = record.gameHistory.slice(0, 100);
    }

    record.lastPlayedAt = gameRecord.timestamp;
    record.updatedAt = new Date();

    this.saveDatabase();
  }

  /**
   * 添加积分变化记录
   */
  addScoreChange(change: ScoreChangeRecord): void {
    this.db.scoreChanges.unshift(change);

    // 只保留最近1000条记录
    if (this.db.scoreChanges.length > 1000) {
      this.db.scoreChanges = this.db.scoreChanges.slice(0, 1000);
    }

    this.saveDatabase();
  }

  /**
   * 获取玩家积分变化历史
   */
  getScoreChanges(userId: string, limit: number = 20): ScoreChangeRecord[] {
    return this.db.scoreChanges
      .filter(change => change.userId === userId)
      .slice(0, limit);
  }

  /**
   * 获取所有玩家记录
   */
  getAllPlayers(): PlayerScoreRecord[] {
    return Object.values(this.db.players);
  }

  /**
   * 获取排行榜数据
   */
  getLeaderboard(
    sortBy: 'totalScore' | 'winRate' | 'gamesWon' = 'totalScore',
    limit: number = 100
  ): PlayerScoreRecord[] {
    const players = this.getAllPlayers();

    // 排序
    players.sort((a, b) => {
      if (sortBy === 'totalScore') {
        return b.totalScore - a.totalScore;
      } else if (sortBy === 'winRate') {
        // 至少玩过10场才参与胜率排行
        if (a.gamesPlayed < 10) return 1;
        if (b.gamesPlayed < 10) return -1;
        return b.winRate - a.winRate;
      } else {
        return b.gamesWon - a.gamesWon;
      }
    });

    return players.slice(0, limit);
  }

  /**
   * 获取玩家排名
   */
  getPlayerRank(userId: string, sortBy: 'totalScore' | 'winRate' | 'gamesWon' = 'totalScore'): number {
    const leaderboard = this.getLeaderboard(sortBy, 10000);
    const index = leaderboard.findIndex(p => p.userId === userId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * 获取成就列表
   */
  getAchievements(): Achievement[] {
    return this.db.achievements;
  }

  /**
   * 获取玩家成就
   */
  getPlayerAchievements(userId: string): PlayerAchievement[] {
    return this.db.playerAchievements[userId] || [];
  }

  /**
   * 解锁成就
   */
  unlockAchievement(userId: string, achievementId: string): void {
    if (!this.db.playerAchievements[userId]) {
      this.db.playerAchievements[userId] = [];
    }

    const existing = this.db.playerAchievements[userId].find(
      a => a.achievementId === achievementId
    );

    if (!existing) {
      this.db.playerAchievements[userId].push({
        userId,
        achievementId,
        unlockedAt: new Date(),
        progress: 100,
        isUnlocked: true
      });

      this.saveDatabase();
    }
  }

  /**
   * 更新成就进度
   */
  updateAchievementProgress(userId: string, achievementId: string, progress: number): void {
    if (!this.db.playerAchievements[userId]) {
      this.db.playerAchievements[userId] = [];
    }

    const achievement = this.db.playerAchievements[userId].find(
      a => a.achievementId === achievementId
    );

    if (achievement) {
      achievement.progress = Math.min(100, progress);
      
      if (achievement.progress >= 100 && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
      }
    } else {
      this.db.playerAchievements[userId].push({
        userId,
        achievementId,
        unlockedAt: new Date(),
        progress: Math.min(100, progress),
        isUnlocked: progress >= 100
      });
    }

    this.saveDatabase();
  }

  /**
   * 备份数据库
   */
  backup(): void {
    const backupPath = this.dbPath.replace('.json', `.backup.${Date.now()}.json`);
    fs.copyFileSync(this.dbPath, backupPath);
    console.log(`✅ 数据库已备份到: ${backupPath}`);
  }

  /**
   * 获取数据库统计信息
   */
  getStats() {
    return {
      totalPlayers: Object.keys(this.db.players).length,
      totalGames: this.db.scoreChanges.filter(c => c.reason.startsWith('game_')).length,
      totalScoreChanges: this.db.scoreChanges.length,
      lastUpdated: this.db.lastUpdated
    };
  }
}

// 导出单例
export const scoreDAO = new ScoreDAO();
