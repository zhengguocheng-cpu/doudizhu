/**
 * 出牌处理器
 * 负责处理游戏中的出牌逻辑
 */

import { Server } from 'socket.io';
import { CardTypeDetector, CardPattern, CardType } from './CardTypeDetector';
import { CardPlayValidator } from './CardPlayValidator';
import { roomService } from '../room/roomService';
import { ScoreCalculator } from './ScoreCalculator';
import { scoreService } from '../score/ScoreService';
import { GameRecord } from '../../models/ScoreRecord';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { playHintService } from '../llm/PlayHintService';

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
        console.log(`🔍 [调试] requestSocketId: ${requestSocketId}, userId: ${userId}`);
        
        // 修复：使用 Socket ID 直接发送，确保消息能到达
        if (requestSocketId) {
          console.log(`📤 [调试] 向 Socket ${requestSocketId} 发送 play_cards_failed 事件`);
          this.io.to(requestSocketId).emit('play_cards_failed', {
            error: validation.error
          });
          console.log(`✅ [调试] play_cards_failed 事件已发送`);
        } else {
          console.log(`📤 [调试] 通过 emitToPlayer 发送 play_cards_failed 事件`);
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
      // 记录最近一手出牌（用于断线重连恢复桌面牌）
      room.gameState.lastPlay = {
        playerId: userId,
        playerName: player.name,
        cards,
        type: validation.pattern?.type || undefined,
      };

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
        lastPlay: room.gameState.lastPlay,
        isNewRound: false,
        passCount: 0,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          cardCount: p.cardCount,
          score: (p as any).score ?? 0,
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

      // 将“不出(PASS)”也记录到出牌历史中，便于后续 AI 分析和计分
      if (!room.gameState.playHistory) {
        room.gameState.playHistory = [];
      }
      room.gameState.playHistory.push({
        playerId: userId,
        playerName: player.name,
        cards: [],
        cardType: null,
        timestamp: new Date(),
      });

      console.log(`✅ 玩家 ${userId} 不出，连续不出: ${room.gameState.passCount}`);

      // 广播不出消息
      this.io.to(`room_${roomId}`).emit('player_passed', {
        playerId: userId,
        playerName: player.name
      });

      // 如果连续2个玩家不出，开始新一轮；否则切换到下一个玩家
      if (room.gameState.passCount >= 2) {
        console.log(`🔄 连续2人不出，开始新一轮，由 ${room.gameState.lastPlayerId} 先出`);
        this.startNewRound(roomId, room.gameState.lastPlayerId);
      } else {
        // 切换到下一个玩家
        this.nextPlayer(roomId);
      }

      // 在更新完当前回合玩家和轮次后，再保存游戏状态（用于玩家重连）
      roomService.saveGameState(roomId, {
        phase: room.gameState.phase || 'playing',
        currentPlayerId: room.gameState.currentPlayerId,
        lastPlayerId: room.gameState.lastPlayerId,
        lastPlayedCards: room.gameState.lastPlayedCards,
        lastPattern: room.gameState.lastPattern,
        lastPlay: room.gameState.lastPlay,
        isNewRound: room.gameState.isNewRound,
        passCount: room.gameState.passCount,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          cardCount: p.cardCount,
          score: (p as any).score ?? 0,
        })),
        landlordId: room.gameState.landlordId,
        bottomCards: room.gameState.bottomCards
      });

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

    // 在清空手牌之前，记录所有玩家剩余手牌，用于前端在结算时展示
    const remainingHands: { [playerId: string]: { playerId: string; playerName: string; cards: string[] } } = {};
    for (const p of room.players) {
      const handCards: string[] = Array.isArray(p.cards) ? [...p.cards] : [];
      remainingHands[p.id] = {
        playerId: p.id,
        playerName: p.name,
        cards: handCards,
      };
    }

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

    // 组装完整对局日志并写入文件，供后续大模型训练/审核使用
    try {
      const gameMeta: any = (room as any).gameLogMeta || {};

      const startedAtStr = typeof gameMeta.startedAt === 'string'
        ? gameMeta.startedAt
        : gameTimestamp.toISOString();
      let durationMs: number | undefined;
      try {
        const startedAtDate = new Date(startedAtStr);
        if (!Number.isNaN(startedAtDate.getTime())) {
          durationMs = gameTimestamp.getTime() - startedAtDate.getTime();
        }
      } catch {
        // ignore
      }

      const playersMeta = Array.isArray(gameMeta.players) ? gameMeta.players : [];
      const playersForLog = room.players.map((p: any, index: number) => {
        const metaPlayer = playersMeta.find((mp: any) => mp.playerId === p.id) || {};
        const remaining = remainingHands[p.id];

        return {
          playerId: p.id,
          playerName: p.name,
          seatIndex: typeof metaPlayer.seatIndex === 'number' ? metaPlayer.seatIndex : index,
          isBot: !!p.isBot,
          role: p.role,
          initialCards: Array.isArray(metaPlayer.initialCards) ? [...metaPlayer.initialCards] : [],
          finalCards: remaining && Array.isArray(remaining.cards) ? [...remaining.cards] : [],
        };
      });

      const biddingMeta = gameMeta.bidding || {};
      const biddingLog = {
        order: Array.isArray(biddingMeta.order)
          ? [...biddingMeta.order]
          : Array.isArray((room as any).biddingState?.biddingOrder)
            ? [...(room as any).biddingState.biddingOrder]
            : [],
        bids: Array.isArray(biddingMeta.bids)
          ? biddingMeta.bids.map((b: any) => ({
              userId: b.userId,
              bid: !!b.bid,
              timestamp: typeof b.timestamp === 'string'
                ? b.timestamp
                : new Date().toISOString(),
            }))
          : [],
      };

      const rawHistory = room.gameState?.playHistory || [];
      const playHistory = Array.isArray(rawHistory)
        ? rawHistory.map((entry: any, index: number) => ({
            index,
            playerId: entry.playerId,
            playerName: entry.playerName,
            action:
              Array.isArray(entry.cards) && entry.cards.length > 0
                ? 'play'
                : 'pass',
            cards: Array.isArray(entry.cards) ? [...entry.cards] : [],
            cardType: entry.cardType || null,
            timestamp:
              entry.timestamp instanceof Date
                ? entry.timestamp.toISOString()
                : typeof entry.timestamp === 'string'
                  ? entry.timestamp
                  : new Date().toISOString(),
          }))
        : [];

      const resultLog = {
        winnerId: winner.id,
        winnerName: winner.name,
        winnerRole: winner.role,
        landlordWin,
        baseScore: gameScore.baseScore,
        bombCount: gameScore.bombCount,
        rocketCount: gameScore.rocketCount,
        isSpring: gameScore.isSpring,
        isAntiSpring: gameScore.isAntiSpring,
        multipliers: gameScore.playerScores[0]?.multipliers || null,
        playerScores: gameScore.playerScores.map((ps) => ({
          playerId: ps.playerId,
          playerName: ps.playerName,
          role: ps.role,
          isWinner: ps.isWinner,
          baseScore: ps.baseScore,
          multipliers: ps.multipliers,
          finalScore: ps.finalScore,
        })),
      };

      const fullLog = {
        version: '1.0.0',
        gameId,
        roomId,
        startedAt: startedAtStr,
        endedAt: gameTimestamp.toISOString(),
        durationMs,
        players: playersForLog,
        bottomCards: Array.isArray(gameMeta.bottomCards) ? [...gameMeta.bottomCards] : [],
        landlordId:
          gameMeta.landlordId ||
          (room.gameState && (room.gameState as any).landlordId) ||
          null,
        landlordCardsAfterBottom: Array.isArray(gameMeta.landlordCardsAfterBottom)
          ? [...gameMeta.landlordCardsAfterBottom]
          : [],
        bidding: biddingLog,
        playHistory,
        result: resultLog,
        remainingHands,
        hintHistory: room.gameState?.hintHistory || [],
      };

      // 广播游戏结束（包含得分信息、成就、每个玩家的剩余手牌以及本局 AI 提示历史）
      // 提前发送给前端，避免后续同步写日志阻塞导致结算面板延迟出现
      this.io.to(`room_${roomId}`).emit('game_over', {
        winnerId: winner.id,
        winnerName: winner.name,
        winnerRole: winner.role,
        landlordWin: landlordWin,
        score: gameScore,  // 添加得分信息
        achievements,      // 添加成就信息
        remainingHands,    // 各玩家剩余手牌
        hintHistory: room.gameState?.hintHistory || [], // 本局所有提示请求与 DeepSeek 返回
      });

      const logDir = config.paths.gameLogs;
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const safeRoomId = String(roomId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `GAME_${gameId}_${safeRoomId}.json`;
      const filePath = path.join(logDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(fullLog, null, 2), 'utf-8');

      const summaryFile = path.join(logDir, 'all_games.jsonl');
      fs.appendFileSync(summaryFile, JSON.stringify(fullLog) + '\n', 'utf-8');

      console.log(`📝 已写入对局日志: ${fileName}`);
    } catch (error) {
      console.error('写入对局日志失败:', error);
    }

    // 重置房间状态为waiting，允许再来一局
    room.status = 'waiting';
    room.gameState = null;

    // 同步清除持久化的游戏状态，避免下一次进入房间被误判为断线重连
    // 否则 join_game 时会读取旧的 gameState，触发 game_state_restored，导致上一局手牌被恢复
    try {
      roomService.clearGameState(roomId);
      console.log(`🗑️ 清除房间 ${roomId} 的持久化游戏状态（游戏结束）`);
    } catch (error) {
      console.warn(`⚠️ 清除房间 ${roomId} 游戏状态失败，不影响当前房间重置:`, error);
    }
    
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

    this.io.to(`room_${roomId}`).emit('turn_to_play', {
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      isFirstPlay: room.gameState.isNewRound,
      lastPattern: room.gameState.lastPattern
    });

    this.scheduleBotAction(roomId);
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

    this.scheduleBotAction(roomId);
  }

  public triggerBotAction(roomId: string): void {
    this.scheduleBotAction(roomId);
  }

  private scheduleBotAction(roomId: string): void {
    const room = roomService.getRoom(roomId) as any;
    if (!room || !room.gameState) return;

    const currentPlayerId = room.gameState.currentPlayerId;
    const currentPlayer = room.players.find((p: any) => p.id === currentPlayerId);

    if (!currentPlayer || !currentPlayer.isBot) return;

    const delay = 220 + Math.floor(Math.random() * 180); // ≈0.22~0.4 秒，进一步加快机器人出牌速度

    setTimeout(async () => {
      const latestRoom = roomService.getRoom(roomId) as any;
      if (!latestRoom || !latestRoom.gameState) return;

      const latestCurrentId = latestRoom.gameState.currentPlayerId;
      const player = latestRoom.players.find((p: any) => p.id === latestCurrentId);
      if (!player || !player.isBot) return;

      // 1) 优先使用与真人提示相同的 LLM 提示系统
      try {
        const hint = await playHintService.getPlayHint(roomId, player.id);
        if (hint && hint.success && Array.isArray(hint.cards)) {
          const llmCards = hint.cards;
          if (llmCards.length > 0) {
            this.handlePlayCards(roomId, player.id, llmCards);
          } else {
            this.handlePass(roomId, player.id);
          }
          return; // 已根据 LLM 结果完成出牌/不出
        }
      } catch (e) {
        console.warn('🤖 [BotHint] 调用 LLM 提示失败，使用本地机器人逻辑兜底:', e);
      }

      // 2) LLM 不可用或未返回有效结果时，回退到原有机器人逻辑
      const cardsToPlay = this.decideBotPlay(latestRoom, player);

      if (cardsToPlay && cardsToPlay.length > 0) {
        this.handlePlayCards(roomId, player.id, cardsToPlay);
      } else {
        if (latestRoom.gameState.isNewRound) {
          const fallback = this.decideMinSingle(player);
          if (fallback.length > 0) {
            this.handlePlayCards(roomId, player.id, fallback);
          } else {
            this.handlePass(roomId, player.id);
          }
        } else {
          this.handlePass(roomId, player.id);
        }
      }
    }, delay);
  }

  private decideBotPlay(room: any, player: any): string[] | null {
    const cards: string[] = Array.isArray(player.cards) ? [...player.cards] : [];
    if (cards.length === 0) return null;

    const gameState = room.gameState;
    const lastPattern: CardPattern | null = gameState.lastPattern || null;

    const isNewRound = gameState.isNewRound || !lastPattern;
    if (isNewRound) {
      // 新回合时，智能选择最优牌型（优先出对子、三张等组合牌）
      return this.decideBestOpeningPlay(cards);
    }

    if (!lastPattern) {
      return this.decideBestOpeningPlay(cards);
    }

    // 根据上家牌型选择对应的出牌
    switch (lastPattern.type) {
      case CardType.SINGLE:
        return this.findSingleToBeat(cards, lastPattern.value);
      case CardType.PAIR:
        return this.findPairToBeat(cards, lastPattern.value);
      case CardType.TRIPLE:
        return this.findTripleToBeat(cards, lastPattern.value);
      case CardType.TRIPLE_WITH_SINGLE:
        return this.findTripleWithSingleToBeat(cards, lastPattern.value);
      case CardType.BOMB:
        return this.findBombToBeat(cards, lastPattern.value);
      default:
        return null;
    }
  }

  /**
   * 智能选择开局出牌：优先出对子、三张等组合牌，最后才出单张
   */
  private decideBestOpeningPlay(cards: string[]): string[] {
    if (cards.length === 0) return [];

    // 统计牌型
    const groups: Record<string, string[]> = {};
    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🀏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    const ranksInOrder = Object.keys(groups).sort(
      (a, b) => CardTypeDetector.getCardValue(groups[a][0]) - CardTypeDetector.getCardValue(groups[b][0]),
    );
    const bombRanks = ranksInOrder.filter((r) => groups[r].length === 4);
    const hasNonBombRanks = ranksInOrder.some((r) => groups[r].length < 4);

    // 如果整手牌只有炸弹（或多组炸弹）而没有其他牌型，则出点数最小的一组炸弹
    if (!hasNonBombRanks && bombRanks.length > 0) {
      const smallestBombRank = bombRanks[0];
      return groups[smallestBombRank].slice(0, 4);
    }
    
    // 手牌很多（>=10）时认为是前期：目前主要用于后续策略扩展，这里先保留该标记
    const isEarlyPhase = cards.length >= 10;

    // 0. 无论前期还是后期，都优先尝试出一手完整的“飞机带翅膀”（先带对，再带单）
    const planeWithPairs = this.findBestPlaneWithWings(cards, true);
    if (planeWithPairs && planeWithPairs.length > 0) {
      return planeWithPairs;
    }

    const planeWithSingles = this.findBestPlaneWithWings(cards, false);
    if (planeWithSingles && planeWithSingles.length > 0) {
      return planeWithSingles;
    }

    // 1. 首家出牌时，三张优先尝试带小对或小单（尽量多出牌），找不到合适翅膀再考虑纯三张
    // 1.1 优先出三带二 / 三带一（尽量多出牌），对子优先用小对
    for (const rank of ranksInOrder) {
      const arr = groups[rank];
      // 只在正好三张时考虑三带，避免随意拆炸弹
      if (arr.length === 3) {
        const triple = arr.slice(0, 3);

        // 先找小对，出三带二（对子只用非炸弹点数）
        const pairCandidates = ranksInOrder.filter(
          (r) => r !== rank && groups[r].length >= 2 && groups[r].length < 4,
        );

        if (pairCandidates.length > 0) {
          if (pairCandidates.length > 1) {
            // 有不止一个对子时，直接用最小的对子
            const smallPairRank = pairCandidates[0];
            const pair = groups[smallPairRank].slice(0, 2);
            return [...triple, ...pair];
          }

          // 只有一个对子时，如果出完这手后牌已经很少，可以接受用这个对子；否则改用三带一
          const onlyPairRank = pairCandidates[0];
          const remainingAfterTriplePair = cards.length - 5; // 三张 + 一对 共 5 张

          if (remainingAfterTriplePair <= 3) {
            const pair = groups[onlyPairRank].slice(0, 2);
            return [...triple, ...pair];
          }
        }

        // 如果没有合适的小对，再找一张小单牌，出三带一（不拆炸弹）
        const singleRank = ranksInOrder.find(
          (r) => r !== rank && groups[r].length >= 1 && groups[r].length < 4,
        );
        if (singleRank) {
          const single = groups[singleRank][0];
          return [...triple, single];
        }
      }
    }

    // 1.2 如果没法带对/单，再退而求其次出纯三张（最小的）
    for (const rank of ranksInOrder) {
      if (groups[rank].length === 3) {
        return groups[rank].slice(0, 3);
      }
    }

    // 2. 再其次出对子（最小的）——前期和后期都可以用的小牌优先策略
    for (const rank of ranksInOrder) {
      const len = groups[rank].length;
      // 只从恰好两张或三张的点数中取对子，避免从炸弹拆对子
      if (len === 2 || len === 3) {
        return groups[rank].slice(0, 2);
      }
    }

    // 3. 最后出单张（最小的）
    const sorted = [...cards].sort((a, b) => CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b));
    return [sorted[0]];
  }

  /**
   * 找到一手“飞机带翅膀”作为首家出牌：
   * - 飞机主体只使用恰好三张的连续点数（不拆炸弹）
   * - wingsPreferPairs=true 时优先寻找每个三张对应的一对；若不足，再交由外部调用 fallback 为单牌方案
   * - wingsPreferPairs=false 时寻找每个三张对应的一张单牌
   */
  private findBestPlaneWithWings(cards: string[], wingsPreferPairs: boolean): string[] | null {
    if (cards.length < 8) return null; // 最少 2 组三张 + 2 张翅膀

    const groups: Record<string, string[]> = {};
    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    // 找出所有恰好三张的点数，按点数从小到大排序
    const tripleRanks = Object.keys(groups)
      .filter((rank) => groups[rank].length === 3)
      .sort(
        (a, b) =>
          CardTypeDetector.getCardValue(groups[a][0]) -
          CardTypeDetector.getCardValue(groups[b][0]),
      );

    if (tripleRanks.length < 2) return null;

    // 在 tripleRanks 中找连续点数组成飞机主体
    const triplesWithValue = tripleRanks.map((rank) => ({
      rank,
      value: CardTypeDetector.getCardValue(groups[rank][0]),
    }));

    let bestCombo: string[] | null = null;

    let start = 0;
    for (let i = 1; i <= triplesWithValue.length; i++) {
      const prev = triplesWithValue[i - 1];
      const curr = triplesWithValue[i];
      const isEnd =
        i === triplesWithValue.length ||
        !curr ||
        curr.value !== prev.value + 1;

      if (isEnd) {
        const run = triplesWithValue.slice(start, i);
        if (run.length >= 2) {
          const planeRanks = run.map((x) => x.rank);
          const planeCount = planeRanks.length;

          // 构造飞机主体：每个点数取 3 张
          const body: string[] = [];
          for (const r of planeRanks) {
            const g = groups[r];
            body.push(g[0], g[1], g[2]);
          }

          // 剩余牌用于找翅膀
          const planeRankSet = new Set(planeRanks);
          const otherRanks = Object.keys(groups)
            .filter((r) => !planeRankSet.has(r))
            .sort(
              (a, b) =>
                CardTypeDetector.getCardValue(groups[a][0]) -
                CardTypeDetector.getCardValue(groups[b][0]),
            );

          if (wingsPreferPairs) {
            // 优先带对：从剩余点数中找 planeCount 个小对子（不拆炸弹）
            const wingsPairs: string[][] = [];
            for (const r of otherRanks) {
              const arr = groups[r];
              const len = arr.length;
              if (len >= 2 && len < 4) {
                wingsPairs.push([arr[0], arr[1]]);
                if (wingsPairs.length >= planeCount) break;
              }
            }

            if (wingsPairs.length === planeCount) {
              const wings = wingsPairs.flat();
              const combo = [...body, ...wings];
              if (!bestCombo) {
                bestCombo = combo;
              }
            }
          } else {
            // 带单：从剩余点数中找 planeCount 个小单牌（不拆炸弹）
            const singles: string[] = [];
            for (const r of otherRanks) {
              const arr = groups[r];
              const len = arr.length;
              if (len >= 1 && len < 4) {
                singles.push(arr[0]);
                if (singles.length >= planeCount) break;
              }
            }

            if (singles.length === planeCount) {
              const combo = [...body, ...singles];
              if (!bestCombo) {
                bestCombo = combo;
              }
            }
          }
        }
        start = i;
      }
    }

    return bestCombo;
  }

  private decideMinSingle(player: any): string[] {
    const cards: string[] = Array.isArray(player.cards) ? [...player.cards] : [];
    if (cards.length === 0) return [];
    const sorted = cards.sort((a, b) => CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b));
    return sorted.length > 0 ? [sorted[0]] : [];
  }

  private findSingleToBeat(cards: string[], minValue: number): string[] | null {
    const sorted = [...cards].sort(
      (a, b) => CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b),
    );

    for (const c of sorted) {
      if (CardTypeDetector.getCardValue(c) > minValue) {
        return [c];
      }
    }

    return null;
  }

  private findPairToBeat(cards: string[], minValue: number): string[] | null {
    const groups: Record<string, string[]> = {};

    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    const candidates: { value: number; pair: string[] }[] = [];

    for (const rank of Object.keys(groups)) {
      const arr = groups[rank];
      if (arr.length >= 2) {
        const pair = arr.slice(0, 2);
        const value = CardTypeDetector.getCardValue(pair[0]);
        if (value > minValue) {
          candidates.push({ value, pair });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.value - b.value);
    return candidates[0].pair;
  }

  /**
   * 找到能压过上家的三张
   */
  private findTripleToBeat(cards: string[], minValue: number): string[] | null {
    const groups: Record<string, string[]> = {};

    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    const candidates: { value: number; triple: string[] }[] = [];

    for (const rank of Object.keys(groups)) {
      const arr = groups[rank];
      if (arr.length >= 3) {
        const triple = arr.slice(0, 3);
        const value = CardTypeDetector.getCardValue(triple[0]);
        if (value > minValue) {
          candidates.push({ value, triple });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.value - b.value);
    return candidates[0].triple;
  }

  /**
   * 找到能压过上家的三带一
   */
  private findTripleWithSingleToBeat(cards: string[], minValue: number): string[] | null {
    const groups: Record<string, string[]> = {};

    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    // 找三张
    for (const rank of Object.keys(groups).sort((a, b) => 
      CardTypeDetector.getCardValue(groups[a][0]) - CardTypeDetector.getCardValue(groups[b][0])
    )) {
      const arr = groups[rank];
      if (arr.length >= 3) {
        const value = CardTypeDetector.getCardValue(arr[0]);
        if (value > minValue) {
          const triple = arr.slice(0, 3);
          // 找一张单牌（最小的）
          for (const otherRank of Object.keys(groups)) {
            if (otherRank !== rank && groups[otherRank].length > 0) {
              return [...triple, groups[otherRank][0]];
            }
          }
          // 如果没有其他牌，就出三张
          return triple;
        }
      }
    }

    return null;
  }

  /**
   * 找到能压过上家的炸弹
   */
  private findBombToBeat(cards: string[], minValue: number): string[] | null {
    const groups: Record<string, string[]> = {};

    for (const c of cards) {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '');
      if (!groups[rank]) groups[rank] = [];
      groups[rank].push(c);
    }

    const candidates: { value: number; bomb: string[] }[] = [];

    for (const rank of Object.keys(groups)) {
      const arr = groups[rank];
      if (arr.length === 4) {
        const value = CardTypeDetector.getCardValue(arr[0]);
        if (value > minValue) {
          candidates.push({ value, bomb: arr });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.value - b.value);
    return candidates[0].bomb;
  }

  /**
   * 根据用户ID查找Socket ID
   */
  private findSocketIdByUserId(userId: string): string {
    const sockets = Array.from(this.io.sockets.sockets.values());
    for (const socket of sockets) {
      const authData = (socket as any).handshake?.auth;
      if (authData?.userId === userId) {
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
