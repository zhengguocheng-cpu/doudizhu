import { Player, GameRoom } from '../../types';
import { PlayerManager } from './playerManager';
import { PlayerValidator } from './playerValidator';
import { PlayerSession } from './playerSession';
import { BaseService } from '../../core/BaseService';
import { LogLevel } from '../../types';

/**
 * 玩家服务 - 统一玩家管理接口
 * 提供完整的玩家生命周期管理功能
 */
export class PlayerService extends BaseService {
  private playerManager!: PlayerManager;

  constructor() {
    super();
  }

  protected async onInitialize(): Promise<void> {
    this.playerManager = this.getService('PlayerManager');
    this.log(LogLevel.INFO, 'PlayerService initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'PlayerService destroyed');
  }

  /**
   * 创建玩家
   */
  public createPlayer(name: string): Player {
    return this.playerManager.createPlayer(name);
  }

  /**
   * 添加玩家到房间
   */
  public addPlayerToRoom(room: GameRoom, playerName: string): Player {
    return this.playerManager.addPlayerToRoom(room, playerName);
  }

  /**
   * 从房间移除玩家
   */
  public removePlayerFromRoom(room: GameRoom, playerId: string): boolean {
    return this.playerManager.removePlayerFromRoom(room, playerId);
  }

  /**
   * 切换玩家准备状态
   */
  public togglePlayerReady(room: GameRoom, playerId: string): boolean {
    return this.playerManager.togglePlayerReady(room, playerId);
  }

  /**
   * 设置玩家手牌
   */
  public setPlayerCards(player: Player, cards: string[]): void {
    this.playerManager.setPlayerCards(player, cards);
  }

  /**
   * 更新玩家手牌
   */
  public updatePlayerCards(player: Player, remainingCards: string[]): void {
    this.playerManager.updatePlayerCards(player, remainingCards);
  }

  /**
   * 设置地主
   */
  public setLandlord(room: GameRoom, playerId: string): boolean {
    return this.playerManager.setLandlord(room, playerId);
  }

  /**
   * 获取房间玩家列表
   */
  public getRoomPlayers(room: GameRoom): Player[] {
    return this.playerManager.getRoomPlayers(room);
  }

  /**
   * 获取特定玩家
   */
  public getPlayer(room: GameRoom, playerId: string): Player | undefined {
    return this.playerManager.getPlayer(room, playerId);
  }

  /**
   * 验证玩家操作权限
   */
  public validatePlayerOperation(
    room: GameRoom,
    playerId: string,
    operation: string
  ): { valid: boolean; error?: string } {
    switch (operation) {
      case 'ready':
        return PlayerValidator.validatePlayerCanReady(room, playerId);
      case 'leave':
        return PlayerValidator.validatePlayerCanLeave(room, playerId);
      case 'play':
        return PlayerValidator.validatePlayerCanPlay(room, playerId);
      case 'grab_landlord':
        return PlayerValidator.validatePlayerCanGrabLandlord(room, playerId);
      case 'pass':
        return PlayerValidator.validatePlayerCanPass(room, playerId);
      default:
        return { valid: false, error: '未知操作' };
    }
  }

  /**
   * 检查玩家状态
   */
  public isPlayerReady(room: GameRoom, playerId: string): boolean {
    return this.playerManager.isPlayerReady(room, playerId);
  }

  /**
   * 检查是否所有玩家都准备
   */
  public areAllPlayersReady(room: GameRoom): boolean {
    return this.playerManager.areAllPlayersReady(room);
  }

  /**
   * 检查玩家是否是地主
   */
  public isPlayerLandlord(room: GameRoom, playerId: string): boolean {
    return this.playerManager.isPlayerLandlord(room, playerId);
  }

  /**
   * 检查玩家是否是当前回合
   */
  public isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean {
    return this.playerManager.isPlayerCurrentTurn(room, playerId);
  }

  /**
   * 获取玩家状态描述
   */
  public getPlayerStatusDescription(room: GameRoom, playerId: string): string {
    return this.playerManager.getPlayerStatusDescription(room, playerId);
  }

  /**
   * 验证玩家手牌
   */
  public validatePlayerCards(playerCards: string[] | undefined, playedCards: string[]): { valid: boolean; error?: string } {
    return PlayerValidator.validatePlayerCards(playerCards, playedCards);
  }

  /**
   * 清理离线会话
   */
  public cleanupOfflineSessions(): number {
    return this.playerManager.cleanupOfflineSessions();
  }

  /**
   * 获取玩家统计信息
   */
  public getPlayerStats() {
    return this.playerManager.getPlayerStats();
  }
}

// 导出获取实例的方法，而不是直接实例化
let playerServiceInstance: PlayerService | null = null;

export function getPlayerService(): PlayerService {
  if (!playerServiceInstance) {
    playerServiceInstance = new PlayerService();
    // 异步初始化服务
    playerServiceInstance.initialize().catch(error => {
      console.error('PlayerService初始化失败:', error);
    });
  }
  return playerServiceInstance;
}
