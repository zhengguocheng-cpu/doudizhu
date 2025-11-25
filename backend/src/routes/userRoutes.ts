import { Router, Request, Response } from 'express'
import { scoreService } from '../services/score/ScoreService'
import { getUserManager } from '../services/user/userManager'

const router = Router()

router.put('/profile', (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    const userId = typeof body.userId === 'string' ? body.userId : ''
    const rawUsername = typeof body.username === 'string' ? body.username : undefined
    const avatar = typeof body.avatar === 'string' ? body.avatar : undefined

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId',
      })
    }

    const payload: { username?: string; avatar?: string } = {}
    if (rawUsername) {
      const trimmed = rawUsername.trim()
      if (trimmed) {
        payload.username = trimmed
      }
    }
    if (avatar !== undefined) {
      payload.avatar = avatar
    }

    if (!payload.username && payload.avatar === undefined) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段',
      })
    }

    const record = scoreService.updatePlayerProfile(userId, payload)

    try {
      const userManager = getUserManager()
      const user = userManager.getUserById(userId)
      if (user) {
        if (payload.username) {
          user.name = payload.username
        }
        if (payload.avatar !== undefined) {
          ;(user as any).avatar = payload.avatar
        }
      }
    } catch (e) {
      console.warn('更新内存用户资料失败（可忽略）:', e)
    }

    return res.json({
      success: true,
      data: {
        userId: record.userId,
        username: record.username,
        avatar: record.avatar,
      },
    })
  } catch (error: any) {
    console.error('更新玩家资料失败:', error)
    return res.status(500).json({
      success: false,
      message: error?.message || '更新玩家资料失败',
    })
  }
})

export default router
