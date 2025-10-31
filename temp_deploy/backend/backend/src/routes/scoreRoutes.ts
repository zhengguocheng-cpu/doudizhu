/**
 * 积分系统API路由
 */

import { Router, Request, Response } from 'express';
import { scoreService } from '../services/score/ScoreService';

const router = Router();

/**
 * 获取玩家积分记录
 * GET /api/score/:userId
 */
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const record = scoreService.getPlayerScore(userId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '玩家记录不存在'
      });
    }

    return res.json({
      success: true,
      data: record
    });
  } catch (error: any) {
    console.error('获取玩家积分失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取玩家统计数据
 * GET /api/score/:userId/stats
 */
router.get('/:userId/stats', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = scoreService.getPlayerStats(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: '玩家记录不存在'
      });
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('获取玩家统计失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取玩家成就
 * GET /api/score/:userId/achievements
 */
router.get('/:userId/achievements', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const achievements = scoreService.getPlayerAchievements(userId);

    res.json({
      success: true,
      data: achievements
    });
  } catch (error: any) {
    console.error('获取玩家成就失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取排行榜
 * GET /api/score/leaderboard/:type
 * type: score | winRate | wins
 */
router.get('/leaderboard/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!['score', 'winRate', 'wins'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的排行榜类型'
      });
    }

    const leaderboard = scoreService.getLeaderboard(type as any, limit);

    return res.json({
      success: true,
      data: leaderboard
    });
  } catch (error: any) {
    console.error('获取排行榜失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取玩家排名
 * GET /api/score/:userId/rank/:type
 */
router.get('/:userId/rank/:type', (req: Request, res: Response) => {
  try {
    const { userId, type } = req.params;

    if (!['score', 'winRate', 'wins'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的排行榜类型'
      });
    }

    const rank = scoreService.getPlayerRank(userId, type as any);

    return res.json({
      success: true,
      data: {
        userId,
        type,
        rank: rank === -1 ? null : rank
      }
    });
  } catch (error: any) {
    console.error('获取玩家排名失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 调整玩家积分（管理员）
 * POST /api/score/:userId/adjust
 */
router.post('/:userId/adjust', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, reason, note } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        message: '无效的积分数量'
      });
    }

    scoreService.adjustScore(userId, amount, reason || 'admin_adjust', note);

    return res.json({
      success: true,
      message: '积分调整成功'
    });
  } catch (error: any) {
    console.error('调整积分失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 获取系统统计信息
 * GET /api/score/system/stats
 */
router.get('/system/stats', (req: Request, res: Response) => {
  try {
    const stats = scoreService.getSystemStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 备份数据库
 * POST /api/score/system/backup
 */
router.post('/system/backup', (req: Request, res: Response) => {
  try {
    scoreService.backup();

    res.json({
      success: true,
      message: '数据库备份成功'
    });
  } catch (error: any) {
    console.error('备份数据库失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
