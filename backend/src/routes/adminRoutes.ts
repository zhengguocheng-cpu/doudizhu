import express from 'express'
import fs from 'fs'
import path from 'path'
import { config } from '../config'

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

export default router
