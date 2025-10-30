import { GameRoom, Player } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { DefaultRoomConfig } from './defaultRooms';
import { RoomValidator } from './roomValidator';

/**
 * 房间管理器服务
 * 负责房间的完整生命周期管理
 */
export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private gameStates: Map<string, any> = new Map(); // 保存游戏状态

  constructor() {
    this.initializeDefaultRooms();
  }
  
  /**
   * 保存游戏状态
   */
  public saveGameState(roomId: string, gameState: any): void {
    this.gameStates.set(roomId, {
      ...gameState,
      savedAt: new Date()
    });
    console.log(`💾 保存房间 ${roomId} 的游戏状态`);
  }
  
  /**
   * 获取游戏状态
   */
  public getGameState(roomId: string): any | undefined {
    return this.gameStates.get(roomId);
  }
  
  /**
   * 清除游戏状态
   */
  public clearGameState(roomId: string): void {
    this.gameStates.delete(roomId);
    console.log(`🗑️ 清除房间 ${roomId} 的游戏状态`);
  }

  /**
   * 创建新房间
   */
  public createRoom(name: string, maxPlayers: number = 3): GameRoom {
    // 验证房间参数
    const validation = RoomValidator.validateRoomParams(name, maxPlayers);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 生成房间ID
    const roomId = uuidv4();

    // 创建房间配置
    const roomConfig = DefaultRoomConfig.getRoomConfig(roomId, {
      name,
      maxPlayers,
      players: []
    });

    // 创建完整房间对象
    const room: GameRoom = {
      ...roomConfig,
      players: []
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * 获取房间信息
   */
  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 获取所有房间
   */
  public getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 玩家加入房间
   */
  public joinRoom(roomId: string, playerName: string, playerAvatar?: string): Player {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    // 检查玩家是否已在房间中
    const existingPlayer = room.players.find(p => p.id === playerName || p.name === playerName);
    if (existingPlayer) {
      console.log(`✅ 玩家 ${playerName} 重新连接房间 ${roomId}（玩家已存在，无需重新加入）`);
      // 如果提供了新头像，更新头像
      if (playerAvatar && existingPlayer.avatar !== playerAvatar) {
        existingPlayer.avatar = playerAvatar;
        console.log(`🎨 更新玩家头像: ${playerAvatar}`);
      }
      return existingPlayer;
    }

    // 验证是否可以加入
    const joinValidation = RoomValidator.validateRoomJoinable(room);
    if (!joinValidation.valid) {
      console.log(`⚠️ 玩家 ${playerName} 无法加入房间 ${roomId}: ${joinValidation.error}`);
      throw new Error(joinValidation.error);
    }

    // 确定头像：优先使用用户选择的头像，否则自动分配
    let avatar = playerAvatar;
    if (!avatar) {
      // 为玩家分配头像（基于玩家名称的哈希值，确保同一玩家始终获得相同头像）
      const avatars = ['👑', '🎲', '🎯', '🎪', '🎨', '🎭', '🎸', '🎹', '🎺', '🎻'];
      const avatarIndex = this.getPlayerAvatarIndex(playerName, avatars.length);
      avatar = avatars[avatarIndex];
    }
    
    // 创建玩家（使用用户名作为ID）
    const player: Player = {
      id: playerName, // 使用用户名作为ID
      name: playerName,
      avatar: avatar, // 使用用户选择的头像或自动分配的头像
      ready: false,
      cards: [],
      cardCount: 0
    };

    // 添加玩家到房间
    room.players.push(player);
    room.updatedAt = new Date();

    console.log(`玩家 ${playerName} (${avatar}) 加入房间 ${roomId}，当前人数: ${room.players.length}/${room.maxPlayers}`);

    return player;
  }
  public addExistingUserToRoom(roomId: string, user: Player): Player {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }

    // 验证是否可以加入
    const joinValidation = RoomValidator.validateRoomJoinable(room);
    if (!joinValidation.valid) {
      throw new Error(joinValidation.error);
    }

    // 检查房间中是否已有该用户
    const existingPlayer = room.players.find(p => p.id === user.id);
    if (existingPlayer) {
      // 用户已在房间中，直接返回
      return existingPlayer;
    }

    // 添加用户到房间
    room.players.push(user);
    room.updatedAt = new Date();

    return user;
  }
  public leaveRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 验证是否可以离开
    const leaveValidation = RoomValidator.validatePlayerLeave(room, playerId);
    if (!leaveValidation.valid) {
      throw new Error(leaveValidation.error);
    }

    // 查找并移除玩家
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    // 重置玩家状态
    const player = room.players[playerIndex];
    player.ready = false;
    player.cards = [];
    player.cardCount = 0;

    // 如果游戏进行中且玩家是地主，结束游戏
    if (room.status === 'playing' && room.landlord?.id === playerId) {
      room.status = 'finished';
    }

    // 移除玩家
    room.players.splice(playerIndex, 1);
    room.updatedAt = new Date();

    // 如果房间为空，删除房间（除默认房间外）
    if (RoomValidator.isRoomEmpty(room) && !DefaultRoomConfig.isDefaultRoom(roomId)) {
      this.rooms.delete(roomId);
    }

    return true;
  }

  /**
   * 玩家准备/取消准备
   */
  public togglePlayerReady(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 验证是否可以准备
    const readyValidation = RoomValidator.validatePlayerReady(room, playerId);
    if (!readyValidation.valid) {
      throw new Error(readyValidation.error);
    }

    // 切换准备状态
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
      room.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * 检查游戏是否可以开始
   */
  public canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const validation = RoomValidator.validateGameStartConditions(room);
    return validation.valid;
  }

  /**
   * 开始游戏
   */
  public startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 验证游戏开始条件
    const validation = RoomValidator.validateGameStartConditions(room);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 开始游戏
    room.status = 'playing';
    room.currentPlayerIndex = 0;
    room.updatedAt = new Date();

    return true;
  }

  /**
   * 结束游戏
   */
  public endGame(roomId: string, winner?: Player): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    room.status = 'finished';
    if (winner) {
      // 这里可以记录游戏结果
      console.log(`游戏结束，获胜者: ${winner.name}`);
    }
    room.updatedAt = new Date();

    return true;
  }

  /**
   * 重置房间状态
   */
  public resetRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 重置所有玩家状态
    room.players.forEach(player => {
      player.ready = false;
      player.cards = [];
      player.cardCount = 0;
    });

    // 重置房间状态
    room.status = 'waiting';
    room.currentPlayerIndex = 0;
    room.landlord = null;
    room.cards = {
      remaining: [],
      played: []
    };
    room.updatedAt = new Date();

    return true;
  }

  /**
   * 删除房间
   */
  public deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // 不能删除有玩家的房间
    if (room.players.length > 0) {
      throw new Error('不能删除有玩家的房间');
    }

    // 不能删除默认房间
    if (DefaultRoomConfig.isDefaultRoom(roomId)) {
      throw new Error('不能删除默认房间');
    }

    return this.rooms.delete(roomId);
  }

  /**
   * 初始化默认房间
   */
  private initializeDefaultRooms(): void {
    const defaultConfigs = DefaultRoomConfig.getDefaultRoomConfigs();

    defaultConfigs.forEach(({ id, config }) => {
      const room: GameRoom = DefaultRoomConfig.getRoomConfig(id, config);
      this.rooms.set(id, room);
    });

    console.log(`✅ 初始化 ${defaultConfigs.length} 个默认房间`);
  }

  /**
   * 获取房间统计信息
   */
  public getRoomStats(): {
    total: number;
    waiting: number;
    playing: number;
    finished: number;
    empty: number;
    full: number;
  } {
    const rooms = this.getAllRooms();
    const stats = {
      total: rooms.length,
      waiting: 0,
      playing: 0,
      finished: 0,
      empty: 0,
      full: 0
    };

    rooms.forEach(room => {
      // 统计状态
      if (room.status === 'waiting') stats.waiting++;
      else if (room.status === 'playing') stats.playing++;
      else if (room.status === 'finished') stats.finished++;

      // 统计容量
      if (RoomValidator.isRoomEmpty(room)) stats.empty++;
      if (RoomValidator.isRoomFull(room)) stats.full++;
    });

    return stats;
  }

  /**
   * 基于玩家名称生成一致的头像索引
   * 使用简单的字符串哈希算法
   */
  private getPlayerAvatarIndex(playerName: string, avatarCount: number): number {
    let hash = 0;
    for (let i = 0; i < playerName.length; i++) {
      const char = playerName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % avatarCount;
  }
}
