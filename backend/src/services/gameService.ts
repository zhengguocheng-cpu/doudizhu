import { GameRoom, Player, Card, GameAction } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class GameService {
  private rooms: Map<string, GameRoom> = new Map();
  private players: Map<string, Player> = new Map();

  // 创建游戏房间
  createRoom(name: string, maxPlayers: number = 3): GameRoom {
    const roomId = uuidv4();
    const room: GameRoom = {
      id: roomId,
      name,
      players: [],
      maxPlayers,
      status: 'waiting',
      currentPlayerIndex: 0,
      landlord: null,
      cards: {
        remaining: [],
        played: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  // 玩家加入房间
  joinRoom(roomId: string, playerName: string): Player {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('房间已满');
    }

    if (room.status !== 'waiting') {
      throw new Error('游戏已开始，不能加入');
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      isReady: false,
      isOnline: true
    };

    room.players.push(player);
    this.players.set(player.id, player);
    room.updatedAt = new Date();

    return player;
  }

  // 玩家离开房间
  leaveRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    const player = room.players[playerIndex];
    player.isOnline = false;

    // 如果游戏已开始且玩家是地主，结束游戏
    if (room.status === 'playing' && room.landlord?.id === playerId) {
      room.status = 'finished';
    }

    room.updatedAt = new Date();
    return true;
  }

  // 玩家准备
  playerReady(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }

    player.isReady = !player.isReady;

    // 检查是否所有玩家都准备好了
    const allReady = room.players.every(p => p.isReady);
    if (allReady && room.players.length >= 3) {
      this.startGame(roomId);
    }

    room.updatedAt = new Date();
    return true;
  }

  // 开始游戏
  private startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // 发牌逻辑（简化版）
    const allCards = this.generateCards();
    this.shuffleCards(allCards);

    // 三人斗地主，每人17张牌，剩余3张作为底牌
    const cardsPerPlayer = Math.floor(allCards.length / room.players.length);
    room.players.forEach((player, index) => {
      player.cards = allCards.slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer);
    });

    // 剩余的3张牌作为底牌
    room.cards.remaining = allCards.slice(cardsPerPlayer * room.players.length);

    room.status = 'playing';
    room.currentPlayerIndex = 0;
    room.updatedAt = new Date();
  }

  // 生成一副扑克牌
  private generateCards(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Card['rank'][] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const cards: Card[] = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        cards.push({ suit, rank });
      });
    });

    // 添加大小王
    cards.push({ suit: 'hearts', rank: '2' }, { suit: 'diamonds', rank: '2' });

    return cards;
  }

  // 洗牌算法
  private shuffleCards(cards: Card[]): void {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  // 获取房间信息
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  // 获取所有房间
  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  // 获取玩家信息
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }
}

// 单例模式
export const gameService = new GameService();
