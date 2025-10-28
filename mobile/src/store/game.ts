import { makeAutoObservable } from 'mobx'

export interface Player {
  id: string
  name: string
  avatar: string
  cards: string[]
  isReady: boolean
  isLandlord: boolean
  isCurrentTurn: boolean
  cardCount: number
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  gameStarted: boolean
  currentPlayer: string
  bottomCards: string[]
  playedCards: string[]
  winner?: string
}

export interface GameState {
  room: Room | null
  playerHand: string[]
  selectedCards: string[]
  gameStarted: boolean
  currentPlayer: string
  isMyTurn: boolean
  gamePhase: 'waiting' | 'grab_landlord' | 'playing' | 'finished'
  lastPlayedCards: string[]
  lastPlayer: string
}

class GameStore {
  gameState: GameState = {
    room: null,
    playerHand: [],
    selectedCards: [],
    gameStarted: false,
    currentPlayer: '',
    isMyTurn: false,
    gamePhase: 'waiting',
    lastPlayedCards: [],
    lastPlayer: ''
  }

  constructor() {
    makeAutoObservable(this)
  }

  // 设置房间信息
  setRoom(room: Room): void {
    this.gameState.room = room
    this.gameState.gameStarted = room.gameStarted
    this.gameState.currentPlayer = room.currentPlayer
  }

  // 更新房间状态
  updateRoom(updates: Partial<Room>): void {
    if (this.gameState.room) {
      this.gameState.room = { ...this.gameState.room, ...updates }
    }
  }

  // 设置玩家手牌
  setPlayerHand(cards: string[]): void {
    this.gameState.playerHand = cards
  }

  // 更新手牌（出牌后）
  updatePlayerHand(remainingCards: string[]): void {
    this.gameState.playerHand = remainingCards
  }

  // 设置选中的牌
  setSelectedCards(cards: string[]): void {
    this.gameState.selectedCards = cards
  }

  // 添加选中的牌
  addSelectedCard(card: string): void {
    if (!this.gameState.selectedCards.includes(card)) {
      this.gameState.selectedCards = [...this.gameState.selectedCards, card]
    }
  }

  // 移除选中的牌
  removeSelectedCard(card: string): void {
    this.gameState.selectedCards = this.gameState.selectedCards.filter(c => c !== card)
  }

  // 清空选中的牌
  clearSelectedCards(): void {
    this.gameState.selectedCards = []
  }

  // 设置游戏开始
  setGameStarted(started: boolean): void {
    this.gameState.gameStarted = started
    if (started) {
      this.gameState.gamePhase = 'grab_landlord'
    }
  }

  // 设置当前玩家
  setCurrentPlayer(playerId: string): void {
    this.gameState.currentPlayer = playerId
  }

  // 设置是否轮到我
  setIsMyTurn(isMyTurn: boolean): void {
    this.gameState.isMyTurn = isMyTurn
  }

  // 设置游戏阶段
  setGamePhase(phase: GameState['gamePhase']): void {
    this.gameState.gamePhase = phase
  }

  // 设置最后出的牌
  setLastPlayedCards(cards: string[], playerId: string): void {
    this.gameState.lastPlayedCards = cards
    this.gameState.lastPlayer = playerId
  }

  // 设置游戏结束
  setGameEnded(winner: string): void {
    this.gameState.gamePhase = 'finished'
    this.gameState.gameStarted = false
    if (this.gameState.room) {
      this.gameState.room.winner = winner
      this.gameState.room.status = 'finished'
    }
  }

  // 重置游戏状态
  resetGame(): void {
    this.gameState = {
      room: null,
      playerHand: [],
      selectedCards: [],
      gameStarted: false,
      currentPlayer: '',
      isMyTurn: false,
      gamePhase: 'waiting',
      lastPlayedCards: [],
      lastPlayer: ''
    }
  }

  // 获取房间玩家
  get roomPlayers(): Player[] {
    return this.gameState.room?.players || []
  }

  // 获取当前房间
  get currentRoom(): Room | null {
    return this.gameState.room
  }

  // 获取我的手牌
  get myHand(): string[] {
    return this.gameState.playerHand
  }

  // 获取选中的牌
  get selectedCards(): string[] {
    return this.gameState.selectedCards
  }

  // 检查是否轮到我
  get isMyTurn(): boolean {
    return this.gameState.isMyTurn
  }

  // 获取游戏状态
  get gameStatus(): string {
    if (!this.gameState.gameStarted) {
      return '等待开始'
    }
    
    switch (this.gameState.gamePhase) {
      case 'grab_landlord':
        return '抢地主阶段'
      case 'playing':
        return this.gameState.isMyTurn ? '轮到我出牌' : '等待其他玩家'
      case 'finished':
        return '游戏结束'
      default:
        return '等待中'
    }
  }

  // 获取房间状态描述
  get roomStatus(): string {
    if (!this.gameState.room) {
      return '未加入房间'
    }

    const { room } = this.gameState
    if (room.gameStarted) {
      return '游戏中'
    }
    
    if (room.players.length >= room.maxPlayers) {
      return '房间已满'
    }
    
    return `等待玩家 (${room.players.length}/${room.maxPlayers})`
  }
}

// 创建游戏状态管理实例
export const gameStore = new GameStore()


