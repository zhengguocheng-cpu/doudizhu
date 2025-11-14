import { GameRoom, Player } from '../../types';
import { GameEngine } from './gameEngine';
import { GameStateManager } from './gameState';
import { GameRules } from './gameRules';

/**
 * 游戏服务 - 统一游戏管理接口
 * 提供完整的游戏流程管理功能
 */
export class GameService {
  private gameEngine: GameEngine;

  constructor() {
    this.gameEngine = new GameEngine();
  }

  /**
   * 开始游戏
   */
  public startGame(roomId: string): { success: boolean; error?: string } {
    return this.gameEngine.startGame(roomId);
  }

  /**
   * 处理抢地主
   */
  public handleGrabLandlord(
    roomId: string,
    playerId: string,
    isGrab: boolean
  ): { success: boolean; error?: string; gameFinished?: boolean } {
    return this.gameEngine.handleGrabLandlord(roomId, playerId, isGrab);
  }

  // /**
  //  * 处理出牌
  //  */
  // public handlePlayCards(
  //   roomId: string,
  //   playerId: string,
  //   cards: string[]
  // ): { success: boolean; error?: string; nextPlayer?: Player } {
  //   return this.gameEngine.handlePlayCards(roomId, playerId, cards);
  // }

  /**
   * 处理跳过回合
   */
  public handlePassTurn(
    roomId: string,
    playerId: string
  ): { success: boolean; error?: string; nextPlayer?: Player } {
    return this.gameEngine.handlePassTurn(roomId, playerId);
  }

  /**
   * 结束游戏
   */
  public endGame(roomId: string, winner?: Player, reason?: string): { success: boolean; error?: string } {
    return this.gameEngine.endGame(roomId, winner, reason);
  }

  /**
   * 重启游戏
   */
  public restartGame(roomId: string): { success: boolean; error?: string } {
    return this.gameEngine.restartGame(roomId);
  }

  /**
   * 获取游戏状态
   */
  public getGameState(roomId: string) {
    return this.gameEngine.getGameState(roomId);
  }

  // /**
  //  * 处理游戏事件
  //  */
  // public handleGameEvent(
  //   roomId: string,
  //   event: string,
  //   playerId: string,
  //   data: any = {}
  // ): { success: boolean; error?: string; result?: any } {
  //   return this.gameEngine.handleGameEvent(roomId, event, playerId, data);
  // }

  // /**
  //  * 验证游戏规则
  //  */
  // public validateGameOperation(
  //   room: GameRoom,
  //   operation: string,
  //   playerId?: string,
  //   data?: any
  // ): { valid: boolean; error?: string } {
  //   switch (operation) {
  //     case 'start':
  //       return GameRules.validateGameStartConditions(room);
  //     case 'grab_landlord':
  //       return playerId ? GameRules.validateGrabLandlord(room, playerId, data?.isGrab || false) : { valid: false, error: '缺少玩家ID' };
  //     case 'play_cards':
  //       return playerId && data?.cards ? GameRules.validatePlayCards(room, playerId, data.cards) : { valid: false, error: '缺少参数' };
  //     case 'pass_turn':
  //       return playerId ? GameRules.validatePassTurn(room, playerId) : { valid: false, error: '缺少玩家ID' };
  //     default:
  //       return { valid: false, error: '未知操作' };
  //   }
  // }

  /**
   * 检查游戏是否结束
   */
  public isGameFinished(room: GameRoom): { finished: boolean; winner?: Player; reason?: string } {
    return GameStateManager.isGameFinished(room);
  }

  /**
   * 获取游戏统计信息
   */
  public getGameStats(room: GameRoom) {
    return GameStateManager.getGameStats(room);
  }

  /**
   * 获取游戏规则配置
   */
  public getGameConfig() {
    return GameRules.getGameConfig();
  }
}

// 导出获取实例的方法，而不是直接实例化
let gameServiceInstance: GameService | null = null;

export function getGameService(): GameService {
  if (!gameServiceInstance) {
    gameServiceInstance = new GameService();
  }
  return gameServiceInstance;
}

// 为了向后兼容，仍然导出获取实例的函数
// 注意：所有引用gameEngineService的地方都已改为getGameService()
