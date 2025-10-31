import { GameRoom, Player } from '../../types';

/**
 * 游戏状态管理服务
 * 负责游戏状态的计算、更新和查询
 */
export class GameStateManager {
  /**
   * 计算下一个玩家索引
   */
  public static getNextPlayerIndex(room: GameRoom): number {
    if (room.currentPlayerIndex === -1) {
      return 0;
    }

    const nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
    return nextIndex;
  }

  /**
   * 获取当前玩家
   */
  public static getCurrentPlayer(room: GameRoom): Player | undefined {
    if (room.currentPlayerIndex === -1 || room.currentPlayerIndex >= room.players.length) {
      return undefined;
    }
    return room.players[room.currentPlayerIndex];
  }

  /**
   * 获取下一个玩家
   */
  public static getNextPlayer(room: GameRoom): Player | undefined {
    const nextIndex = this.getNextPlayerIndex(room);
    return room.players[nextIndex];
  }

  /**
   * 设置当前玩家
   */
  public static setCurrentPlayer(room: GameRoom, playerId: string): boolean {
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return false;
    }

    room.currentPlayerIndex = playerIndex;
    room.updatedAt = new Date();
    return true;
  }

  /**
   * 切换到下一个玩家
   */
  public static switchToNextPlayer(room: GameRoom): boolean {
    if (room.players.length === 0) {
      return false;
    }

    room.currentPlayerIndex = this.getNextPlayerIndex(room);
    room.updatedAt = new Date();
    return true;
  }

  /**
   * 检查游戏是否结束
   */
  public static isGameFinished(room: GameRoom): { finished: boolean; winner?: Player; reason?: string } {
    // 检查是否有玩家出完所有牌
    const playerWithNoCards = room.players.find(player =>
      player.cards && player.cards.length === 0
    );

    if (playerWithNoCards) {
      return {
        finished: true,
        winner: playerWithNoCards,
        reason: `${playerWithNoCards.name}出完所有牌，游戏结束`
      };
    }

    // 检查是否只剩一个玩家有牌（其他玩家都不要）
    const playersWithCards = room.players.filter(player =>
      player.cards && player.cards.length > 0
    );

    if (playersWithCards.length <= 1) {
      const winner = playersWithCards[0] || room.players[0];
      return {
        finished: true,
        winner,
        reason: '只剩一个玩家有牌，游戏结束'
      };
    }

    // 检查是否达到最大回合数（防止无限游戏）
    const maxRounds = 100;
    if (room.cards.played.length > maxRounds) {
      // 找到手牌最少的玩家作为胜者
      const sortedPlayers = room.players.sort((a, b) =>
        (a.cardCount || 0) - (b.cardCount || 0)
      );
      return {
        finished: true,
        winner: sortedPlayers[0],
        reason: '达到最大回合数，按手牌数量判定胜者'
      };
    }

    return { finished: false };
  }

  /**
   * 计算玩家得分
   */
  public static calculatePlayerScore(player: Player, isWinner: boolean, isLandlord: boolean): number {
    const baseScore = 10;

    if (isWinner) {
      // 胜者得分
      if (isLandlord) {
        return baseScore * 2; // 地主胜者双倍得分
      } else {
        return baseScore; // 农民胜者基础得分
      }
    } else {
      // 败者扣分
      if (isLandlord) {
        return -baseScore * 2; // 地主败者双倍扣分
      } else {
        return -baseScore; // 农民败者基础扣分
      }
    }
  }

  /**
   * 获取游戏统计信息
   */
  public static getGameStats(room: GameRoom): {
    totalRounds: number;
    currentRound: number;
    remainingCards: number;
    playedCards: number;
    playersWithCards: number;
    gameDuration?: number;
  } {
    const totalCards = room.players.reduce((sum, player) => sum + (player.cardCount || 0), 0);
    const remainingCards = totalCards + (room.cards.remaining?.length || 0);
    const playedCards = room.cards.played.reduce((sum, round) => sum + round.length, 0);

    const startTime = room.updatedAt || new Date();
    const gameDuration = Date.now() - startTime.getTime();

    return {
      totalRounds: room.cards.played.length,
      currentRound: room.currentPlayerIndex + 1,
      remainingCards,
      playedCards,
      playersWithCards: room.players.filter(p => (p.cardCount || 0) > 0).length,
      gameDuration: Math.floor(gameDuration / 1000) // 秒
    };
  }

  /**
   * 获取游戏阶段描述
   */
  public static getGamePhaseDescription(room: GameRoom): string {
    if (room.status === 'waiting') {
      return '等待玩家准备';
    } else if (room.status === 'playing') {
      if (!room.landlord) {
        return '抢地主阶段';
      } else {
        return '游戏进行中';
      }
    } else if (room.status === 'finished') {
      return '游戏已结束';
    }

    return '未知状态';
  }

  /**
   * 检查是否可以开始新游戏
   */
  public static canStartNewGame(room: GameRoom): { canStart: boolean; reason?: string } {
    // 检查房间状态
    if (room.status !== 'finished') {
      return { canStart: false, reason: '当前游戏未结束' };
    }

    // 检查是否有足够玩家
    if (room.players.length < 3) {
      return { canStart: false, reason: '玩家数量不足，需要至少3名玩家' };
    }

    // 检查所有玩家是否都准备好
    const allReady = room.players.every(player => player.ready);
    if (!allReady) {
      return { canStart: false, reason: '不是所有玩家都已准备' };
    }

    return { canStart: true };
  }

  /**
   * 重置游戏状态
   */
  public static resetGameState(room: GameRoom): void {
    room.status = 'waiting';
    room.currentPlayerIndex = 0;
    room.landlord = null;
    room.cards = {
      remaining: [],
      played: []
    };

    // 重置所有玩家状态
    room.players.forEach(player => {
      player.ready = false;
      player.cards = [];
      player.cardCount = 0;
    });

    room.updatedAt = new Date();
  }
}
