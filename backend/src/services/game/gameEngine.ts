import { GameRoom, Player } from '../../types';
import { GameStateManager } from './gameState';
import { GameRules } from './gameRules';
import { roomService } from '../room/roomService';
import { getPlayerService } from '../player/playerService';
import { cardService } from '../card/cardService';

/**
 * 游戏引擎服务
 * 负责游戏流程控制和状态管理
 */
export class GameEngine {
  private playerService = getPlayerService();

  /**
   * 开始新游戏
   */
  public startGame(roomId: string): { success: boolean; error?: string } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    // 验证游戏开始条件
    const validation = GameRules.validateGameStartConditions(room);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // 使用CardService进行发牌
      const dealResult = cardService.dealCards(room.players.length);

      // 使用this.playerService分配手牌给玩家
      room.players.forEach((player, index) => {
        this.playerService.setPlayerCards(player, dealResult.playerCards[index].map(card =>
          `${card.suit}${card.rank}`
        ));
      });

      // 设置底牌
      room.cards.remaining = dealResult.bottomCards.map(card =>
        `${card.suit}${card.rank}`
      );

      // 初始化游戏状态
      room.status = 'playing';
      room.currentPlayerIndex = 0;
      room.updatedAt = new Date();

      console.log(`🎮 游戏开始，房间 ${roomId} 发牌完成`);
      return { success: true };
    } catch (error) {
      console.error('开始游戏失败:', error);
      return { success: false, error: '发牌失败' };
    }
  }

  /**
   * 处理抢地主操作
   */
  public handleGrabLandlord(
    roomId: string,
    playerId: string,
    isGrab: boolean
  ): { success: boolean; error?: string; gameFinished?: boolean } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    // 验证抢地主操作
    const validation = GameRules.validateGrabLandlord(room, playerId, isGrab);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 处理抢地主逻辑
    if (isGrab) {
      // 设置地主
      const success = this.playerService.setLandlord(room, playerId);
      if (!success) {
        return { success: false, error: '设置地主失败' };
      }

      // 给地主发底牌
      const landlord = this.playerService.getPlayer(room, playerId);
      if (landlord && room.cards.remaining) {
        const currentCards = landlord.cards || [];
        this.playerService.setPlayerCards(landlord, [...currentCards, ...room.cards.remaining]);
      }

      // 设置第一个出牌玩家为地主
      GameStateManager.setCurrentPlayer(room, playerId);

      console.log(`🏆 玩家 ${playerId} 抢地主成功，成为地主`);
      return { success: true };
    } else {
      // 不抢，切换到下一个玩家
      GameStateManager.switchToNextPlayer(room);
      return { success: true };
    }
  }

  // /**
  //  * 处理出牌操作
  //  */
  // public handlePlayCards(
  //   roomId: string,
  //   playerId: string,
  //   cards: string[]
  // ): { success: boolean; error?: string; nextPlayer?: Player } {
  //   const room = roomService.getRoom(roomId);
  //   if (!room) {
  //     return { success: false, error: '房间不存在' };
  //   }

  //   // 验证出牌操作
  //   const validation = GameRules.validatePlayCards(room, playerId, cards);
  //   if (!validation.valid) {
  //     return { success: false, error: validation.error };
  //   }

  //   try {
  //     const player = this.playerService.getPlayer(room, playerId);
  //     if (!player) {
  //       return { success: false, error: '玩家不存在' };
  //     }

  //     // 从玩家手牌中移除出的牌
  //     const remainingCards = (player.cards || []).filter((card: string) => !cards.includes(card));
  //     this.playerService.updatePlayerCards(player, remainingCards);

  //     // 记录出牌
  //     room.cards.played.push([...cards]);

  //     // 检查游戏是否结束
  //     const gameFinishedCheck = GameStateManager.isGameFinished(room);
  //     if (gameFinishedCheck.finished) {
  //       this.endGame(roomId, gameFinishedCheck.winner, gameFinishedCheck.reason);
  //       return {
  //         success: true,
  //         nextPlayer: gameFinishedCheck.winner
  //       };
  //     }

  //     // 切换到下一个玩家
  //     GameStateManager.switchToNextPlayer(room);

  //     const nextPlayer = GameStateManager.getCurrentPlayer(room);
  //     console.log(`🎯 玩家 ${player.name} 出牌成功，下一位玩家: ${nextPlayer?.name || '未知'}`);

  //     return {
  //       success: true,
  //       nextPlayer
  //     };
  //   } catch (error) {
  //     console.error('出牌处理失败:', error);
  //     return { success: false, error: '出牌处理失败' };
  //   }
  // }

  /**
   * 处理跳过操作
   */
  public handlePassTurn(
    roomId: string,
    playerId: string
  ): { success: boolean; error?: string; nextPlayer?: Player } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    // 验证跳过操作
    const validation = GameRules.validatePassTurn(room, playerId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // 切换到下一个玩家
      GameStateManager.switchToNextPlayer(room);

      const nextPlayer = GameStateManager.getCurrentPlayer(room);
      console.log(`⏭️ 玩家 ${playerId} 跳过回合，下一位玩家: ${nextPlayer?.name || '未知'}`);

      return {
        success: true,
        nextPlayer
      };
    } catch (error) {
      console.error('跳过回合处理失败:', error);
      return { success: false, error: '跳过回合处理失败' };
    }
  }

  /**
   * 结束游戏
   */
  public endGame(roomId: string, winner?: Player, reason?: string): { success: boolean; error?: string } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    try {
      // 设置游戏结束状态
      room.status = 'finished';
      room.updatedAt = new Date();

      // 记录胜者信息
      if (winner) {
        console.log(`🏁 游戏结束，胜者: ${winner.name}，原因: ${reason || '正常结束'}`);
      }

      return { success: true };
    } catch (error) {
      console.error('结束游戏失败:', error);
      return { success: false, error: '结束游戏失败' };
    }
  }

  /**
   * 重启游戏
   */
  public restartGame(roomId: string): { success: boolean; error?: string } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    // 检查是否可以开始新游戏
    const validation = GameStateManager.canStartNewGame(room);
    if (!validation.canStart) {
      return { success: false, error: validation.reason };
    }

    try {
      // 重置游戏状态
      GameStateManager.resetGameState(room);

      console.log(`🔄 游戏重启，房间 ${roomId} 状态已重置`);
      return { success: true };
    } catch (error) {
      console.error('重启游戏失败:', error);
      return { success: false, error: '重启游戏失败' };
    }
  }

  /**
   * 获取游戏状态信息
   */
  public getGameState(roomId: string): {
    success: boolean;
    data?: any;
    error?: string;
  } {
    const room = roomService.getRoom(roomId);
    if (!room) {
      return { success: false, error: '房间不存在' };
    }

    try {
      const currentPlayer = GameStateManager.getCurrentPlayer(room);
      const nextPlayer = GameStateManager.getNextPlayer(room);
      const gameStats = GameStateManager.getGameStats(room);
      const phaseDescription = GameStateManager.getGamePhaseDescription(room);

      const gameFinishedCheck = GameStateManager.isGameFinished(room);

      return {
        success: true,
        data: {
          roomId,
          status: room.status,
          phase: phaseDescription,
          currentPlayer: currentPlayer ? {
            id: currentPlayer.id,
            name: currentPlayer.name,
            cardCount: currentPlayer.cardCount
          } : null,
          nextPlayer: nextPlayer ? {
            id: nextPlayer.id,
            name: nextPlayer.name,
            cardCount: nextPlayer.cardCount
          } : null,
          landlord: room.landlord ? {
            id: room.landlord.id,
            name: room.landlord.name
          } : null,
          stats: gameStats,
          players: room.players.map(player => ({
            id: player.id,
            name: player.name,
            cardCount: player.cardCount,
            ready: player.ready,
            status: this.playerService.getPlayerStatusDescription(room, player.id)
          })),
          gameFinished: gameFinishedCheck.finished,
          winner: gameFinishedCheck.winner,
          finishReason: gameFinishedCheck.reason
        }
      };
    } catch (error) {
      console.error('获取游戏状态失败:', error);
      return { success: false, error: '获取游戏状态失败' };
    }
  }

  /**
   * 处理游戏事件
   */
  public handleGameEvent(
    roomId: string,
    event: string,
    playerId: string,
    data: any = {}
  ): { success: boolean; error?: string; result?: any } {
    try {
      switch (event) {
        case 'start_game':
          return {
            success: this.startGame(roomId).success,
            error: this.startGame(roomId).error
          };

        case 'grab_landlord':
          return this.handleGrabLandlord(roomId, playerId, data.isGrab || false);

        case 'play_cards':
          return this.handlePlayCards(roomId, playerId, data.cards || []);

        case 'pass_turn':
          return this.handlePassTurn(roomId, playerId);

        case 'end_game':
          return this.endGame(roomId, data.winner, data.reason);

        case 'restart_game':
          return this.restartGame(roomId);

        default:
          return { success: false, error: '未知的游戏事件' };
      }
    } catch (error) {
      console.error('处理游戏事件失败:', error);
      return { success: false, error: '处理游戏事件失败' };
    }
  }
}
