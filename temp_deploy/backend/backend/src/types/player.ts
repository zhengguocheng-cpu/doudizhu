// 玩家相关类型定义
// 扩展Player接口以支持用户会话管理
export interface Player {
  id: string;           // 用户名（作为唯一标识符）
  name: string;
  avatar?: string;      // 玩家头像（emoji）
  ready: boolean;
  cards?: string[];
  cardCount?: number;
  socketId?: string;    // 当前连接的socket.id
  userId?: string;      // 用户名（与id保持一致）
  createdAt?: Date;     // 用户创建时间
  lastLoginAt?: Date;   // 最后登录时间
  isOnline?: boolean;   // 在线状态
}

// 兼容现有代码的GamePlayer接口
export interface GamePlayer {
  id: string;
  name: string;
  ready: boolean;
  cards?: string[];
  cardCount?: number;
}

// 扩展GameAction以支持用户ID
export interface GameAction {
  type: 'join' | 'leave' | 'ready' | 'play_cards' | 'pass';
  playerId: string;
  userId?: string;      // 全局用户ID（UUID）
  data?: any;
  timestamp: Date;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';
}

// 用户会话状态接口
export interface UserSession {
  sessionId: string;
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  isOnline: boolean;
}

// 认证响应接口
export interface AuthResponse {
  success: boolean;
  userId?: string;
  userName?: string;
  sessionId?: string;
  error?: string;
}

// 房间操作响应接口
export interface RoomOperationResponse {
  success: boolean;
  playerId?: string;
  userId?: string;
  error?: string;
}
