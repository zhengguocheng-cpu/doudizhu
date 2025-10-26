import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface GameTableProps {
  room: {
    id: string
    name: string
    players: any[]
    gameStarted: boolean
    currentPlayer?: string
    bottomCards?: string[]
    playedCards?: string[]
  }
  gameStarted: boolean
  currentPlayer: string
}

class GameTable extends Component<GameTableProps> {
  getPlayerPosition = (playerIndex: number, totalPlayers: number) => {
    if (totalPlayers === 3) {
      const positions = ['top', 'left', 'right']
      return positions[playerIndex] || 'bottom'
    }
    return 'bottom'
  }

  renderPlayer = (player: any, index: number) => {
    const { gameStarted, currentPlayer } = this.props
    const position = this.getPlayerPosition(index, this.props.room.players.length)
    const isCurrentPlayer = currentPlayer === player.id
    const cardCount = player.cards ? player.cards.length : 0

    return (
      <View 
        key={player.id}
        className={`player-position ${position} ${isCurrentPlayer ? 'current' : ''}`}
      >
        <View className='player-info'>
          <Text className='player-avatar'>{player.avatar}</Text>
          <Text className='player-name'>{player.name}</Text>
          {gameStarted && (
            <Text className='player-cards'>{cardCount}张</Text>
          )}
        </View>
        
        {gameStarted && cardCount > 0 && (
          <View className='player-cards-display'>
            {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
              <View key={i} className='card-back' />
            ))}
            {cardCount > 5 && (
              <Text className='more-cards'>+{cardCount - 5}</Text>
            )}
          </View>
        )}
      </View>
    )
  }

  render() {
    const { room, gameStarted } = this.props
    const { players, bottomCards, playedCards } = room

    return (
      <View className='game-table-container'>
        {/* 游戏桌面 */}
        <View className='game-table'>
          {/* 玩家位置 */}
          {players.map((player, index) => 
            this.renderPlayer(player, index)
          )}

          {/* 桌面中央区域 */}
          <View className='table-center'>
            {/* 底牌 */}
            {bottomCards && bottomCards.length > 0 && (
              <View className='bottom-cards'>
                <Text className='bottom-cards-label'>底牌</Text>
                <View className='bottom-cards-display'>
                  {bottomCards.map((card, index) => (
                    <View key={index} className='bottom-card'>
                      {card}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 已出的牌 */}
            {playedCards && playedCards.length > 0 && (
              <View className='played-cards'>
                <Text className='played-cards-label'>已出</Text>
                <View className='played-cards-display'>
                  {playedCards.map((card, index) => (
                    <View key={index} className='played-card'>
                      {card}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 游戏状态提示 */}
            {!gameStarted && (
              <View className='game-status'>
                <Text className='status-text'>等待游戏开始...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }
}

export default GameTable
