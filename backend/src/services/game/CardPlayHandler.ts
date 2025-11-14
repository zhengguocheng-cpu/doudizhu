/**
 * 出牌处理器
 * 负责处理游戏中的出牌逻辑
 */

import { Server } from 'socket.io';
import { CardTypeDetector, CardPattern } from './CardTypeDetector';
import { CardPlayValidator } from './CardPlayValidator';
import { roomService } from '../room/roomService';
import { ScoreCalculator } from './ScoreCalculator';
import { scoreService } from '../score/ScoreService';
import { GameRecord } from '../../models/ScoreRecord';
import { v4 as uuidv4 } from 'uuid';

export class CardPlayHandler {
  constructor(private io: Server) {}

  /**
   * 处理玩家出牌
   */
  public handlePlayCards(roomId: string, userId: string, cards: string[], requestSocketId?: string): void {
    console.log(`🎴 玩家 ${userId} 尝试出牌:`, cards);

    try {
      // 获取房间
      const room = roomService.getRoom(roomId) as any;
      if (!room) {
        console.error(`❌ 房间 ${roomId} 不存在`);
        return;
      }

      // 检查游戏状态
      if (!room.gameState) {
        console.error(`❌ 房间 ${roomId} 游戏未开始`);
        return;
      }

      // 检查是否轮到该玩家
      if (room.gameState.currentPlayerId !== userId) {
        console.error(`❌ 不是玩家 ${userId} 的回合`);
        // 修复：使用 Socket ID 直接发送，确保消息能到达
        if (requestSocketId) {
          this.io.to(requestSocketId).emit('play_cards_failed', {
            error: '还没轮到你出牌'
          });
        } else {
          this.emitToPlayer(userId, requestSocketId, 'play_cards_failed', {
            error: '还没轮到你出牌'
          });
        }
        return;
      }

      // 获取玩家信息
      const player = room.players.find((p: any) => p.id === userId);
      if (!player) {
        console.error(`❌ 玩家 ${userId} 不在房间中`);
        return;
      }

      // 验证出牌
      const validation = CardPlayValidator.validate(
        player.cards,
        cards,
        room.gameState.lastPattern,
        room.gameState.isNewRound
      );

      if (!validation.valid) {
        console.error(`❌ 出牌验证失败: ${validation.error}`);
        // 修复：使用 Socket ID 直接发送，确保消息能到达
        if (requestSocketId) {
          this.io.to(requestSocketId).emit('play_cards_failed', {
            error: validation.error
          });
        } else {
          this.emitToPlayer(userId, requestSocketId, 'play_cards_failed', {
            error: validation.error
          });
        }
        return;
      }

      // 从玩家手牌中移除已出的牌
      for (const card of cards) {
        const index = player.cards.indexOf(card);
        if (index > -1) {
          player.cards.splice(index, 1);
        }
      }
      player.cardCount = player.cards.length;

      // 更新游戏状态
      room.gameState.lastPlayedCards = validation.pattern;
      room.gameState.lastPlayerId = userId;
      room.gameState.lastPattern = validation.pattern;  // 🔧 修复：同时更新lastPattern

      // 记录出牌历史（用于计分）
      if (!room.gameState.playHistory) {
        room.gameState.playHistory = [];
      }
      room.gameState.playHistory.push({
        playerId: userId,
        playerName: player.name,
        cards: cards,
        cardType: validation.pattern,
        timestamp: new Date()
      });

      room.gameState.passCount = 0;
      room.gameState.isNewRound = false;

      console.log(`✅ 玩家 ${userId} 出牌成功:`, cards);
      console.log(`   牌型: ${validation.pattern?.type}, 剩余: ${player.cardCount}张`);

      // 广播出牌结果
      this.io.to(`room_${roomId}`).emit('cards_played', {
        playerId: userId,
        playerName: player.name,
        cards: cards,
        cardType: validation.pattern,  // 前端期望cardType字段
        remainingCards: player.cardCount
      });

      // 检查游戏是否结束
      if (this.checkGameOver(roomId, userId)) {
        return;
      }

      // 切换到下一个玩家
      this.nextPlayer(roomId);

      // 保存游戏状态（用于玩家重连）
      roomService.saveGameState(roomId, {
        phase: room.gameState.phase || 'playing',
        currentPlayerId: room.gameState.currentPlayerId,
        lastPlayerId: userId,
        lastPlayedCards: validation.pattern,
        lastPattern: validation.pattern,
        isNewRound: false,
        passCount: 0,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          cardCount: p.cardCount
        })),
        landlordId: room.gameState.landlordId,
        bottomCards: room.gameState.bottomCards
      });

    } catch (error) {
      console.error('出牌处理错误:', error);
    }
  }

  /**
   * 处理玩家不出（跟牌）
   */
  public handlePass(roomId: string, userId: string, requestSocketId?: string): void {
    console.log(`🚫 玩家 ${userId} 选择不出`);

    try {
      // 获取房间
      const room = roomService.getRoom(roomId) as any;
      if (!room) {
        console.error(`❌ 房间 ${roomId} 不存在`);
        return;
      }

      // 检查游戏状态
      if (!room.gameState) {
        console.error(`❌ 房间 ${roomId} 游戏未开始`);
        return;
      }

      // 检查是否轮到该玩家
      if (room.gameState.currentPlayerId !== userId) {
        console.error(`❌ 不是玩家 ${userId} 的回合`);
        return;
      }

      // 不能在新一轮的首次出牌时选择不出
      if (room.gameState.isNewRound) {
        // 修复：使用 Socket ID 直接发送，确保消息能到达
        if (requestSocketId) {
          this.io.to(requestSocketId).emit('play_cards_failed', {
            error: '新一轮必须出牌'
          });
        } else {
          this.emitToPlayer(userId, requestSocketId, 'play_cards_failed', {
            error: '新一轮必须出牌'
          });
        }
        return;
      }

      // 获取玩家信息
      const player = room.players.find((p: any) => p.id === userId);
      if (!player) {
        console.error(`❌ 玩家 ${userId} 不在房间中`);
        return;
      }

      // 增加不出计数
      room.gameState.passCount++;

      console.log(`✅ 玩家 ${userId} 不出，连续不出: ${room.gameState.passCount}`);

      // 保存游戏状态（用于玩家重连）
      roomService.saveGameState(roomId, {
        phase: room.gameState.phase || 'playing',
        currentPlayerId: room.gameState.currentPlayerId,
        lastPlayerId: room.gameState.lastPlayerId,
        lastPlayedCards: room.gameState.lastPlayedCards,
        lastPattern: room.gameState.lastPattern,
        isNewRound: room.gameState.isNewRound,
        passCount: room.gameState.passCount,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          cardCount: p.cardCount
        })),
        landlordId: room.gameState.landlordId,
        bottomCards: room.gameState.bottomCards
      });

      // 广播不出消息
      this.io.to(`room_${roomId}`).emit('player_passed', {
        playerId: userId,
        playerName: player.name
      });

      // 如果连续2个玩家不出，开始新一轮
      if (room.gameState.passCount >= 2) {
        console.log(`🔄 连续2人不出，开始新一轮，由 ${room.gameState.lastPlayerId} 先出`);
        this.startNewRound(roomId, room.gameState.lastPlayerId);
      } else {
        // 切换到下一个玩家
        this.nextPlayer(roomId);
      }

    } catch (error) {
      console.error('不出处理错误:', error);
    }
  }

  /**
   * 检查游戏是否结束
   */
  private checkGameOver(roomId: string, winnerId: string): boolean {
    const room = roomService.getRoom(roomId) as any;
    if (!room) return false;

    const winner = room.players.find((p: any) => p.id === winnerId);
    if (!winner || winner.cardCount > 0) {
      return false;
    }

    console.log(`🎊 游戏结束！获胜者: ${winner.name}`);

    // 判断地主是否获胜
    const landlordWin = winner.role === 'landlord';

    // 计算得分
    const gameScore = ScoreCalculator.calculateGameScore(
      room.players,
      winner.id,
      room.gameState?.playHistory || []
    );

    console.log('💰 游戏得分:', gameScore);

    // 记录每个玩家的积分变化
    const gameId = uuidv4();
    const gameTimestamp = new Date();
    const achievements: { [userId: string]: string[] } = {};

    for (const playerScore of gameScore.playerScores) {
      const player = room.players.find((p: any) => p.id === playerScore.playerId);
      if (!player) continue;

      // 创建游戏记录
      const gameRecord: GameRecord = {
        gameId,
        timestamp: gameTimestamp,
        roomId,
        role: playerScore.role,
        isWinner: playerScore.playerId === winner.id,
        scoreChange: playerScore.finalScore,
        multipliers: playerScore.multipliers,
        opponents: room.players
          .filter((p: any) => p.id !== playerScore.playerId)
          .map((p: any) => p.id),
        tags: []
      };

      // 添加特殊标记
      if (gameScore.isSpring) gameRecord.tags?.push('春天');
      if (gameScore.isAntiSpring) gameRecord.tags?.push('反春');
      if (gameScore.bombCount > 0) gameRecord.tags?.push(`炸弹×${gameScore.bombCount}`);
      if (gameScore.rocketCount > 0) gameRecord.tags?.push(`王炸×${gameScore.rocketCount}`);

      // 记录积分
      try {
        const result = scoreService.recordGameResult(
          playerScore.playerId,
          player.name,
          gameRecord
        );

        achievements[playerScore.playerId] = result.achievements;

        console.log(`📊 ${player.name} 积分: ${result.scoreChange > 0 ? '+' : ''}${result.scoreChange} → ${result.newScore}`);
        
        if (result.achievements.length > 0) {
          console.log(`🏆 ${player.name} 解锁成就:`, result.achievements);
        }
      } catch (error) {
        console.error(`记录玩家 ${player.name} 积分失败:`, error);
      }
    }

    // 广播游戏结束（包含得分信息和成就）
    this.io.to(`room_${roomId}`).emit('game_over', {
      winnerId: winner.id,
      winnerName: winner.name,
      winnerRole: winner.role,
      landlordWin: landlordWin,
      score: gameScore,  // 添加得分信息
      achievements  // 添加成就信息
    });

    // 重置房间状态为waiting，允许再来一局
    room.status = 'waiting';
    room.gameState = null;
    
    // 重置所有玩家的准备状态
    room.players.forEach((p: any) => {
      p.ready = false;
      p.role = null;
      p.cards = [];
      p.cardCount = 0;
    });
    
    console.log(`🔄 房间${roomId}已重置，可以开始新一局`);

    return true;
  }

  /**
   * 切换到下一个玩家
   */
  private nextPlayer(roomId: string): void {
    const room = roomService.getRoom(roomId) as any;
    if (!room || !room.gameState) return;

    // 找到当前玩家的索引
    const currentIndex = room.players.findIndex(
      (p: any) => p.id === room.gameState.currentPlayerId
    );

    if (currentIndex === -1) {
      console.error('❌ 找不到当前玩家');
      return;
    }

    // 下一个玩家（顺时针）
    const nextIndex = (currentIndex + 1) % room.players.length;
    const nextPlayer = room.players[nextIndex];

    room.gameState.currentPlayerId = nextPlayer.id;

    console.log(`➡️ 轮到下一个玩家: ${nextPlayer.name}`);

    // 通知所有玩家
    this.io.to(`room_${roomId}`).emit('turn_to_play', {
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      isFirstPlay: room.gameState.isNewRound,
      lastPattern: room.gameState.lastPattern
    });
  }

  /**
   * 开始新一轮
   */
  private startNewRound(roomId: string, startPlayerId: string): void {
    const room = roomService.getRoom(roomId) as any;
    if (!room || !room.gameState) return;

    // 重置游戏状态
    room.gameState.currentPlayerId = startPlayerId;
    room.gameState.lastPattern = null;
    room.gameState.passCount = 0;
    room.gameState.isNewRound = true;

    const startPlayer = room.players.find((p: any) => p.id === startPlayerId);

    console.log(`🔄 新一轮开始，由 ${startPlayer?.name} 先出`);

    // 广播新一轮开始
    this.io.to(`room_${roomId}`).emit('new_round_started', {
      startPlayerId: startPlayerId,
      startPlayerName: startPlayer?.name || startPlayerId
    });

    // 通知该玩家出牌
    this.io.to(`room_${roomId}`).emit('turn_to_play', {
      playerId: startPlayerId,
      playerName: startPlayer?.name || startPlayerId,
      isFirstPlay: true,
      lastPattern: null
    });
  }

  /**
   * 根据用户ID查找Socket ID
   */
  private findSocketIdByUserId(userId: string): string {
    const sockets = Array.from(this.io.sockets.sockets.values());
    for (const socket of sockets) {
      const authData = (socket as any).handshake?.auth;
      if (authData?.userId === userId || authData?.userName === userId) {
        return socket.id;
      }
    }
    return '';
  }

  private emitToPlayer(userId: string, requestSocketId: string | undefined, event: string, payload: any): void {
    if (requestSocketId) {
      this.io.to(requestSocketId).emit(event, payload);
      return;
    }

    const targetSocketId = this.findSocketIdByUserId(userId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit(event, payload);
    } else {
      console.warn(`⚠️ 未找到玩家 ${userId} 的 Socket，事件 ${event} 未能发送`);
    }
  }
}
