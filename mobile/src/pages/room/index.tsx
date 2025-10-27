import { Component } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import { navigateBack, showToast } from '@tarojs/taro'
import { observer, inject } from 'mobx-react'
import { userStore } from '../../store/user'
import { gameStore } from '../../store/game'
import { socketManager } from '../../utils/socket'
import GameTable from '../../components/GameTable'
import PlayerHand from '../../components/PlayerHand'
import ChatPanel from '../../components/ChatPanel'
import './index.scss'

interface RoomState {
  room: any
  gameStarted: boolean
  currentPlayer: string
  isMyTurn: boolean
  selectedCards: string[]
  loading: boolean
}

@inject('userStore', 'gameStore')
@observer
class Room extends Component<any, RoomState> {
  constructor(props: any) {
    super(props)
    this.state = {
      room: null,
      gameStarted: false,
      currentPlayer: '',
      isMyTurn: false,
      selectedCards: [],
      loading: true
    }
  }

  componentDidMount() {
    this.initializeSocket()
    this.loadRoomData()
  }

  componentWillUnmount() {
    socketManager.off('room_joined')
    socketManager.off('player_joined')
    socketManager.off('player_left')
    socketManager.off('game_started')
    socketManager.off('cards_dealt')
    socketManager.off('game_state_updated')
    socketManager.off('game_ended')
  }

  initializeSocket = () => {
    // 监听房间状态更新
    socketManager.on('room_joined', (data: any) => {
      this.setState({ room: data.room })
    })

    socketManager.on('player_joined', (data: any) => {
      this.updateRoomState(data.room)
    })

    socketManager.on('player_left', (data: any) => {
      this.updateRoomState(data.room)
    })

    // 监听游戏事件
    socketManager.on('game_started', (data: any) => {
      this.setState({ gameStarted: true })
      showToast({
        title: '游戏开始！',
        icon: 'success'
      })
    })

    socketManager.on('cards_dealt', (data: any) => {
      gameStore.setPlayerHand(data.cards)
    })

    socketManager.on('game_state_updated', (data: any) => {
      this.setState({
        currentPlayer: data.currentPlayer,
        isMyTurn: data.currentPlayer === userStore.userId
      })
    })

    socketManager.on('game_ended', (data: any) => {
      showToast({
        title: `游戏结束！${data.winner}获胜`,
        icon: 'success'
      })
    })
  }

  loadRoomData = async () => {
    try {
      // 从URL参数获取房间ID
      const roomId = this.getRoomIdFromUrl()
      if (!roomId) {
        navigateBack()
        return
      }

      const room = await socketManager.request('get_room', { roomId })
      this.setState({ room })
    } catch (error) {
      console.error('加载房间数据失败:', error)
      showToast({
        title: '加载房间失败',
        icon: 'none'
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  getRoomIdFromUrl = () => {
    // 在实际应用中，这里应该从页面参数获取
    return 'room-1' // 临时硬编码
  }

  updateRoomState = (room: any) => {
    this.setState({ room })
  }

  handleLeaveRoom = async () => {
    try {
      await socketManager.request('leave_room', {
        roomId: this.state.room?.id
      })
      navigateBack()
    } catch (error) {
      console.error('离开房间失败:', error)
    }
  }

  handleStartGame = async () => {
    try {
      await socketManager.request('start_game', {
        roomId: this.state.room?.id
      })
    } catch (error) {
      console.error('开始游戏失败:', error)
      showToast({
        title: '开始游戏失败',
        icon: 'none'
      })
    }
  }

  handlePlayCards = async () => {
    const { selectedCards } = this.state
    if (selectedCards.length === 0) {
      showToast({
        title: '请选择要出的牌',
        icon: 'none'
      })
      return
    }

    try {
      await socketManager.request('play_cards', {
        roomId: this.state.room?.id,
        cards: selectedCards
      })
      this.setState({ selectedCards: [] })
    } catch (error) {
      console.error('出牌失败:', error)
      showToast({
        title: '出牌失败',
        icon: 'none'
      })
    }
  }

  handlePassTurn = async () => {
    try {
      await socketManager.request('pass_turn', {
        roomId: this.state.room?.id
      })
    } catch (error) {
      console.error('不出失败:', error)
    }
  }

  handleCardSelect = (card: string) => {
    const { selectedCards } = this.state
    const newSelectedCards = selectedCards.includes(card)
      ? selectedCards.filter(c => c !== card)
      : [...selectedCards, card]
    
    this.setState({ selectedCards: newSelectedCards })
  }

  render() {
    const { room, gameStarted, isMyTurn, selectedCards, loading } = this.state
    const { playerHand } = gameStore

    if (loading) {
      return (
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      )
    }

    if (!room) {
      return (
        <View className='error-container'>
          <Text className='error-text'>房间不存在</Text>
          <Button className='btn btn-primary' onClick={this.handleLeaveRoom}>
            返回大厅
          </Button>
        </View>
      )
    }

    return (
      <View className='room-container'>
        {/* 游戏桌面 */}
        <GameTable 
          room={room}
          gameStarted={gameStarted}
          currentPlayer={this.state.currentPlayer}
        />

        {/* 玩家手牌 */}
        {gameStarted && (
          <PlayerHand
            cards={playerHand}
            selectedCards={selectedCards}
            onCardSelect={this.handleCardSelect}
            isMyTurn={isMyTurn}
          />
        )}

        {/* 游戏控制 */}
        <View className='game-controls'>
          {!gameStarted ? (
            <View className='pre-game-controls'>
              <Text className='status-text'>
                等待玩家加入... ({room.players.length}/3)
              </Text>
              {room.players.length >= 2 && (
                <Button 
                  className='btn btn-primary btn-large'
                  onClick={this.handleStartGame}
                >
                  开始游戏
                </Button>
              )}
            </View>
          ) : (
            isMyTurn && (
              <View className='in-game-controls'>
                <Button 
                  className='btn btn-success'
                  onClick={this.handlePlayCards}
                  disabled={selectedCards.length === 0}
                >
                  出牌 ({selectedCards.length})
                </Button>
                <Button 
                  className='btn btn-secondary'
                  onClick={this.handlePassTurn}
                >
                  不出
                </Button>
              </View>
            )
          )}
        </View>

        {/* 聊天面板 */}
        <ChatPanel roomId={room.id} />

        {/* 房间信息 */}
        <View className='room-info'>
          <Text className='room-name'>{room.name}</Text>
          <Button 
            className='btn btn-danger btn-small'
            onClick={this.handleLeaveRoom}
          >
            离开房间
          </Button>
        </View>
      </View>
    )
  }
}

export default Room

