/**
 * 计分系统自动化测试
 * 基于 SCORING_SYSTEM_GUIDE.md 的测试场景
 */

import { ScoreCalculator } from '../services/game/ScoreCalculator';

// 测试工具函数
class TestHelper {
  /**
   * 创建测试玩家
   */
  static createPlayers(landlordId: string = 'player1'): any[] {
    return [
      {
        id: 'player1',
        name: '玩家A',
        role: landlordId === 'player1' ? 'landlord' : 'farmer',
        cards: [],
        cardCount: landlordId === 'player1' ? 20 : 17
      },
      {
        id: 'player2',
        name: '玩家B',
        role: landlordId === 'player2' ? 'landlord' : 'farmer',
        cards: [],
        cardCount: landlordId === 'player2' ? 20 : 17
      },
      {
        id: 'player3',
        name: '玩家C',
        role: landlordId === 'player3' ? 'landlord' : 'farmer',
        cards: [],
        cardCount: landlordId === 'player3' ? 20 : 17
      }
    ];
  }

  /**
   * 创建出牌历史
   */
  static createPlayHistory(bombs: number = 0, rockets: number = 0): any[] {
    const history: any[] = [];

    // 添加炸弹
    for (let i = 0; i < bombs; i++) {
      history.push({
        playerId: 'player1',
        playerName: '玩家A',
        cards: ['7♠', '7♥', '7♣', '7♦'],
        cardType: { type: 'BOMB' },
        timestamp: new Date()
      });
    }

    // 添加王炸
    for (let i = 0; i < rockets; i++) {
      history.push({
        playerId: 'player1',
        playerName: '玩家A',
        cards: ['🃏', '🂿'],
        cardType: { type: 'ROCKET' },
        timestamp: new Date()
      });
    }

    return history;
  }

  /**
   * 设置玩家手牌数（用于测试春天/反春）
   */
  static setPlayerCardCount(players: any[], playerId: string, count: number): void {
    const player = players.find(p => p.id === playerId);
    if (player) {
      player.cardCount = count;
    }
  }
}

