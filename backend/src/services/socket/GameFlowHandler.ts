/**
 * 游戏流程处理器
 * 负责发牌、开始游戏等核心游戏逻辑
 */

import { roomService } from '../room/roomService';
import { CardPlayHandler } from '../game/CardPlayHandler';

export class GameFlowHandler {
  private static instance: GameFlowHandler;
  private io: any;
  private cardPlayHandler: CardPlayHandler | null = null;

  private constructor() {}

  public static getInstance(): GameFlowHandler {
    if (!GameFlowHandler.instance) {
      GameFlowHandler.instance = new GameFlowHandler();
    }
    return GameFlowHandler.instance;
  }

  public initialize(io: any): void {
    this.io = io;
    this.cardPlayHandler = new CardPlayHandler(io);
    console.log('GameFlowHandler initialized with CardPlayHandler');
  }
  
  /**
   * 保存游戏状态
   */
  private saveGameState(roomId: string, gameState: any): void {
    roomService.saveGameState(roomId, gameState);
  }
  
  /**
   * 获取游戏状态
   */
  private getGameState(roomId: string): any | undefined {
    return roomService.getGameState(roomId);
  }

  /**
   * 如果当前轮到的是机器人，则在短暂延迟后自动执行抢地主决策
   */
  private scheduleBotBidIfNeeded(roomId: string): void {
    const room: any = roomService.getRoom(roomId);
    if (!room || !room.biddingState) {
      return;
    }

    const currentBidderId = room.biddingState.currentBidderId;
    const currentPlayer = room.players.find((p: any) => p.id === currentBidderId);

    if (!currentPlayer || !currentPlayer.isBot) {
      return;
    }

    const delay = 220 + Math.floor(Math.random() * 180); // ≈0.22~0.4 秒，让机器人抢地主更快

    setTimeout(() => {
      try {
        const latestRoom: any = roomService.getRoom(roomId);
        if (!latestRoom || !latestRoom.biddingState) {
          return;
        }

        // 如果当前轮到的玩家已经变化，则不再执行
        if (latestRoom.biddingState.currentBidderId !== currentBidderId) {
          return;
        }

        const latestPlayer = latestRoom.players.find((p: any) => p.id === currentBidderId);
        if (!latestPlayer || !latestPlayer.isBot) {
          return;
        }

        const bid = this.decideBotBid(latestPlayer);
        console.log(`🤖 机器人${latestPlayer.name} 自动${bid ? '抢' : '不抢'}地主`);
        this.handleBidLandlord(roomId, currentBidderId, bid);
      } catch (error) {
        console.error('机器人抢地主决策失败:', error);
      }
    }, delay);
  }

  /**
   * 简单的机器人抢地主决策：根据手牌中高牌数量决定是否抢
   */
  private decideBotBid(player: any): boolean {
    const cards: string[] = Array.isArray(player.cards) ? player.cards : [];

    // 统计 A、2、大小王、K 的数量
    const highRanks = ['A', '2', '🃏小王', '🃏大王', 'K'];
    let highCount = 0;

    for (const card of cards) {
      const rank = card.includes('🃏') ? card : card.slice(1);
      if (highRanks.includes(rank)) {
        highCount++;
      }
    }

    // 高牌很多时，基本都抢
    if (highCount >= 8) {
      return true;
    }

    // 高牌很少时，大概率不抢
    if (highCount <= 3) {
      return Math.random() < 0.2;
    }

    // 其他情况有一定概率抢
    return Math.random() < 0.6;
  }

  /**
   * 获取CardPlayHandler实例
   */
  public getCardPlayHandler(): CardPlayHandler | null {
    return this.cardPlayHandler;
  }

