// 游戏相关类型定义
// 游戏相关类型定义
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isOnline: boolean;
  cards?: Card[];
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';
}

export interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerIndex: number;
  landlord: Player | null;
  cards: {
    remaining: Card[];
    played: Card[][];
    lastPlayed?: Card[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GameAction {
  type: 'join' | 'leave' | 'ready' | 'play_cards' | 'pass';
  playerId: string;
  data?: any;
  timestamp: Date;
}

// Socket事件类型
export interface ServerToClientEvents {
  room_joined: (room: GameRoom) => void;
  room_left: (roomId: string) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  game_started: (gameRoom: GameRoom) => void;
  cards_played: (playerId: string, cards: Card[]) => void;
  turn_changed: (nextPlayerId: string) => void;
  game_ended: (winner: Player) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  leave_room: () => void;
  ready: () => void;
  play_cards: (cards: Card[]) => void;
  pass: () => void;
}

// 请求响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 中间件类型
export interface AuthenticatedRequest extends Request {
  user?: Player;
}
