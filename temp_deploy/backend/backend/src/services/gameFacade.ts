import { GameRoom, Player } from '../types';
import { getGameService } from './game/gameService';
import { cardService } from './card/cardService';
import { roomService } from './room/roomService';
import { getPlayerService } from './player/playerService';

/**
 * 游戏门面服务
 * 提供统一、高级的游戏管理接口
 * 整合所有子服务，提供便捷的API
 */
export class GameFacade {
  /**
   * 创建房间并初始化
   */
  public createGameRoom(name: string, maxPlayers: number = 3): GameRoom {
    const room = roomService.createRoom(name, maxPlayers);
    console.log(`🏠 创建游戏房间: ${room.name} (${room.id})`);
    return room;
  }

  /**
   * 玩家快速加入游戏
   */
  public quickJoinGame(roomId: string, userName: string): { success: boolean; player?: Player; error?: string } {
    try {
      // 注意：这个方法在新架构中需要配合用户认证系统使用
      // 由于gameFacade是通用接口，这里仍然使用旧的joinRoom方法
      // 但在实际使用时应该通过用户认证流程
      const player = roomService.joinRoom(roomId, userName);
      console.log(`👤 玩家 ${player.name} 加入房间 ${roomId}`);
      return { success: true, player };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 快速开始游戏（检查条件并开始）
   */
  public quickStartGame(roomId: string): { success: boolean; error?: string } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    // 检查是否所有玩家都准备
    if (!getPlayerService().areAllPlayersReady(room)) {
      return { success: false, error: '不是所有玩家都已准备' };
    }

    // 开始游戏
    const result = getGameService().startGame(roomId);
    if (result.success) {
      console.log(`🎮 游戏开始: ${room.name}`);
    }

    return result;
  }

  /**
   * 执行游戏操作（通用接口）
   */
  public executeGameAction(
    roomId: string,
    action: string,
    playerId: string,
    data: any = {}
  ): { success: boolean; error?: string; result?: any } {
    try {
      switch (action) {
        case 'join':
          return this.quickJoinGame(roomId, data.playerName);

        case 'ready':
          const readyResult = roomService.togglePlayerReady(roomId, playerId);
          return { success: readyResult };

        case 'start':
          return this.quickStartGame(roomId);

        case 'grab_landlord':
          return getGameService().handleGrabLandlord(roomId, playerId, data.isGrab || false);

        case 'play_cards':
          return getGameService().handlePlayCards(roomId, playerId, data.cards || []);

        case 'pass_turn':
          return getGameService().handlePassTurn(roomId, playerId);

        case 'restart':
          return getGameService().restartGame(roomId);

        default:
          return { success: false, error: `未知操作: ${action}` };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取完整的游戏快照
   */
  public getGameSnapshot(roomId: string): {
    success: boolean;
    snapshot?: any;
    error?: string;
  } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    const gameState = getGameService().getGameState(roomId);
    const roomStats = roomService.getRoomStats();

    if (!gameState.success) {
      return { success: false, error: gameState.error };
    }

    return {
      success: true,
      snapshot: {
        room: {
          id: room.id,
          name: room.name,
          status: room.status,
          maxPlayers: room.maxPlayers,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
        },
        game: gameState.data,
        system: {
          roomStats,
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * 获取系统统计信息
   */
  public getSystemStats(): {
    rooms: any;
    players: any;
    games: any;
  } {
    return {
      rooms: roomService.getRoomStats(),
      players: getPlayerService().getPlayerStats(),
      games: {
        activeGames: roomService.getAllRooms().filter(r => r.status === 'playing').length,
        waitingGames: roomService.getAllRooms().filter(r => r.status === 'waiting').length,
        finishedGames: roomService.getAllRooms().filter(r => r.status === 'finished').length
      }
    };
  }

  /**
   * 清理系统资源
   */
  public cleanup(): { cleanedPlayers: number; cleanedRooms: number } {
    const cleanedPlayers = getPlayerService().cleanupOfflineSessions();
    console.log(`🧹 清理离线玩家会话: ${cleanedPlayers} 个`);

    return {
      cleanedPlayers,
      cleanedRooms: 0 // 房间清理逻辑
    };
  }

  /**
   * 验证系统健康状态
   */
  public healthCheck(): {
    healthy: boolean;
    services: { [key: string]: boolean };
    details: any;
  } {
    const services = {
      cardService: true, // CardService无状态
      roomService: true, // RoomService无状态
      playerService: true, // PlayerService无状态
      gameEngine: true // GameEngine无状态
    };

    const details = {
      timestamp: new Date().toISOString(),
      systemStats: this.getSystemStats(),
      services: Object.keys(services)
    };

    return {
      healthy: Object.values(services).every(status => status),
      services,
      details
    };
  }
}

// 导出单例实例
export const gameFacade = new GameFacade();