  /**
   * 开始游戏
   */
  public startGame(roomId: string): void {
    try {
      console.log(`🎮 开始游戏: 房间${roomId}`);
      
      const room = roomService.getRoom(roomId);
      if (!room) {
        console.error(`房间${roomId}不存在`);
        return;
      }

      if (!room.players || room.players.length !== 3) {
        console.error(`房间${roomId}玩家数量不足: ${room.players?.length}`);
        return;
      }

      // 更新房间状态为游戏中
      room.status = 'playing';

      // 发牌
      const dealResult = this.dealCards(room);
      
      // 通知所有玩家游戏开始
      this.io.to(`room_${roomId}`).emit('game_started', {
        roomId: roomId,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          ready: p.ready
        })),
        timestamp: new Date()
      });

      // 🔥 改用房间广播：发送所有玩家的牌，前端自己判断
      console.log(`📢 向房间 room_${roomId} 广播发牌事件`);
      
      this.io.to(`room_${roomId}`).emit('deal_cards_all', {
        players: room.players.map((player: any, index: number) => ({
          playerId: player.id,
          playerName: player.name,
          playerAvatar: player.avatar,
          playerReady: player.ready,
          position: player.position,
          cards: dealResult.playerCards[index],
          cardCount: dealResult.playerCards[index].length
        })),
        bottomCards: dealResult.bottomCards,
        bottomCardCount: dealResult.bottomCards.length
      });
      
      console.log(`✅ 发牌事件已广播给房间 room_${roomId}`);

      console.log(`✅ 游戏开始成功: 房间${roomId}`);
      
      // 保存游戏状态
      this.saveGameState(roomId, {
        phase: 'dealing',
        players: room.players.map((player: any, index: number) => ({
          id: player.id,
          name: player.name,
          cards: dealResult.playerCards[index],
          cardCount: dealResult.playerCards[index].length
        })),
        bottomCards: dealResult.bottomCards
      });

      // 延迟2秒后开始抢地主流程
      setTimeout(() => {
        this.startBidding(roomId);
      }, 2000);

    } catch (error) {
      console.error('开始游戏失败:', error);
    }
  }

  /**
   * 开始抢地主流程
   */
  private startBidding(roomId: string): void {
    try {
      console.log(`🎲 开始抢地主: 房间${roomId}`);
      
      const room: any = roomService.getRoom(roomId);
      if (!room) {
        console.error(`房间${roomId}不存在`);
        return;
      }

      // 随机选择第一个抢地主的玩家
      const firstBidderIndex = Math.floor(Math.random() * 3);
      const firstBidderId = room.players[firstBidderIndex].id;

      // 初始化抢地主状态
      room.biddingState = {
        currentBidderId: firstBidderId,
        bids: [],
        landlordId: null,
        biddingOrder: [
          room.players[firstBidderIndex].id,
          room.players[(firstBidderIndex + 1) % 3].id,
          room.players[(firstBidderIndex + 2) % 3].id
        ]
      };

      // 通知所有玩家开始抢地主
      this.io.to(`room_${roomId}`).emit('bidding_start', {
        roomId: roomId,
        firstBidderId: firstBidderId,
        firstBidderName: room.players[firstBidderIndex].name,
        bottomCards: room.bottomCards,
        bottomCardCount: room.bottomCards.length
      });

      console.log(`🎲 抢地主开始: 第一个玩家=${firstBidderId}`);

      // 如果第一个抢地主的是机器人，则自动执行抢地主决策
      this.scheduleBotBidIfNeeded(roomId);

    } catch (error) {
      console.error('开始抢地主失败:', error);
    }
  }

  /**
   * 处理抢地主
   */
  public handleBidLandlord(roomId: string, userId: string, bid: boolean): void {
    try {
      console.log(`🎲 玩家${userId}抢地主: ${bid ? '抢' : '不抢'}`);
      
      const room: any = roomService.getRoom(roomId);
      if (!room || !room.biddingState) {
        console.error(`房间${roomId}不存在或未开始抢地主`);
        return;
      }

      // 检查是否轮到该玩家
      if (room.biddingState.currentBidderId !== userId) {
        console.error(`不是玩家${userId}的回合`);
        return;
      }

      // 记录抢地主结果
      room.biddingState.bids.push({ userId, bid });

      // 如果选择抢，记录为潜在地主
      if (bid) {
        room.biddingState.landlordId = userId;
      }

      // 广播抢地主结果
      const currentPlayer = room.players.find((p: any) => p.id === userId);
      const currentIndex = room.biddingState.biddingOrder.indexOf(userId);
      const nextIndex = (currentIndex + 1) % 3;
      const nextBidderId = room.biddingState.biddingOrder[nextIndex];

      this.io.to(`room_${roomId}`).emit('bid_result', {
        userId: userId,
        userName: currentPlayer?.name || userId,
        bid: bid,
        nextBidderId: room.biddingState.bids.length < 3 ? nextBidderId : null
      });

      // 检查是否所有人都已抢地主
      if (room.biddingState.bids.length === 3) {
        // 确定地主
        this.determineLandlord(roomId);
      } else {
        // 更新当前抢地主的玩家
        room.biddingState.currentBidderId = nextBidderId;

        // 如果下一个玩家是机器人，则自动执行抢/不抢
        this.scheduleBotBidIfNeeded(roomId);
      }

    } catch (error) {
      console.error('处理抢地主失败:', error);
    }
  }

  /**
   * 确定地主
   */
  private determineLandlord(roomId: string): void {
    try {
      const room: any = roomService.getRoom(roomId);
      if (!room || !room.biddingState) {
        console.error(`房间${roomId}不存在或未开始抢地主`);
        return;
      }

      const landlordId = room.biddingState.landlordId;

      // 如果没有人抢地主，重新发牌
      if (!landlordId) {
        console.log(`❌ 没有人抢地主，重新发牌`);
        this.io.to(`room_${roomId}`).emit('no_landlord', {
          message: '没有人抢地主，重新发牌'
        });
        
        // 延迟2秒后重新开始游戏
        setTimeout(() => {
          this.startGame(roomId);
        }, 2000);
        return;
      }

      // 找到地主玩家
      const landlord = room.players.find((p: any) => p.id === landlordId);
      if (!landlord) {
        console.error(`找不到地主玩家${landlordId}`);
        return;
      }

      // 地主获得底牌
      if (!landlord.cards) {
        landlord.cards = [];
      }
      landlord.cards = landlord.cards.concat(room.bottomCards);
      this.sortCards(landlord.cards);

      // 设置角色
      room.players.forEach((p: any) => {
        p.role = p.id === landlordId ? 'landlord' : 'farmer';
      });

      // 设置游戏状态
      room.gameState = {
        landlordId: landlordId,
        currentPlayerId: landlordId, // 地主先出牌
        lastPlayedCards: null,
        lastPlayerId: null,
        lastPattern: null,  // 上家牌型
        passCount: 0,       // pass计数
        isNewRound: true,   // 地主第一次出牌，可以出任意牌型
        phase: 'playing',   // 进入出牌阶段
        bottomCards: room.bottomCards,
      };

      console.log(`👑 确定地主: ${landlord.name}`);

      // 在地主确定后保存当前游戏状态，供断线重连使用
      this.saveGameState(roomId, {
        phase: 'playing',
        landlordId: landlordId,
        currentPlayerId: landlordId,
        lastPlayedCards: null,
        lastPlayerId: null,
        lastPattern: null,
        isNewRound: true,
        passCount: 0,
        players: room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          cards: p.cards,
          cardCount: Array.isArray(p.cards) ? p.cards.length : (p.cardCount ?? 0),
          role: p.role,
        })),
        bottomCards: room.bottomCards,
      });

      // 通知所有玩家地主确定（包含地主的新手牌）
      console.log(`📢 向房间 room_${roomId} 广播地主确定事件`);
      
      this.io.to(`room_${roomId}`).emit('landlord_determined', {
        landlordId: landlordId,
        landlordName: landlord.name,
        bottomCards: room.bottomCards,
        landlordCards: landlord.cards, // 地主的完整手牌（包含底牌）
        landlordCardCount: landlord.cards.length,
        roles: room.players.reduce((acc: any, p: any) => {
          acc[p.id] = p.role;
          return acc;
        }, {})
      });
      
      console.log(`✅ 地主确定事件已广播: ${landlord.name} 成为地主，手牌${landlord.cards.length}张`);

      // 通知地主先出牌
      setTimeout(() => {
        this.io.to(`room_${roomId}`).emit('turn_to_play', {
          playerId: landlordId,
          playerName: landlord.name,
          isFirst: true,
          lastPattern: null
        });

        if (this.cardPlayHandler) {
          this.cardPlayHandler.triggerBotAction(roomId);
        }
      }, 2000);

    } catch (error) {
      console.error('确定地主失败:', error);
    }
  }

  /**
   * 发牌
   */
  private dealCards(room: any): { playerCards: string[][], bottomCards: string[] } {
    // 创建一副完整的扑克牌（54张）
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const deck: string[] = [];

    // 添加52张普通牌
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${suit}${rank}`);
      }
    }

    // 添加大小王
    deck.push('🃏小王');
    deck.push('🃏大王');

    // 洗牌（Fisher-Yates算法）
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    console.log(`🎴 洗牌完成，共${deck.length}张牌`);

    // 分配牌：每人17张，剩余3张作为底牌
    const playerCards: string[][] = [[], [], []];
    
    for (let i = 0; i < 51; i++) {
      const playerIndex = i % 3;
      playerCards[playerIndex].push(deck[i]);
    }

    // 在保留总体随机性的前提下，轻微偏向真人玩家：
    // 对三手牌做一个简单评分（炸弹、王炸、长顺子），
    // 将评分最好的一手整副牌交换给某个真人玩家（仅在存在真人+机器人混合时生效）。
    try {
      const humanIndices: number[] = [];
      const botIndices: number[] = [];
      if (Array.isArray(room.players)) {
        room.players.forEach((p: any, idx: number) => {
          if (p && p.isBot) {
            botIndices.push(idx);
          } else {
            humanIndices.push(idx);
          }
        });
      }

      // 只有在“至少有一个真人且至少有一个机器人”的情况下才做偏好处理，
      // 避免全真人房间产生明显不公平感。
      if (humanIndices.length > 0 && botIndices.length > 0) {
        const STRAIGHT_ORDER = ['3','4','5','6','7','8','9','10','J','Q','K','A'];

        const evaluateHand = (cards: string[]): number => {
          const rankCounts: Record<string, number> = {};
          const straightRanks: string[] = [];
          let hasSmallJoker = false;
          let hasBigJoker = false;

          for (const card of cards) {
            if (card.includes('🃏')) {
              if (card.includes('小王')) hasSmallJoker = true;
              if (card.includes('大王')) hasBigJoker = true;
              rankCounts[card] = (rankCounts[card] || 0) + 1;
            } else {
              const rank = card.slice(1);
              rankCounts[rank] = (rankCounts[rank] || 0) + 1;
              // 顺子不包含2和大小王
              if (rank !== '2') {
                straightRanks.push(rank);
              }
            }
          }

          let score = 0;

          // 普通炸弹（四张相同点数，不包含大小王）
          for (const key of Object.keys(rankCounts)) {
            const count = rankCounts[key];
            if (count >= 4 && !key.includes('🃏')) {
              score += 12; // 四张炸弹给较高权重
            }
          }

          // 王炸（大小王同时存在）
          if (hasSmallJoker && hasBigJoker) {
            score += 18;
          }

          // 顺子（最长连续长度>=5）
          const uniqueStraightRanks = Array.from(new Set(straightRanks));
          const idxList = uniqueStraightRanks
            .map((r) => STRAIGHT_ORDER.indexOf(r))
            .filter((idx) => idx >= 0)
            .sort((a, b) => a - b);

          let longest = 0;
          let current = 1;
          for (let i = 1; i < idxList.length; i++) {
            if (idxList[i] === idxList[i - 1] + 1) {
              current++;
            } else {
              if (current > longest) longest = current;
              current = 1;
            }
          }
          if (idxList.length > 0) {
            if (current > longest) longest = current;
          }

          if (longest >= 5) {
            // 5张顺子给3分，每多一张多加1分
            score += 3 + (longest - 5);
          }

          return score;
        };

        const scores = playerCards.map((cards) => evaluateHand(cards));

        let bestIndex = 0;
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] > scores[bestIndex]) {
            bestIndex = i;
          }
        }

        // 选择一个真人玩家（这里简单地选第一个真人索引）
        const targetHumanIndex = humanIndices[0];

        if (
          bestIndex !== targetHumanIndex &&
          scores[bestIndex] > scores[targetHumanIndex]
        ) {
          const tmp = playerCards[targetHumanIndex];
          playerCards[targetHumanIndex] = playerCards[bestIndex];
          playerCards[bestIndex] = tmp;
          console.log('🎯 [发牌偏好] 将更好的一手牌交换给真人玩家', {
            scores,
            targetHumanIndex,
            bestIndex,
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ [发牌偏好] 评估或调整手牌失败，继续使用原始随机发牌:', e);
    }

    // 底牌
    const bottomCards = deck.slice(51, 54);

    // 对每个玩家的牌进行排序
    playerCards.forEach(cards => {
      this.sortCards(cards);
    });

    console.log(`🎴 发牌完成: Player1=${playerCards[0].length}张, Player2=${playerCards[1].length}张, Player3=${playerCards[2].length}张, 底牌=${bottomCards.length}张`);

    // 保存到房间数据
    room.players[0].cards = playerCards[0];
    room.players[1].cards = playerCards[1];
    room.players[2].cards = playerCards[2];
    room.bottomCards = bottomCards;

    return { playerCards, bottomCards };
  }

  /**
   * 排序扑克牌
   */
  private sortCards(cards: string[]): void {
    const rankOrder: { [key: string]: number } = {
      '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
      'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, '🃏小王': 14, '🃏大王': 15
    };

    cards.sort((a, b) => {
      const rankA = a.includes('🃏') ? a : a.slice(1);
      const rankB = b.includes('🃏') ? b : b.slice(1);
      return (rankOrder[rankA] || 0) - (rankOrder[rankB] || 0);
    });
  }

  /**
   * 根据userId查找socketId
   */
  private findSocketIdByUserId(userId: string): string | null {
    if (!this.io) return null;

    console.log(`🔍 [查找Socket] 开始查找userId: ${userId}`);
    
    // 遍历所有连接的socket
    const sockets = this.io.sockets.sockets;
    console.log(`🔍 [查找Socket] 当前连接的Socket数量: ${sockets.size}`);
    
    for (const [socketId, socket] of sockets) {
      const authSocket = socket as any;
      const authUserId = authSocket.handshake?.auth?.userId;
      const authUserName = authSocket.handshake?.auth?.userName;
      
      console.log(`🔍 [查找Socket] Socket ${socketId}: userId=${authUserId}, userName=${authUserName}`);
      
      if (authUserId === userId || authUserName === userId) {
        console.log(`✅ [查找Socket] 找到匹配的Socket: ${socketId}`);
        return socketId;
      }
    }

    console.error(`❌ [查找Socket] 未找到userId=${userId}的Socket连接`);
    return null;
  }
}

export const gameFlowHandler = GameFlowHandler.getInstance();
