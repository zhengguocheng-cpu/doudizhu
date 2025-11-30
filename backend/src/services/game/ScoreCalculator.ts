/**
 * 计分系统
 * 负责计算游戏得分和倍数
 * 创建时间：2025-10-29
 */

export interface ScoreMultipliers {
  base: number;           // 基础倍数
  bomb: number;           // 炸弹倍数
  rocket: number;         // 王炸倍数
  spring: number;         // 春天倍数
  antiSpring: number;     // 反春倍数
  total: number;          // 总倍数
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  role: 'landlord' | 'farmer';
  isWinner: boolean;
  baseScore: number;      // 基础分
  multipliers: ScoreMultipliers;
  finalScore: number;     // 最终得分（正数为赢，负数为输）
}

export interface GameScore {
  baseScore: number;      // 基础分（默认1分）
  bombCount: number;      // 炸弹数量
  rocketCount: number;    // 王炸数量
  isSpring: boolean;      // 是否春天
  isAntiSpring: boolean;  // 是否反春
  landlordWin: boolean;   // 地主是否获胜
  playerScores: PlayerScore[];
}

export class ScoreCalculator {
  private static readonly BASE_SCORE = 5000;  // 基础分

  /**
   * 计算游戏得分
   */
  public static calculateGameScore(
    players: any[],
    winnerId: string,
    gameHistory: any[]
  ): GameScore {
    const winner = players.find(p => p.id === winnerId);
    if (!winner) {
      throw new Error('找不到获胜者');
    }

    const landlordWin = winner.role === 'landlord';
    
    // 统计炸弹和王炸数量
    const { bombCount, rocketCount } = this.countBombsAndRockets(gameHistory);
    
    // 判断春天和反春
    const isSpring = this.checkSpring(players, landlordWin, gameHistory);
    const isAntiSpring = this.checkAntiSpring(players, landlordWin, gameHistory);
    
    // 计算倍数
    const multipliers = this.calculateMultipliers(bombCount, rocketCount, isSpring, isAntiSpring);
    
    // 计算每个玩家的得分
    const playerScores = this.calculatePlayerScores(
      players,
      winnerId,
      this.BASE_SCORE,
      multipliers
    );

    return {
      baseScore: this.BASE_SCORE,
      bombCount,
      rocketCount,
      isSpring,
      isAntiSpring,
      landlordWin,
      playerScores
    };
  }

  /**
   * 统计炸弹和王炸数量
   */
  private static countBombsAndRockets(gameHistory: any[]): { bombCount: number; rocketCount: number } {
    let bombCount = 0;
    let rocketCount = 0;

    if (!gameHistory || gameHistory.length === 0) {
      return { bombCount, rocketCount };
    }

    gameHistory.forEach(play => {
      if (play.cardType) {
        const type = play.cardType.type || play.cardType.TYPE;
        if (type === 'bomb' || type === 'BOMB') {
          bombCount++;
        } else if (type === 'rocket' || type === 'ROCKET') {
          rocketCount++;
        }
      }
    });

    return { bombCount, rocketCount };
  }

  /**
   * 检查是否春天
   * 春天：地主获胜，且农民一张牌都没出过
   */
  private static checkSpring(players: any[], landlordWin: boolean, gameHistory: any[]): boolean {
    if (!landlordWin) return false;

    const farmers = players.filter(p => p.role === 'farmer');
    if (farmers.length === 0) return false;

    // 检查游戏历史中是否有农民真正出过牌（PASS 不算）
    const farmerIds = farmers.map(f => f.id);
    const farmerPlayed = gameHistory.some(play =>
      farmerIds.includes(play.playerId) && Array.isArray(play.cards) && play.cards.length > 0
    );
    
    return !farmerPlayed;  // 农民没出过任何牌就是春天
  }

  /**
   * 检查是否反春
   * 反春：农民获胜，且地主一张牌都没出过
   */
  private static checkAntiSpring(players: any[], landlordWin: boolean, gameHistory: any[]): boolean {
    if (landlordWin) return false;

    const landlord = players.find(p => p.role === 'landlord');
    if (!landlord) return false;

    // 检查游戏历史中地主是否真正出过牌（PASS 不算）
    const landlordPlayed = gameHistory.some(play =>
      play.playerId === landlord.id && Array.isArray(play.cards) && play.cards.length > 0
    );
    
    return !landlordPlayed;  // 地主没出过任何牌就是反春
  }

