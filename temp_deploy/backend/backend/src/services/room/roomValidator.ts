import { GameRoom, Player } from '../../types';

/**
 * 房间验证器服务
 * 负责验证房间状态、玩家操作等业务规则
 */
export class RoomValidator {
  /**
   * 验证房间是否存在
   */
  public static validateRoomExists(room: GameRoom | undefined): boolean {
    return room !== undefined;
  }

  /**
   * 验证房间是否可加入
   */
  public static validateRoomJoinable(room: GameRoom): { valid: boolean; error?: string } {
    // 检查房间是否存在
    if (!this.validateRoomExists(room)) {
      return { valid: false, error: '房间不存在' };
    }

    // 检查房间状态
    if (room.status !== 'waiting') {
      return { valid: false, error: '游戏已开始，不能加入' };
    }

    // 检查房间容量
    if (room.players.length >= room.maxPlayers) {
      return { valid: false, error: '房间已满' };
    }

    // 检查是否有重复玩家
    const socketIds = room.players.map(p => p.id);
    const hasDuplicates = socketIds.length !== new Set(socketIds).size;
    if (hasDuplicates) {
      return { valid: false, error: '房间中存在重复玩家' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以准备
   */
  public static validatePlayerReady(
    room: GameRoom,
    playerId: string
  ): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'waiting') {
      return { valid: false, error: '游戏已开始，不能改变准备状态' };
    }

    // 检查玩家是否存在
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { valid: false, error: '玩家不在房间中' };
    }

    return { valid: true };
  }

  /**
   * 验证游戏开始条件
   */
  public static validateGameStartConditions(room: GameRoom): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'waiting') {
      return { valid: false, error: '游戏状态不正确' };
    }

    // 检查玩家数量
    if (room.players.length < 3) {
      return { valid: false, error: '玩家数量不足，需要至少3名玩家' };
    }

    if (room.players.length > room.maxPlayers) {
      return { valid: false, error: '玩家数量超过房间容量' };
    }

    // 检查所有玩家是否都已准备
    const allReady = room.players.every(player => player.ready === true);
    if (!allReady) {
      return { valid: false, error: '不是所有玩家都已准备' };
    }

    // 检查是否有无效的玩家状态
    const hasInvalidPlayers = room.players.some(player =>
      !player.id || !player.name
    );
    if (hasInvalidPlayers) {
      return { valid: false, error: '存在无效的玩家信息' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以离开房间
   */
  public static validatePlayerLeave(
    room: GameRoom,
    playerId: string
  ): { valid: boolean; error?: string } {
    // 检查玩家是否存在
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { valid: false, error: '玩家不在房间中' };
    }

    // 如果游戏已开始且玩家是地主，验证是否可以离开
    if (room.status === 'playing' && room.landlord?.id === playerId) {
      return { valid: false, error: '地主不能离开游戏' };
    }

    return { valid: true };
  }

  /**
   * 验证房间参数
   */
  public static validateRoomParams(
    name: string,
    maxPlayers: number
  ): { valid: boolean; error?: string } {
    // 验证房间名称
    if (!name || name.trim().length === 0) {
      return { valid: false, error: '房间名称不能为空' };
    }

    if (name.length > 50) {
      return { valid: false, error: '房间名称不能超过50个字符' };
    }

    // 验证最大玩家数
    if (maxPlayers < 3 || maxPlayers > 6) {
      return { valid: false, error: '房间最大玩家数必须在3-6之间' };
    }

    // 验证房间名称是否重复（默认房间）
    const isDefaultRoom = name.includes('房间 A');
    if (isDefaultRoom) {
      return { valid: false, error: '不能使用默认房间名称' };
    }

    return { valid: true };
  }

  /**
   * 验证房间是否为空
   */
  public static isRoomEmpty(room: GameRoom): boolean {
    return room.players.length === 0;
  }

  /**
   * 验证房间是否已满
   */
  public static isRoomFull(room: GameRoom): boolean {
    return room.players.length >= room.maxPlayers;
  }

  /**
   * 获取房间状态描述
   */
  public static getRoomStatusDescription(room: GameRoom): string {
    const playerCount = room.players.length;
    const maxPlayers = room.maxPlayers;

    if (room.status === 'waiting') {
      return `等待中 (${playerCount}/${maxPlayers})`;
    } else if (room.status === 'playing') {
      return `游戏中 (${playerCount}人)`;
    } else if (room.status === 'finished') {
      return `已结束 (${playerCount}人)`;
    }

    return `未知状态 (${playerCount}/${maxPlayers})`;
  }
}