// 测试套件
describe('ScoreCalculator - 计分系统测试', () => {
  
  // 场景1：基础得分（无倍数）
  describe('场景1：基础得分', () => {
    test('地主获胜 - 基础得分', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      // 设置获胜者手牌为0
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.baseScore).toBe(1);
      expect(score.bombCount).toBe(0);
      expect(score.rocketCount).toBe(0);
      expect(score.isSpring).toBe(false);
      expect(score.isAntiSpring).toBe(false);
      expect(score.landlordWin).toBe(true);
      
      // 验证倍数
      const multipliers = score.playerScores[0].multipliers;
      expect(multipliers.total).toBe(1);
      
      // 验证得分
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      const farmers = score.playerScores.filter(p => p.role === 'farmer');
      
      expect(landlord?.finalScore).toBe(2);  // 地主 +2
      expect(farmers[0]?.finalScore).toBe(-1);  // 农民 -1
      expect(farmers[1]?.finalScore).toBe(-1);  // 农民 -1
    });

    test('农民获胜 - 基础得分', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      // 农民获胜
      TestHelper.setPlayerCardCount(players, 'player2', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player2', history);
      
      expect(score.landlordWin).toBe(false);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      const farmers = score.playerScores.filter(p => p.role === 'farmer');
      
      expect(landlord?.finalScore).toBe(-2);  // 地主 -2
      expect(farmers[0]?.finalScore).toBe(1);  // 农民 +1
      expect(farmers[1]?.finalScore).toBe(1);  // 农民 +1
    });
  });

  // 场景2：单个炸弹
  describe('场景2：单个炸弹', () => {
    test('1个炸弹 - 倍数×2', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(1, 0);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.bombCount).toBe(1);
      expect(score.playerScores[0].multipliers.bomb).toBe(2);
      expect(score.playerScores[0].multipliers.total).toBe(2);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(4);  // 1 × 2 × 2 = 4
    });
  });

  // 场景3：多个炸弹
  describe('场景3：多个炸弹', () => {
    test('2个炸弹 - 倍数×4', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(2, 0);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.bombCount).toBe(2);
      expect(score.playerScores[0].multipliers.bomb).toBe(4);  // 2^2 = 4
      expect(score.playerScores[0].multipliers.total).toBe(4);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(8);  // 1 × 4 × 2 = 8
    });

    test('3个炸弹 - 倍数×8', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(3, 0);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.bombCount).toBe(3);
      expect(score.playerScores[0].multipliers.bomb).toBe(8);  // 2^3 = 8
      expect(score.playerScores[0].multipliers.total).toBe(8);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(16);  // 1 × 8 × 2 = 16
    });
  });

  // 场景4：王炸
  describe('场景4：王炸', () => {
    test('1个王炸 - 倍数×4', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 1);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.rocketCount).toBe(1);
      expect(score.playerScores[0].multipliers.rocket).toBe(4);
      expect(score.playerScores[0].multipliers.total).toBe(4);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(8);  // 1 × 4 × 2 = 8
    });

    test('2个王炸 - 倍数×16', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 2);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.rocketCount).toBe(2);
      expect(score.playerScores[0].multipliers.rocket).toBe(16);  // 4^2 = 16
      expect(score.playerScores[0].multipliers.total).toBe(16);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(32);  // 1 × 16 × 2 = 32
    });
  });

  // 场景5：炸弹+王炸
  describe('场景5：炸弹+王炸组合', () => {
    test('1炸弹+1王炸 - 倍数×8', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(1, 1);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.bombCount).toBe(1);
      expect(score.rocketCount).toBe(1);
      expect(score.playerScores[0].multipliers.bomb).toBe(2);
      expect(score.playerScores[0].multipliers.rocket).toBe(4);
      expect(score.playerScores[0].multipliers.total).toBe(8);  // 2 × 4 = 8
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(16);  // 1 × 8 × 2 = 16
    });

    test('2炸弹+1王炸 - 倍数×16', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(2, 1);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.playerScores[0].multipliers.total).toBe(16);  // 4 × 4 = 16
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(32);  // 1 × 16 × 2 = 32
    });
  });

  // 场景6：春天
  describe('场景6：春天', () => {
    test('春天 - 地主获胜且农民未出牌', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      // 地主出完牌
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      // 农民保持初始17张牌（未出牌）
      TestHelper.setPlayerCardCount(players, 'player2', 17);
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.isSpring).toBe(true);
      expect(score.isAntiSpring).toBe(false);
      expect(score.playerScores[0].multipliers.spring).toBe(2);
      expect(score.playerScores[0].multipliers.total).toBe(2);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(4);  // 1 × 2 × 2 = 4
    });

    test('非春天 - 农民出过牌', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      TestHelper.setPlayerCardCount(players, 'player2', 10);  // 农民出过牌
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.isSpring).toBe(false);
      expect(score.playerScores[0].multipliers.spring).toBe(1);
    });
  });

  // 场景7：反春
  describe('场景7：反春', () => {
    test('反春 - 农民获胜且地主未出牌', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      // 农民获胜
      TestHelper.setPlayerCardCount(players, 'player2', 0);
      // 地主保持初始20张牌（未出牌）
      TestHelper.setPlayerCardCount(players, 'player1', 20);
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player2', history);
      
      expect(score.isSpring).toBe(false);
      expect(score.isAntiSpring).toBe(true);
      expect(score.playerScores[0].multipliers.antiSpring).toBe(2);
      expect(score.playerScores[0].multipliers.total).toBe(2);
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(-4);  // -(1 × 2 × 2) = -4
    });

    test('非反春 - 地主出过牌', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(0, 0);
      
      TestHelper.setPlayerCardCount(players, 'player2', 0);
      TestHelper.setPlayerCardCount(players, 'player1', 15);  // 地主出过牌
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player2', history);
      
      expect(score.isAntiSpring).toBe(false);
      expect(score.playerScores[0].multipliers.antiSpring).toBe(1);
    });
  });

  // 场景8：极限倍数
  describe('场景8：极限倍数组合', () => {
    test('2炸弹+1王炸+春天 - 倍数×32', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(2, 1);
      
      // 地主获胜
      TestHelper.setPlayerCardCount(players, 'player1', 0);
      // 农民未出牌（春天）
      TestHelper.setPlayerCardCount(players, 'player2', 17);
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player1', history);
      
      expect(score.bombCount).toBe(2);
      expect(score.rocketCount).toBe(1);
      expect(score.isSpring).toBe(true);
      
      const multipliers = score.playerScores[0].multipliers;
      expect(multipliers.bomb).toBe(4);    // 2^2
      expect(multipliers.rocket).toBe(4);  // 4^1
      expect(multipliers.spring).toBe(2);
      expect(multipliers.total).toBe(32);  // 4 × 4 × 2 = 32
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(64);  // 1 × 32 × 2 = 64
    });

    test('3炸弹+2王炸+反春 - 倍数×256', () => {
      const players = TestHelper.createPlayers('player1');
      const history = TestHelper.createPlayHistory(3, 2);
      
      // 农民获胜
      TestHelper.setPlayerCardCount(players, 'player2', 0);
      // 地主未出牌（反春）
      TestHelper.setPlayerCardCount(players, 'player1', 20);
      TestHelper.setPlayerCardCount(players, 'player3', 17);
      
      const score = ScoreCalculator.calculateGameScore(players, 'player2', history);
      
      const multipliers = score.playerScores[0].multipliers;
      expect(multipliers.bomb).toBe(8);     // 2^3
      expect(multipliers.rocket).toBe(16);  // 4^2
      expect(multipliers.antiSpring).toBe(2);
      expect(multipliers.total).toBe(256);  // 8 × 16 × 2 = 256
      
      const landlord = score.playerScores.find(p => p.role === 'landlord');
      expect(landlord?.finalScore).toBe(-512);  // -(1 × 256 × 2) = -512
    });
  });

  // 倍数说明格式化测试
  describe('倍数说明格式化', () => {
    test('格式化基础倍数', () => {
      const multipliers = {
        base: 1,
        bomb: 1,
        rocket: 1,
        spring: 1,
        antiSpring: 1,
        total: 1
      };
      
      const desc = ScoreCalculator.formatMultiplierDescription(multipliers);
      expect(desc).toContain('基础倍数 (×1)');
      expect(desc).toContain('总倍数: ×1');
    });

    test('格式化炸弹倍数', () => {
      const multipliers = {
        base: 1,
        bomb: 4,  // 2个炸弹
        rocket: 1,
        spring: 1,
        antiSpring: 1,
        total: 4
      };
      
      const desc = ScoreCalculator.formatMultiplierDescription(multipliers);
      expect(desc).toContain('炸弹×2');
      expect(desc).toContain('总倍数: ×4');
    });

    test('格式化组合倍数', () => {
      const multipliers = {
        base: 1,
        bomb: 2,
        rocket: 4,
        spring: 2,
        antiSpring: 1,
        total: 16
      };
      
      const desc = ScoreCalculator.formatMultiplierDescription(multipliers);
      expect(desc).toContain('炸弹×1');
      expect(desc).toContain('王炸×1');
      expect(desc).toContain('春天');
      expect(desc).toContain('总倍数: ×16');
    });
  });
});

// 运行测试
console.log('🧪 开始运行计分系统自动化测试...\n');
