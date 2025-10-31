import { Component } from 'react'
import { View, Text, Button } from '@tarojs/components'
import './index.scss'

interface RoomCardProps {
  room: {
    id: string
    name: string
    players: any[]
    maxPlayers: number
    status: string
    gameStarted: boolean
  }
  onJoin: () => void
}

class RoomCard extends Component<RoomCardProps> {
  getStatusText = () => {
    const { room } = this.props
    if (room.gameStarted) {
      return '游戏中'
    }
    if (room.players.length >= room.maxPlayers) {
      return '已满员'
    }
    return '等待中'
  }

  getStatusColor = () => {
    const { room } = this.props
    if (room.gameStarted) {
      return '#ff9800'
    }
    if (room.players.length >= room.maxPlayers) {
      return '#f44336'
    }
    return '#4caf50'
  }

  canJoin = () => {
    const { room } = this.props
    return !room.gameStarted && room.players.length < room.maxPlayers
  }

  render() {
    const { room, onJoin } = this.props
    const statusText = this.getStatusText()
    const statusColor = this.getStatusColor()
    const canJoin = this.canJoin()

    return (
      <View className='room-card'>
        <View className='room-header'>
          <Text className='room-name'>{room.name}</Text>
          <View 
            className='room-status'
            style={{ backgroundColor: statusColor }}
          >
            {statusText}
          </View>
        </View>

        <View className='room-info'>
          <View className='player-count'>
            <Text className='label'>玩家:</Text>
            <Text className='value'>
              {room.players.length}/{room.maxPlayers}
            </Text>
          </View>
          
          <View className='room-players'>
            {room.players.map((player, index) => (
              <View key={index} className='player-item'>
                <Text className='player-avatar'>{player.avatar}</Text>
                <Text className='player-name'>{player.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className='room-actions'>
          {canJoin ? (
            <Button 
              className='btn btn-primary btn-block'
              onClick={onJoin}
            >
              加入房间
            </Button>
          ) : (
            <Button 
              className='btn btn-secondary btn-block'
              disabled
            >
              {room.gameStarted ? '游戏进行中' : '房间已满'}
            </Button>
          )}
        </View>
      </View>
    )
  }
}

export default RoomCard



