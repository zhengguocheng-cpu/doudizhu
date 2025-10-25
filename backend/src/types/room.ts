// 房间相关类型定义
import { Player, GamePlayer } from './player';

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  players: Player[];
  status: string;
  createdAt: Date;
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
    remaining: string[];
    played: string[][];
    lastPlayed?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GameState {
  id: string;
  players: GamePlayer[];
  readyPlayers: string[];
  gameStarted: boolean;
  bottomCards?: string[];
  landlord?: GamePlayer | null;
  currentPlayer?: string;
  lastPlayedCards?: string[];
}
