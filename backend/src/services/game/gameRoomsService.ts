/**
 * 游戏房间管理服务
 * 提供对实际游戏房间数据的访问和业务逻辑
 */

import { Player } from '../../types/player';
import { gameConfig } from '../../config';

export class GameRoomsService {
  private static instance: GameRoomsService;
  private gameRooms: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): GameRoomsService {
    if (!GameRoomsService.instance) {
      GameRoomsService.instance = new GameRoomsService();
    }
    return GameRoomsService.instance;
  }

  /**
   * 创建新房间
   */
  public async createRoom(roomId: string, createdBy: Player): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.gameRooms.has(roomId)) {
        return { success: false, error: '房间已存在' };
      }

      const room = {
        id: roomId,
        name: roomId,
        players: [createdBy],
        maxPlayers: gameConfig.maxPlayers,
        status: 'waiting',
        readyPlayers: [],
        gameStarted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.gameRooms.set(roomId, room);
      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建房间失败'
      };
    }
  }

  /**
   * 加入房间
   */
  public async joinRoom(roomId: string, player: Player): Promise<{ success: boolean; error?: string }> {
    try {
      const room = this.getGameRoom(roomId);

      if (!room) {
        return { success: false, error: '房间不存在' };
      }

      if (room.players.length >= room.maxPlayers) {
        return { success: false, error: '房间已满' };
      }

      if (room.gameStarted) {
        return { success: false, error: '游戏进行中，无法加入' };
      }

      const existingPlayer = room.players.find((p: any) => p.id === player.id);
      if (existingPlayer) {
        return { success: false, error: '您已在房间中' };
      }

      room.players.push(player);
      room.updatedAt = new Date();

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '加入房间失败'
      };
    }
  }

  /**
   * 离开房间
   */
  public async leaveRoom(roomId: string, playerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const room = this.getGameRoom(roomId);

      if (!room) {
        return { success: false, error: '房间不存在' };
      }

      const playerIndex = room.players.findIndex((p: any) => p.id === playerId);

      if (playerIndex === -1) {
        return { success: false, error: '您不在此房间中' };
      }

      if (room.gameStarted) {
        return { success: false, error: '游戏进行中，无法离开房间' };
      }

      room.players.splice(playerIndex, 1);
      room.updatedAt = new Date();

      if (room.players.length === 0) {
        this.deleteGameRoom(roomId);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '离开房间失败'
      };
    }
  }

  /**
   * 玩家准备
   */
  public async playerReady(roomId: string, playerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const room = this.getGameRoom(roomId);

      if (!room) {
        return { success: false, error: '房间不存在' };
      }

      if (!room.readyPlayers.includes(playerId)) {
        room.readyPlayers.push(playerId);
      }

      if (room.readyPlayers.length === room.players.length && room.players.length >= gameConfig.minPlayers) {
        // 发布游戏开始事件
        console.log(`游戏可以开始: 房间 ${roomId}, 玩家 ${room.players.map((p: any) => p.id)}`);
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '设置准备状态失败'
      };
    }
  }

  /**
   * 添加或更新游戏房间
   */
  public setGameRoom(roomId: string, roomData: any): void {
    this.gameRooms.set(roomId, roomData);
  }

  /**
   * 获取游戏房间
   */
  public getGameRoom(roomId: string): any {
    return this.gameRooms.get(roomId);
  }

  /**
   * 删除游戏房间
   */
  public deleteGameRoom(roomId: string): void {
    this.gameRooms.delete(roomId);
  }

  /**
   * 获取所有游戏房间（用于API响应）
   */
  public getGameRoomsForAPI(): any[] {
    return Array.from(this.gameRooms.values()).map(room => ({
      id: room.id,
      name: room.id,
      players: room.players || [],
      maxPlayers: room.maxPlayers || 3,
      status: room.gameStarted ? 'playing' : 'waiting',
      currentPlayerIndex: 0,
      landlord: room.landlord || null,
      cards: {
        remaining: [],
        played: []
      },
      createdAt: room.createdAt || new Date(),
      updatedAt: new Date()
    }));
  }

  /**
   * 获取房间数量
   */
  public getRoomCount(): number {
    return this.gameRooms.size;
  }

  /**
   * 获取房间统计信息
   */
  public getRoomStats(): any {
    const rooms = Array.from(this.gameRooms.values());

    return {
      total: rooms.length,
      active: rooms.filter((r: any) => !r.gameStarted).length,
      playing: rooms.filter((r: any) => r.gameStarted).length,
      averagePlayers: rooms.length > 0
        ? rooms.reduce((sum: number, room: any) => sum + (room.players?.length || 0), 0) / rooms.length
        : 0
    };
  }
}

// 导出单例实例（兼容现有代码）
export const gameRoomsService = GameRoomsService.getInstance();
