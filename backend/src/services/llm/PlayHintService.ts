import { roomService } from '../room/roomService'
import { CardTypeDetector, CardPattern, CardType } from '../game/CardTypeDetector'
import { CardPlayValidator } from '../game/CardPlayValidator'
import { ChatMessage, LLMClientFactory, UserLlmConfig } from './LLMClient'

interface CandidateMove {
  id: string
  cards: string[]
  moveType: 'lead' | 'follow' | 'pass'
  pattern: string
  remainCountAfter: number
}

interface HintHistoryEntry {
  timestamp: string
  roomId: string
  playerId: string
  playerName: string
  role: 'landlord' | 'farmer'
  isNewRound: boolean
  isFollowPlay: boolean
  hand: string[]
  lastPlaySummary: string
  systemPrompt: string
  userContext: string[]
  rawResponse: string
  bestMoveId?: string
  reason?: string
  analysis?: string
  winRate?: number
  error?: string
}

export interface PlayHintResult {
  success: boolean
  cards?: string[]
  reason?: string
  analysis?: string
  winRate?: number
  error?: string
}

class PlayHintService {
  public async getPlayHint(
    roomId: string,
    userId: string,
    options?: { 
      model?: string
      customPrompt?: string
      /** 用户自定义 LLM 配置 */
      llmConfig?: UserLlmConfig 
    },
  ): Promise<PlayHintResult> {
    try {
      const room = roomService.getRoom(roomId) as any
      if (!room || !room.gameState) {
        return { success: false, error: '游戏未开始或房间不存在' }
      }

      const player = room.players?.find((p: any) => p.id === userId)
      if (!player) {
        return { success: false, error: '玩家不在房间中' }
      }

      if (room.gameState.currentPlayerId !== userId) {
        return { success: false, error: '还没轮到你出牌' }
      }

      const hand: string[] = Array.isArray(player.cards) ? [...player.cards] : []
      if (hand.length === 0) {
        return { success: false, error: '当前没有手牌' }
      }

      const gameState = room.gameState
      const lastPattern: CardPattern | null = gameState.lastPattern || null
      const lastPlay = gameState.lastPlay || null
      const isNewRound = gameState.isNewRound || !lastPattern
      const isFollowPlay = !isNewRound && !!lastPlay && Array.isArray(lastPlay.cards) && lastPlay.cards.length > 0

      const landlordId: string | null = gameState.landlordId || null
      const landlordPlayer = landlordId
        ? room.players.find((p: any) => p.id === landlordId)
        : null

      // 优先使用当前手牌长度来估算剩余牌数，避免 cardCount 未及时更新导致出现 0,0
      const getRemainCount = (p: any): number => {
        if (Array.isArray(p?.cards) && p.cards.length > 0) return p.cards.length
        const cnt = p?.cardCount ?? 0
        return typeof cnt === 'number' && cnt > 0 ? cnt : 0
      }

      const landlordRemain = landlordPlayer ? getRemainCount(landlordPlayer) : 0
      const others = room.players.filter((p: any) => p.id !== landlordId)
      const farmerRemain = others.map((p: any) => getRemainCount(p))

      const playHistory: any[] = Array.isArray(gameState.playHistory)
        ? gameState.playHistory
        : []
      const bottomCards: string[] = Array.isArray(gameState.bottomCards)
        ? gameState.bottomCards
        : Array.isArray((room as any).bottomCards)
          ? (room as any).bottomCards
          : []

      const role: 'landlord' | 'farmer' = player.role === 'landlord' ? 'landlord' : 'farmer'

      // 将大模型视作真实玩家：只要求它根据历史和当前手牌选择一手要出的牌或 PASS
      let systemContent =
          '你现在扮演三人斗地主中的一名真人玩家，只能看到公开信息（出牌记录、各家剩余牌数）和你自己的手牌。' +
          '\n你的任务是在当前轮到你出牌时，根据历史和手牌决定这一回合应该出什么牌，或者是否选择不出(PASS)。' +
          '\n在思考出牌时，你需要综合考虑：如何尽快获胜、是否需要暂时牺牲一些大牌来抢占出牌权、以及（当你是农民时）如何配合队友共同围堵地主，从整体上给出当前局面下的最优出牌策略。' +
          '\n特别是当你在首家/新一轮主动出牌时，如果你的手牌中已经形成完整的顺子、连对、飞机、三张/三带一/三带二等成型强牌型，在没有非常明确的战略理由（例如为了秒杀对手的关键牌型）时，应尽量整体打出这些完整牌型，避免无谓地拆散成单张或零散对子。' +
          '\n另外，当你首家/新一轮出牌且自己手牌还很多、距离出完还有多轮时，一般不建议用最大点数的三张（例如 AAA、222、KKK）去做三带一或三带二来起手；除非现在打一把就能直接获得极大胜势或基本锁定胜局，否则应优先使用较小的三张或其它组合先行走牌，把这些最大三张保留为后续收尾或关键控制局面的重要资源。' +
          '\n\n必须严格遵守以下出牌规则：' +
          '\n1. 所有出牌都必须完全从“当前玩家手牌”中选择，不能构造手牌里没有的牌。' +
          '\n2. 出的牌必须构成一种合法斗地主牌型，不能是无效组合。常见合法牌型及示例：' +
          '\n   - 单张：任意一张牌，例如 ♠7。' +
          '\n   - 对子：两张点数相同的牌，例如 ♠7♥7。' +
          '\n   - 三张：三张点数相同的牌，例如 ♠7♥7♦7。' +
          '\n   - 三带一：三张相同点数 + 任意一张单牌，例如 7778。' +
          '\n   - 三带二：三张相同点数 + 一对牌，例如 77788；像 33356 不符合“三带二”，属于【非法组合】，禁止出。' +
          '\n   - 顺子：至少5张点数连续的单牌（不能包含2和大小王），例如 7,8,9,10,J 或 8,9,10,J,Q。' +
          '\n           所有牌的点数必须按 +1 连续，不能跳点。比如手牌为 7,8,9,10,J,K 时：7,8,9,10,J 是合法顺子，' +
          '\n           但 8,9,10,J,K 因为缺少 Q 不连续，属于【非法组合】，禁止出。' +
          '\n   - 连对：至少3组点数连续的对子（不能包含2和大小王），例如 33,44,55 或 77,88,99,10 10,J J。' +
          '\n   - 飞机：至少两组三张点数连续的“飞机”，例如 333444 或 555666777。' +
          '\n   - 飞机带翅膀：在飞机的基础上，额外带同数量的单牌或同数量的对子，例如 333444+56 或 333444+55+66。' +
          '\n   - 四带二：四张相同点数 + 两张单牌（散牌）或两对，例如 7777+8+9 或 7777+88+99。' +
          '\n   - 炸弹：四张相同点数的牌，例如 7777。' +
          '\n   - 王炸：一张小王 + 一张大王。' +
          '\n3. 如果当前轮次是首家/新一轮（没有上家牌约束），你可以出任意一种合法牌型。' +
          '\n4. 如果当前轮次是跟牌，你出的牌型必须与上家牌型相同、张数相同并且点数更大，或者选择 PASS（前提是规则允许不出）。'

      const customPrompt = (options?.customPrompt || '').trim()
      if (customPrompt) {
        // 限制长度，避免过长自定义文本撑爆 prompt
        const trimmed = customPrompt.slice(0, 500)
        systemContent +=
          '\n\n===== 额外出牌风格偏好提示（来自玩家设置，可酌情参考） =====\n' +
          trimmed
      }

      systemContent +=
          '\n\n输出要求：' +
          '\n- 只输出严格的 JSON，不能有任何多余文字。' +
          '\n- JSON 结构必须是：' +
          '\n{' +
          '\n  "cards": ["♠3","♥3"],   // 本回合准备出的具体牌；如果选择 PASS，则为 []' +
          '\n  "moveType": "play"        // "play" 表示出牌，"pass" 表示不出' +
          '\n}'

      const systemPrompt: ChatMessage = {
        role: 'system',
        content: systemContent,
      }

      const userContextLines: string[] = []
      userContextLines.push(`当前玩家ID: ${userId}`)
      userContextLines.push(`当前玩家身份: ${role}`)
      userContextLines.push(`底牌: ${JSON.stringify(bottomCards)}`)
      userContextLines.push(`地主剩余牌数: ${landlordRemain}`)
      userContextLines.push(`其他玩家剩余牌数: ${farmerRemain.join(',') || '未知'}`)

      const lastInfo = isFollowPlay && lastPlay
        ? `出牌玩家ID: ${lastPlay.playerId}; 牌: ${JSON.stringify(lastPlay.cards || [])}`
        : '无（首家或新一轮）'

      userContextLines.push(`当前轮次: ${isNewRound ? 'lead' : 'follow'}`)
      userContextLines.push(`最近一手牌: ${lastInfo}`)
      userContextLines.push(`当前玩家完整手牌: ${JSON.stringify(hand)}`)

      // 将完整出牌历史（含 PASS）压缩成简要文本，方便大模型做记牌和推断
      // 同时构造一份用于 hintHistory.lastPlaySummary 的多行字符串，形如：
      // 1. 玩家A(地主) 出 顺子: ...\n2. 玩家B(农民) 选择不出(PASS)
      let historySummaryForHint = ''
      if (playHistory.length > 0) {
        const recent = playHistory.slice(-30) // 只保留最近 30 手，防止 prompt 过长
        const historyLines = recent.map((h: any, idx: number) => {
          const roleLabel = h.playerId === landlordId ? '地主' : '农民'
          const base = `${idx + 1}. ${h.playerName || h.playerId}(${roleLabel})`
          if (Array.isArray(h.cards) && h.cards.length > 0) {
            const typeDesc = h.cardType?.description || h.cardType?.type || '出牌'
            return `${base} 出 ${typeDesc}: ${h.cards.join(' ')}`
          }
          return `${base} 选择不出(PASS)`
        })

        userContextLines.push('最近出牌/不出历史(从早到晚，最多30手):')
        historyLines.forEach((line) => userContextLines.push(line))

        historySummaryForHint = historyLines.join('\n')
      } else {
        const noHistoryText = '最近出牌/不出历史: 暂无（刚开始或记录为空）'
        userContextLines.push(noHistoryText)
        historySummaryForHint = noHistoryText
      }

      const userPrompt: ChatMessage = {
        role: 'user',
        content:
          '下面是三人斗地主当前局面的完整信息，请你作为当前玩家，决定这一回合要出的具体牌。' +
          '\n\n=== 当前局面 ===' +
          '\n' + userContextLines.join('\n') +
          '\n\n请根据上面的信息，选择这一回合要出的牌或不出(PASS)，并按照系统提示中规定的 JSON 格式输出结果。',
      }

      // 根据用户配置获取 LLM 客户端
      const llmClient = LLMClientFactory.getClientWithUserConfig(options?.llmConfig)
      const raw = await llmClient.chat([systemPrompt, userPrompt], {
        temperature: 0.3,
        maxTokens: 800,
        model: options?.model,
      })

      let suggestedCards: string[] | undefined
      let moveType: string | undefined

      try {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.cards)) {
          suggestedCards = parsed.cards.map((c: any) => String(c))
        }
        if (parsed && typeof parsed.moveType === 'string') {
          moveType = parsed.moveType
        }
      } catch (e) {
        // 有些模型可能在外层包一层文本，尝试从中提取 JSON
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            const parsed = JSON.parse(match[0])
            if (parsed && Array.isArray(parsed.cards)) {
              suggestedCards = parsed.cards.map((c: any) => String(c))
            }
            if (parsed && typeof parsed.moveType === 'string') {
              moveType = parsed.moveType
            }
          } catch {
            // 忽略，走降级逻辑
          }
        }
      }

      // 如果模型没有返回有效的出牌建议，交给前端本地提示兜底
      if (!suggestedCards || !Array.isArray(suggestedCards)) {
        return { success: false, error: '大模型未返回有效的出牌结果' }
      }

      // 使用游戏内出牌校验器检查大模型给出的出牌是否符合当前轮次规则
      const fullHand: string[] = Array.isArray(player.cards) ? [...player.cards] : []
      const validation = CardPlayValidator.validate(
        fullHand,
        suggestedCards,
        gameState.lastPattern,
        gameState.isNewRound || !gameState.lastPattern,
      )
      const validationError = validation.valid
        ? undefined
        : validation.error || '大模型返回了非法出牌组合'

      // 记录本次提示的完整信息到 hintHistory，便于对局结束后回顾
      this.appendHintHistory(room, {
        timestamp: new Date().toISOString(),
        roomId,
        playerId: userId,
        playerName: player.name,
        role,
        isNewRound,
        isFollowPlay,
        hand,
        lastPlaySummary: historySummaryForHint || lastInfo,
        systemPrompt: systemPrompt.content,
        userContext: userContextLines,
        rawResponse: raw,
        error: validationError,
      })

      // 如果大模型返回的出牌在当前规则下不合法，则交给前端/机器人本地逻辑兜底
      if (!validation.valid) {
        return { success: false, error: validationError }
      }

      return {
        success: true,
        cards: suggestedCards,
      }
    } catch (error) {
      console.error('PlayHintService.getPlayHint 错误:', error)
      const msg = error instanceof Error ? error.message : '获取出牌提示失败'
      return { success: false, error: msg }
    }
  }

  // 将本次提示请求和 DeepSeek 返回结果记录到当前局的 hintHistory 中
  private appendHintHistory(room: any, entry: HintHistoryEntry): void {
    try {
      if (!room || !room.gameState) return
      if (!Array.isArray(room.gameState.hintHistory)) {
        room.gameState.hintHistory = []
      }
      room.gameState.hintHistory.push(entry)
    } catch (e) {
      console.warn('记录提示历史 hintHistory 失败:', e)
    }
  }

  private buildCandidates(room: any, player: any, isFollowPlay: boolean): CandidateMove[] {
    const gameState = room.gameState
    const hand: string[] = Array.isArray(player.cards) ? [...player.cards] : []
    const sortedHand = [...hand].sort((a, b) => CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b))

    const candidates: CandidateMove[] = []

    const lastPattern: CardPattern | null = gameState.lastPattern || null
    const isNewRound = gameState.isNewRound || !lastPattern

    // 跟牌时允许不出
    if (!isNewRound) {
      candidates.push({
        id: 'PASS',
        cards: [],
        moveType: 'pass',
        pattern: 'pass',
        remainCountAfter: hand.length,
      })
    }

    // 辅助函数：添加候选并限制数量
    const pushWithLimit = (move: CandidateMove, limit: number) => {
      const sameType = candidates.filter((c) => c.pattern === move.pattern && c.moveType === move.moveType)
      if (sameType.length >= limit) return
      candidates.push(move)
    }

    if (isNewRound || !lastPattern) {
      // 首家/新一轮：给一些常见起手方案
      if (sortedHand.length > 0) {
        // 最小单张
        pushWithLimit(
          {
            id: 'LEAD_SINGLE_MIN',
            cards: [sortedHand[0]],
            moveType: 'lead',
            pattern: 'single',
            remainCountAfter: hand.length - 1,
          },
          1,
        )

        // 最大单张
        const last = sortedHand[sortedHand.length - 1]
        if (last !== sortedHand[0]) {
          pushWithLimit(
            {
              id: 'LEAD_SINGLE_MAX',
              cards: [last],
              moveType: 'lead',
              pattern: 'single',
              remainCountAfter: hand.length - 1,
            },
            1,
          )
        }
      }

      // 简单地找几手最小的对子
      const pairCandidates = this.findAllPairs(sortedHand).slice(0, 3)
      pairCandidates.forEach((pair, idx) => {
        pushWithLimit(
          {
            id: `LEAD_PAIR_${idx + 1}`,
            cards: pair,
            moveType: 'lead',
            pattern: 'pair',
            remainCountAfter: hand.length - pair.length,
          },
          3,
        )
      })
    } else if (lastPattern) {
      // 跟牌场景：只考虑与上家牌型兼容的简单情况
      switch (lastPattern.type) {
        case CardType.SINGLE: {
          const minValue = lastPattern.value
          const allSinglesAbove = sortedHand.filter((c) => CardTypeDetector.getCardValue(c) > minValue)
          allSinglesAbove.slice(0, 6).forEach((c, idx) => {
            pushWithLimit(
              {
                id: `FOLLOW_SINGLE_${idx + 1}`,
                cards: [c],
                moveType: 'follow',
                pattern: 'single',
                remainCountAfter: hand.length - 1,
              },
              6,
            )
          })
          break
        }
        case CardType.PAIR: {
          const minValue = lastPattern.value
          const allPairsAbove = this.findAllPairs(sortedHand).filter((pair) => {
            return CardTypeDetector.getCardValue(pair[0]) > minValue
          })

          allPairsAbove.slice(0, 4).forEach((pair, idx) => {
            pushWithLimit(
              {
                id: `FOLLOW_PAIR_${idx + 1}`,
                cards: pair,
                moveType: 'follow',
                pattern: 'pair',
                remainCountAfter: hand.length - pair.length,
              },
              4,
            )
          })

          break
        }
        default: {
          // 复杂牌型暂时仅提供 PASS 及一两手小单张作为候选，避免大模型乱出
          if (sortedHand.length > 0) {
            pushWithLimit(
              {
                id: 'FOLLOW_SAFE_SINGLE_MIN',
                cards: [sortedHand[0]],
                moveType: 'follow',
                pattern: 'single',
                remainCountAfter: hand.length - 1,
              },
              1,
            )
          }
          break
        }
      }
    }

    return candidates
  }

  private findAllPairs(cards: string[]): string[][] {
    const groups: Record<string, string[]> = {}
    cards.forEach((c) => {
      const rank = c.replace(/[♠♥♣♦🃏]/g, '')
      if (!groups[rank]) groups[rank] = []
      groups[rank].push(c)
    })

    const result: string[][] = []
    Object.values(groups).forEach((arr) => {
      if (arr.length >= 2) {
        const sorted = [...arr].sort((a, b) => CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b))
        result.push(sorted.slice(0, 2))
      }
    })

    result.sort((a, b) => CardTypeDetector.getCardValue(a[0]) - CardTypeDetector.getCardValue(b[0]))
    return result
  }
}

export const playHintService = new PlayHintService()
