export interface Player {
    id: string;
    name: string;
    ready: boolean;
    cards?: string[];
    cardCount?: number;
    socketId?: string;
    userId?: string;
    createdAt?: Date;
    lastLoginAt?: Date;
    isOnline?: boolean;
}
export interface GamePlayer {
    id: string;
    name: string;
    ready: boolean;
    cards?: string[];
    cardCount?: number;
}
export interface GameAction {
    type: 'join' | 'leave' | 'ready' | 'play_cards' | 'pass';
    playerId: string;
    userId?: string;
    data?: any;
    timestamp: Date;
}
export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';
}
export interface UserSession {
    sessionId: string;
    userId: string;
    socketId: string;
    connectedAt: Date;
    lastActivity: Date;
    isOnline: boolean;
}
export interface AuthResponse {
    success: boolean;
    userId?: string;
    userName?: string;
    sessionId?: string;
    error?: string;
}
export interface RoomOperationResponse {
    success: boolean;
    playerId?: string;
    userId?: string;
    error?: string;
}
//# sourceMappingURL=player.d.ts.map