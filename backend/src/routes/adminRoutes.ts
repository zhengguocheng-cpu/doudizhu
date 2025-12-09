import express from 'express'
import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { scoreDAO } from '../dao/ScoreDAO'

const router = express.Router()

router.get('/game-logs', (req, res) => {
  try {
    const logDir = config.paths.gameLogs
    const summaryFile = path.join(logDir, 'all_games.jsonl')

    if (!fs.existsSync(logDir) || !fs.existsSync(summaryFile)) {
      res.json({ success: true, games: [], total: 0 })
      return
    }

    const raw = fs.readFileSync(summaryFile, 'utf-8')
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const logs: any[] = []
    for (const line of lines) {
      try {
        const obj = JSON.parse(line)
        if (obj && obj.gameId) {
          logs.push(obj)
        }
      } catch {
      }
    }

    if (logs.length === 0) {
      res.json({ success: true, games: [], total: 0 })
      return
    }

    logs.sort((a, b) => {
      const ta = new Date(a.endedAt || a.startedAt || 0).getTime()
      const tb = new Date(b.endedAt || b.startedAt || 0).getTime()
      return tb - ta
    })

    const limitParam = parseInt(String(req.query.limit ?? '50'), 10)
    const limit = Number.isNaN(limitParam) ? 50 : Math.max(1, Math.min(limitParam, 200))

    const slice = logs.slice(0, limit)

    const summaries = slice.map((log) => ({
      gameId: log.gameId,
      roomId: log.roomId,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      durationMs: log.durationMs,
      landlordId: log.landlordId ?? null,
      winnerId: log.result?.winnerId,
      winnerName: log.result?.winnerName,
      winnerRole: log.result?.winnerRole,
      landlordWin: !!log.result?.landlordWin,
      baseScore: log.result?.baseScore,
      bombCount: log.result?.bombCount,
      rocketCount: log.result?.rocketCount,
      isSpring: !!log.result?.isSpring,
      isAntiSpring: !!log.result?.isAntiSpring,
      players: Array.isArray(log.players)
        ? log.players.map((p: any) => ({
            playerId: p.playerId,
            playerName: p.playerName,
            role: p.role ?? null,
            isBot: !!p.isBot,
          }))
        : [],
    }))

    res.json({ success: true, games: summaries, total: logs.length })
  } catch (error: any) {
    console.error('获取对局日志列表失败:', error)
    res.status(500).json({
      success: false,
      message: error?.message || '获取对局日志列表失败',
    })
  }
})

router.get('/game-logs/:gameId', (req, res) => {
  try {
    const { gameId } = req.params

    if (!gameId) {
      res.status(400).json({ success: false, message: '缺少 gameId 参数' })
      return
    }

    const logDir = config.paths.gameLogs
    const summaryFile = path.join(logDir, 'all_games.jsonl')

    if (!fs.existsSync(logDir) || !fs.existsSync(summaryFile)) {
      res.status(404).json({ success: false, message: '暂无对局日志' })
      return
    }

    const raw = fs.readFileSync(summaryFile, 'utf-8')
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    let found: any = null
    for (const line of lines) {
      try {
        const obj = JSON.parse(line)
        if (obj && obj.gameId === gameId) {
          found = obj
          break
        }
      } catch {
      }
    }

    if (!found) {
      res.status(404).json({ success: false, message: '未找到指定对局' })
      return
    }

    res.json({ success: true, game: found })
  } catch (error: any) {
    console.error('获取对局日志详情失败:', error)
    res.status(500).json({
      success: false,
      message: error?.message || '获取对局日志详情失败',
    })
  }
})

router.get('/users', (req, res) => {
  try {
    const players = scoreDAO.getAllPlayers()

    const users = players.map((p) => {
      const history = Array.isArray(p.gameHistory) ? p.gameHistory : []
      const totalPlayTimeSeconds = history.reduce(
        (sum, game) => sum + (typeof (game as any).duration === 'number' ? (game as any).duration : 0),
        0,
      )

      return {
        userId: p.userId,
        username: p.username,
        totalScore: p.totalScore,
        gamesPlayed: p.gamesPlayed,
        gamesWon: p.gamesWon,
        winRate: p.winRate,
        createdAt: p.createdAt,
        lastPlayedAt: p.lastPlayedAt || null,
        isBot: typeof p.userId === 'string' && p.userId.startsWith('bot_'),
        totalPlayTimeSeconds,
      }
    })

    res.json({ success: true, users })
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: error?.message || '获取用户列表失败',
    })
  }
})

router.get('/analytics/usage-trend', (req, res) => {
  try {
    const daysParam = parseInt(String(req.query.days ?? '30'), 10)
    const days = Number.isNaN(daysParam) ? 30 : Math.max(1, Math.min(daysParam, 365))

    const players = scoreDAO.getAllPlayers()

    const activeByDay = new Map<string, Set<string>>()
    const playtimeByDay = new Map<string, number>()

    const now = new Date()
    const startTime = now.getTime() - days * 24 * 60 * 60 * 1000

    for (const p of players) {
      const userId = p.userId
      const history = Array.isArray(p.gameHistory) ? p.gameHistory : []
      for (const game of history) {
        const ts = (game as any).timestamp ? new Date((game as any).timestamp) : null
        if (!ts || Number.isNaN(ts.getTime())) continue
        if (ts.getTime() < startTime) continue

        const dateKey = ts.toISOString().split('T')[0]

        let activeSet = activeByDay.get(dateKey)
        if (!activeSet) {
          activeSet = new Set<string>()
          activeByDay.set(dateKey, activeSet)
        }
        activeSet.add(userId)

        const duration = typeof (game as any).duration === 'number' ? (game as any).duration : 0
        playtimeByDay.set(dateKey, (playtimeByDay.get(dateKey) || 0) + duration)
      }
    }

    const points: { date: string; activeUsers: number; totalPlayTimeSeconds: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = d.toISOString().split('T')[0]
      const activeSet = activeByDay.get(dateKey)
      const activeUsers = activeSet ? activeSet.size : 0
      const totalPlayTimeSeconds = Math.floor(playtimeByDay.get(dateKey) || 0)

      points.push({ date: dateKey, activeUsers, totalPlayTimeSeconds })
    }

    res.json({ success: true, points })
  } catch (error: any) {
    console.error('获取使用趋势失败:', error)
    res.status(500).json({
      success: false,
      message: error?.message || '获取使用趋势失败',
    })
  }
})

export default router