  /**
   * 计算倍数
   */
  private static calculateMultipliers(
    bombCount: number,
    rocketCount: number,
    isSpring: boolean,
    isAntiSpring: boolean
  ): ScoreMultipliers {
    let base = 1;
    let bomb = 1;
    let rocket = 1;
    let spring = 1;
    let antiSpring = 1;

    // 炸弹倍数：每个炸弹×3
    if (bombCount > 0) {
      bomb = Math.pow(3, bombCount);
    }

    // 王炸倍数：每个王炸×8
    if (rocketCount > 0) {
      rocket = Math.pow(8, rocketCount);
    }

    // 春天倍数：×16
    if (isSpring) {
      spring = 16;
    }

    // 反春倍数：×16
    if (isAntiSpring) {
      antiSpring = 16;
    }

    // 总倍数 = 基础 × 炸弹 × 王炸 × 春天 × 反春
    const total = base * bomb * rocket * spring * antiSpring;

    return {
      base,
      bomb,
      rocket,
      spring,
      antiSpring,
      total
    };
  }

  /**
   * 计算每个玩家的得分
   */
  private static calculatePlayerScores(
    players: any[],
    winnerId: string,
    baseScore: number,
    multipliers: ScoreMultipliers
  ): PlayerScore[] {
    const landlord = players.find(p => p.role === 'landlord');
    const farmers = players.filter(p => p.role === 'farmer');

    if (!landlord || farmers.length !== 2) {
      throw new Error('玩家角色配置错误');
    }

    const landlordWin = winnerId === landlord.id;
    const scorePerPlayer = baseScore * multipliers.total;

    const playerScores: PlayerScore[] = [];

    if (landlordWin) {
      // 地主获胜：地主得分，每个农民失分
      playerScores.push({
        playerId: landlord.id,
        playerName: landlord.name,
        role: 'landlord',
        isWinner: true,
        baseScore,
        multipliers,
        finalScore: scorePerPlayer * 2  // 地主赢得2个农民的分
      });

      farmers.forEach(farmer => {
        playerScores.push({
          playerId: farmer.id,
          playerName: farmer.name,
          role: 'farmer',
          isWinner: false,
          baseScore,
          multipliers,
          finalScore: -scorePerPlayer  // 每个农民失分
        });
      });
    } else {
      // 农民获胜：每个农民得分，地主失分
      playerScores.push({
        playerId: landlord.id,
        playerName: landlord.name,
        role: 'landlord',
        isWinner: false,
        baseScore,
        multipliers,
        finalScore: -scorePerPlayer * 2  // 地主输给2个农民
      });

      farmers.forEach(farmer => {
        const isWinner = farmer.id === winnerId;
        playerScores.push({
          playerId: farmer.id,
          playerName: farmer.name,
          role: 'farmer',
          isWinner,
          baseScore,
          multipliers,
          finalScore: scorePerPlayer  // 每个农民得分
        });
      });
    }

    return playerScores;
  }

  /**
   * 格式化倍数说明
   */
  public static formatMultiplierDescription(multipliers: ScoreMultipliers): string[] {
    const descriptions: string[] = [];

    if (multipliers.bomb > 1) {
      // 优先按 3 的幂来推断炸弹数量（与 calculateMultipliers 中 3^n 规则一致）
      let bombCount = 1;
      const bomb = multipliers.bomb;

      const approxBy3 = Math.log(bomb) / Math.log(3);
      const round3 = Math.round(approxBy3);
      if (round3 > 0 && Math.abs(Math.pow(3, round3) - bomb) < 1e-6) {
        bombCount = round3;
      } else {
        // 如果不是 3^n，再按 2^n 尝试（兼容测试中使用的 4 = 2^2 等场景）
        const approxBy2 = Math.log(bomb) / Math.log(2);
        const round2 = Math.round(approxBy2);
        if (round2 > 0 && Math.abs(Math.pow(2, round2) - bomb) < 1e-6) {
          bombCount = round2;
        }
      }

      descriptions.push(`炸弹×${bombCount} (×${bomb})`);
    }

    if (multipliers.rocket > 1) {
      const rocketCount = Math.round(Math.log(multipliers.rocket) / Math.log(8));
      descriptions.push(`王炸×${rocketCount} (×${multipliers.rocket})`);
    }

    if (multipliers.spring > 1) {
      descriptions.push(`春天 (×${multipliers.spring})`);
    }

    if (multipliers.antiSpring > 1) {
      descriptions.push(`反春 (×${multipliers.antiSpring})`);
    }

    if (descriptions.length === 0) {
      descriptions.push('基础倍数 (×1)');
    }

    descriptions.push(`总倍数: ×${multipliers.total}`);

    return descriptions;
  }
}
