import { Player, GameRoom } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PlayerSession } from './playerSession';
import { PlayerValidator } from './playerValidator';
import { BaseService } from '../../core/BaseService';
import { LogLevel } from '../../types';

/**
 * 玩家管理器服务
 * 负责玩家的完整生命周期管理
 */
export class PlayerManager extends BaseService {
  private playerSession!: PlayerSession;

  constructor() {
    super();
  }

  protected async onInitialize(): Promise<void> {
    this.playerSession = this.getService('SessionManager');
    this.log(LogLevel.INFO, 'class PlayerManager initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'PlayerManager destroyed');
  }

  /**
   * 创建玩家
   */
  public createPlayer(name: string): Player {
    // 验证玩家名称
    const nameValidation = PlayerValidator.validatePlayerName(name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      ready: false,
      cards: [],
      cardCount: 0
    };

    return player;
  }

  /**
   * 添加玩家到房间
   */
  public addPlayerToRoom(room: GameRoom, playerName: string): Player {
    // 验证房间状态
    if (room.status !== 'waiting') {
      throw new Error('游戏已开始，不能加入');
    }

    // 验证房间容量
    if (room.players.length >= room.maxPlayers) {
      throw new Error('房间已满');
    }

    // 检查是否有重复名称的玩家
    const existingPlayer = room.players.find(p => p.name === playerName.trim());
    if (existingPlayer) {
      throw new Error('房间中已有同名玩家');
    }

    // 创建玩家
    const player = this.createPlayer(playerName);

    // 添加到房间
    room.players.push(player);
    room.updatedAt = new Date();

    return player;
  }

  /**
   * 从房间移除玩家
   */
  public removePlayerFromRoom(room: GameRoom, playerId: string): boolean {
    // 验证是否可以离开
    const leaveValidation = PlayerValidator.validatePlayerCanLeave(room, playerId);
    if (!leaveValidation.valid) {
      throw new Error(leaveValidation.error);
    }

    // 查找玩家
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    // 重置玩家状态
    const player = room.players[playerIndex];
    this.resetPlayerState(player);

    // 如果是地主，重置地主
    if (room.landlord?.id === playerId) {
      room.landlord = null;
    }

    // 移除玩家
    room.players.splice(playerIndex, 1);
    room.updatedAt = new Date();

    // 如果房间为空，重置房间状态
    if (room.players.length === 0) {
      this.resetRoomForNewGame(room);
    }

    return true;
  }

  /**
   * 切换玩家准备状态
   */
  public togglePlayerReady(room: GameRoom, playerId: string): boolean {
    // 验证是否可以准备
    const readyValidation = PlayerValidator.validatePlayerCanReady(room, playerId);
    if (!readyValidation.valid) {
      throw new Error(readyValidation.error);
    }

    // 查找并切换状态
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
      room.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * 设置玩家手牌
   */
  public setPlayerCards(player: Player, cards: string[]): void {
    player.cards = [...cards];
    player.cardCount = cards.length;
    player.ready = false; // 发牌后重置准备状态
  }

  /**
   * 更新玩家手牌（出牌后）
   */
  public updatePlayerCards(player: Player, remainingCards: string[]): void {
    player.cards = [...remainingCards];
    player.cardCount = remainingCards.length;
  }

  /**
   * 重置玩家状态
   */
  public resetPlayerState(player: Player): void {
    player.ready = false;
    player.cards = [];
    player.cardCount = 0;
  }

  /**
   * 重置房间状态以开始新游戏
   */
  private resetRoomForNewGame(room: GameRoom): void {
    room.status = 'waiting';
    room.currentPlayerIndex = 0;
    room.landlord = null;
    room.cards = {
      remaining: [],
      played: []
    };

    // 重置所有玩家状态
    room.players.forEach(player => this.resetPlayerState(player));
  }

  /**
   * 获取房间中的所有玩家
   */
  public getRoomPlayers(room: GameRoom): Player[] {
    return [...room.players];
  }

  /**
   * 获取特定玩家
   */
  public getPlayer(room: GameRoom, playerId: string): Player | undefined {
    return room.players.find(p => p.id === playerId);
  }

  /**
   * 获取玩家位置
   */
  public getPlayerPosition(room: GameRoom, playerId: string): number {
    return PlayerValidator.getPlayerPosition(room, playerId);
  }

  /**
   * 检查玩家是否已准备
   */
  public isPlayerReady(room: GameRoom, playerId: string): boolean {
    const player = this.getPlayer(room, playerId);
    return player ? PlayerValidator.isPlayerReady(player) : false;
  }

  /**
   * 检查是否所有玩家都已准备
   */
  public areAllPlayersReady(room: GameRoom): boolean {
    return room.players.length >= 3 && room.players.every(player => player.ready);
  }

  /**
   * 检查玩家是否是地主
   */
  public isPlayerLandlord(room: GameRoom, playerId: string): boolean {
    return PlayerValidator.isPlayerLandlord(room, playerId);
  }

  /**
   * 检查玩家是否是当前回合
   */
  public isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean {
    return PlayerValidator.isPlayerCurrentTurn(room, playerId);
  }

  /**
   * 设置地主
   */
  public setLandlord(room: GameRoom, playerId: string): boolean {
    const player = this.getPlayer(room, playerId);
    if (!player) {
      return false;
    }

    room.landlord = player;
    room.updatedAt = new Date();
    return true;
  }

  /**
   * 验证玩家出牌权限
   */
  public validatePlayPermission(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    return PlayerValidator.validatePlayerCanPlay(room, playerId);
  }

  /**
   * 验证玩家抢地主权限
   */
  public validateGrabLandlordPermission(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    return PlayerValidator.validatePlayerCanGrabLandlord(room, playerId);
  }

  /**
   * 验证玩家跳过权限
   */
  public validatePassPermission(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    return PlayerValidator.validatePlayerCanPass(room, playerId);
  }

  /**
   * 获取玩家状态描述
   */
  public getPlayerStatusDescription(room: GameRoom, playerId: string): string {
    const player = this.getPlayer(room, playerId);
    if (!player) {
      return '玩家不存在';
    }

    const isCurrentTurn = this.isPlayerCurrentTurn(room, playerId);
    return PlayerValidator.getPlayerStatusDescription(player, isCurrentTurn);
  }

  /**
   * 清理离线会话
   */
  public cleanupOfflineSessions(): number {
    return this.playerSession.cleanupOfflineSessions();
  }

  /**
   * 获取玩家统计信息
   */
  public getPlayerStats(): {
    sessions: {
      total: number;
      online: number;
      offline: number;
    };
  } {
    return {
      sessions: this.playerSession.getSessionStats()
    };
  }
}
