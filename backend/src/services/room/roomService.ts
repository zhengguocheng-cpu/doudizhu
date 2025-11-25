import { GameRoom, Player } from '../../types';
import { RoomManager } from './roomManager';
import { RoomValidator } from './roomValidator';
import { DefaultRoomConfig } from './defaultRooms';
import { getUserManager } from '../user/userManager';

/**
 * 房间服务 - 统一房间管理接口
 * 提供完整的房间生命周期管理功能
 */
export class RoomService {
  private roomManager: RoomManager;

  constructor() {
    this.roomManager = new RoomManager();
  }

  /**
   * 创建房间
   */
  public createRoom(name: string, maxPlayers?: number): GameRoom {
    return this.roomManager.createRoom(name, maxPlayers);
  }

  /**
   * 获取房间
   */
  public getRoom(roomId: string): GameRoom | undefined {
    return this.roomManager.getRoom(roomId);
  }

  /**
   * 获取所有房间
   */
  public getAllRooms(): GameRoom[] {
    return this.roomManager.getAllRooms();
  }

  /**
   * 确保指定ID的房间存在（不存在则创建）
   * 主要用于业务层快速创建固定编号房间（如 K01~K06）
   */
  public ensureRoom(roomId: string, name: string, maxPlayers?: number): GameRoom {
    return this.roomManager.ensureRoom(roomId, name, maxPlayers);
  }

  /**
   * 玩家加入房间
   */
  public joinRoom(roomId: string, playerName: string, playerAvatar?: string): Player {
    return this.roomManager.joinRoom(roomId, playerName, playerAvatar);
  }

  /**
   * 添加已存在的用户到房间
   */
  public addExistingUserToRoom(roomId: string, user: Player): Player {
    return this.roomManager.addExistingUserToRoom(roomId, user);
  }

  /**
   * 玩家离开房间
   */
  public leaveRoom(roomId: string, playerId: string): boolean {
    return this.roomManager.leaveRoom(roomId, playerId);
  }

  /**
   * 切换玩家准备状态
   */
  public togglePlayerReady(roomId: string, playerId: string): boolean {
    return this.roomManager.togglePlayerReady(roomId, playerId);
  }

  /**
   * 开始游戏
   */
  public startGame(roomId: string): boolean {
    return this.roomManager.startGame(roomId);
  }

  /**
   * 结束游戏
   */
  public endGame(roomId: string, winner?: Player): boolean {
    return this.roomManager.endGame(roomId, winner);
  }

  /**
   * 重置房间
   */
  public resetRoom(roomId: string): boolean {
    return this.roomManager.resetRoom(roomId);
  }

  /**
   * 删除房间
   */
  public deleteRoom(roomId: string): boolean {
    return this.roomManager.deleteRoom(roomId);
  }

  /**
   * 验证房间操作
   */
  public validateRoomOperation(
    roomId: string,
    operation: string
  ): { valid: boolean; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { valid: false, error: '房间不存在' };
    }

    switch (operation) {
      case 'join':
        return RoomValidator.validateRoomJoinable(room);
      case 'ready':
        return { valid: true }; // 准备操作由具体方法验证
      case 'start':
        return RoomValidator.validateGameStartConditions(room);
      case 'leave':
        return { valid: true }; // 离开操作由具体方法验证
      default:
        return { valid: false, error: '未知操作' };
    }
  }

  /**
   * 获取房间统计信息
   */
  public getRoomStats() {
    return this.roomManager.getRoomStats();
  }

  /**
   * 向房间添加机器人玩家
   */
  public addBotPlayer(roomId: string): Player {
    return this.roomManager.addBotPlayer(roomId);
  }

  /**
   * 检查是否为默认房间
   */
  public isDefaultRoom(roomId: string): boolean {
    return DefaultRoomConfig.isDefaultRoom(roomId);
  }

  /**
   * 通过用户名查找用户
   */
  public findUserByName(userName: string): Player | undefined {
    const userManager = getUserManager();
    return userManager.findUserByName(userName);
  }
  
  /**
   * 保存游戏状态
   */
  public saveGameState(roomId: string, gameState: any): void {
    return this.roomManager.saveGameState(roomId, gameState);
  }
  
  /**
   * 获取游戏状态
   */
  public getGameState(roomId: string): any | undefined {
    return this.roomManager.getGameState(roomId);
  }
  
  /**
   * 清除游戏状态
   */
  public clearGameState(roomId: string): void {
    return this.roomManager.clearGameState(roomId);
  }
}

// 导出单例实例
export const roomService = new RoomService();
