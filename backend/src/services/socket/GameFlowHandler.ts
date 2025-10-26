/**
 * 游戏流程处理器
 * 负责发牌、开始游戏等核心游戏逻辑
 */

import { roomService } from '../room/roomService';

export class GameFlowHandler {
  private static instance: GameFlowHandler;
  private io: any;

  private constructor() {}

  public static getInstance(): GameFlowHandler {
    if (!GameFlowHandler.instance) {
      GameFlowHandler.instance = new GameFlowHandler();
    }
    return GameFlowHandler.instance;
  }

  public initialize(io: any): void {
    this.io = io;
    console.log('GameFlowHandler initialized');
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

      // 给每个玩家发送他们的牌
      room.players.forEach((player: any, index: number) => {
        const socketId = this.findSocketIdByUserId(player.id);
        if (socketId) {
          this.io.to(socketId).emit('deal_cards', {
            cards: dealResult.playerCards[index],
            cardCount: dealResult.playerCards[index].length,
            bottomCards: dealResult.bottomCards,
            bottomCardCount: dealResult.bottomCards.length
          });
          
          console.log(`发牌给玩家${player.name}: ${dealResult.playerCards[index].length}张`);
        }
      });

      console.log(`✅ 游戏开始成功: 房间${roomId}`);

    } catch (error) {
      console.error('开始游戏失败:', error);
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

    // 遍历所有连接的socket
    const sockets = this.io.sockets.sockets;
    for (const [socketId, socket] of sockets) {
      const authSocket = socket as any;
      if (authSocket.handshake?.auth?.userId === userId || 
          authSocket.handshake?.auth?.userName === userId) {
        return socketId;
      }
    }

    return null;
  }
}

export const gameFlowHandler = GameFlowHandler.getInstance();
