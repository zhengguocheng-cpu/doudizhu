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
          cards: dealResult.playerCards[index],
          cardCount: dealResult.playerCards[index].length
        })),
        bottomCards: dealResult.bottomCards,
        bottomCardCount: dealResult.bottomCards.length
      });
      
      console.log(`✅ 发牌事件已广播给房间 room_${roomId}`);

      console.log(`✅ 游戏开始成功: 房间${roomId}`);

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
        lastPlayerId: null
      };

      console.log(`👑 确定地主: ${landlord.name}`);

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
          isFirst: true
        });
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
