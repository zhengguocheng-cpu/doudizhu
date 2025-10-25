import { GameRoom } from '../../types';

/**
 * 默认房间配置服务
 * 管理游戏的默认房间设置和初始化
 */
export class DefaultRoomConfig {
  private static readonly DEFAULT_ROOM_COUNT = 6;
  private static readonly DEFAULT_MAX_PLAYERS = 3;
  private static readonly ROOM_ID_PREFIX = 'A';

  /**
   * 获取默认房间数量
   */
  public static getDefaultRoomCount(): number {
    return this.DEFAULT_ROOM_COUNT;
  }

  /**
   * 获取默认最大玩家数
   */
  public static getDefaultMaxPlayers(): number {
    return this.DEFAULT_MAX_PLAYERS;
  }

  /**
   * 生成默认房间ID
   */
  public static generateRoomId(index: number): string {
    return `${this.ROOM_ID_PREFIX}${String(index).padStart(2, '0')}`;
  }

  /**
   * 生成房间名称
   */
  public static generateRoomName(roomId: string): string {
    return `房间 ${roomId}`;
  }

  /**
   * 创建默认房间模板
   */
  public static createDefaultRoomTemplate(roomId: string): Partial<GameRoom> {
    return {
      id: roomId,
      name: this.generateRoomName(roomId),
      maxPlayers: this.DEFAULT_MAX_PLAYERS,
      status: 'waiting',
      currentPlayerIndex: 0,
      landlord: null,// 地主玩家ID，初始为null
      cards: { // 牌堆信息
        remaining: [],// remaining：剩余牌，数组形式
        played: []// played：已出牌记录，二维数组，每一轮出牌记录一个数组，存储每个玩家出的牌
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 获取所有默认房间配置
   */
  public static getDefaultRoomConfigs(): Array<{ id: string; config: Partial<GameRoom> }> {
    const configs = [];
    for (let i = 1; i <= this.DEFAULT_ROOM_COUNT; i++) {
      const roomId = this.generateRoomId(i);
      configs.push({
        id: roomId,
        config: this.createDefaultRoomTemplate(roomId)
      });
    }
    return configs;
  }

  /**
   * 验证房间ID是否为默认房间
   */
  public static isDefaultRoom(roomId: string): boolean {
    return roomId.startsWith(this.ROOM_ID_PREFIX) &&
           roomId.length === 3 &&
           /^\d{2}$/.test(roomId.slice(1));
  }

  /**
   * 从房间ID解析房间编号
   */
  public static parseRoomNumber(roomId: string): number | null {
    if (!this.isDefaultRoom(roomId)) return null;
    return parseInt(roomId.slice(1), 10);
  }

  /**
   * 获取房间配置（支持自定义配置覆盖）
   */
  public static getRoomConfig(
    roomId: string,
    overrides: Partial<GameRoom> = {}
  ): GameRoom {
    const template = this.createDefaultRoomTemplate(roomId);

    return {
      players: [],
      ...template,
      ...overrides
    } as GameRoom;
  }
}
