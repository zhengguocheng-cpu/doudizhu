import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface PlayerHandProps {
  cards: string[]
  selectedCards: string[]
  onCardSelect: (card: string) => void
  isMyTurn: boolean
}

class PlayerHand extends Component<PlayerHandProps> {
  getCardColor = (card: string) => {
    // 判断牌的颜色（红桃、方块为红色，黑桃、梅花为黑色）
    const suit = card.charAt(0)
    return ['♥', '♦'].includes(suit) ? 'red' : 'black'
  }

  getCardDisplay = (card: string) => {
    // 将牌面转换为显示格式
    const suit = card.charAt(0)
    const rank = card.slice(1)
    
    const suitMap: { [key: string]: string } = {
      '♠': '♠',
      '♥': '♥', 
      '♦': '♦',
      '♣': '♣'
    }
    
    return {
      suit: suitMap[suit] || suit,
      rank: rank
    }
  }

  render() {
    const { cards, selectedCards, onCardSelect, isMyTurn } = this.props

    if (!isMyTurn) {
      return (
        <View className='player-hand-container'>
          <View className='waiting-turn'>
            <Text className='waiting-text'>等待其他玩家出牌...</Text>
          </View>
        </View>
      )
    }

    return (
      <View className='player-hand-container'>
        <View className='hand-header'>
          <Text className='hand-title'>我的手牌 ({cards.length}张)</Text>
          <Text className='turn-indicator'>轮到我出牌</Text>
        </View>
        
        <View className='cards-container'>
          {cards.map((card, index) => {
            const isSelected = selectedCards.includes(card)
            const color = this.getCardColor(card)
            const display = this.getCardDisplay(card)
            
            return (
              <View
                key={`${card}-${index}`}
                className={`playing-card ${color} ${isSelected ? 'selected' : ''}`}
                onClick={() => onCardSelect(card)}
              >
                <View className='card-content'>
                  <View className='card-top'>
                    <Text className='card-rank'>{display.rank}</Text>
                    <Text className='card-suit'>{display.suit}</Text>
                  </View>
                  <View className='card-center'>
                    <Text className='card-suit-large'>{display.suit}</Text>
                  </View>
                  <View className='card-bottom'>
                    <Text className='card-suit'>{display.suit}</Text>
                    <Text className='card-rank'>{display.rank}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
        
        {selectedCards.length > 0 && (
          <View className='selection-info'>
            <Text className='selection-text'>
              已选择 {selectedCards.length} 张牌
            </Text>
          </View>
        )}
      </View>
    )
  }
}

export default PlayerHand

