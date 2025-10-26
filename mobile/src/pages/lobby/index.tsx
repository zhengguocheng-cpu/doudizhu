import { Component } from 'react'
import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import { navigateTo, showToast } from '@tarojs/taro'
import { observer, inject } from 'mobx-react'
import { userStore } from '../../store/user'
import { gameStore } from '../../store/game'
import { socketManager } from '../../utils/socket'
import RoomCard from '../../components/RoomCard'
import './index.scss'

interface LobbyState {
  rooms: any[]
  loading: boolean
  refreshing: boolean
}

@inject('userStore', 'gameStore')
@observer
class Lobby extends Component<any, LobbyState> {
  constructor(props: any) {
    super(props)
    this.state = {
      rooms: [],
      loading: true,
      refreshing: false
    }
  }

  componentDidMount() {
    this.initializeSocket()
    this.loadRooms()
  }

  componentWillUnmount() {
    socketManager.off('rooms_updated')
    socketManager.off('room_joined')
  }

  initializeSocket = () => {
    // 监听房间更新
    socketManager.on('rooms_updated', (data: any) => {
      this.setState({ rooms: data.rooms })
    })

    // 监听加入房间成功
    socketManager.on('room_joined', (data: any) => {
      navigateTo({
        url: `/pages/room/index?roomId=${data.roomId}`
      })
    })
  }

  loadRooms = async () => {
    try {
      this.setState({ loading: true })
      const rooms = await socketManager.request('get_rooms')
      this.setState({ rooms })
    } catch (error) {
      console.error('加载房间失败:', error)
      showToast({
        title: '加载房间失败',
        icon: 'none'
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  handleRefresh = async () => {
    this.setState({ refreshing: true })
    await this.loadRooms()
    this.setState({ refreshing: false })
  }

  handleCreateRoom = () => {
    navigateTo({
      url: '/pages/create-room/index'
    })
  }

  handleQuickJoin = async () => {
    try {
      await socketManager.request('quick_join', {
        userName: userStore.userName
      })
    } catch (error) {
      console.error('快速加入失败:', error)
      showToast({
        title: '快速加入失败',
        icon: 'none'
      })
    }
  }

  handleJoinRoom = async (roomId: string) => {
    try {
      await socketManager.request('join_room', {
        roomId,
        userName: userStore.userName
      })
    } catch (error) {
      console.error('加入房间失败:', error)
      showToast({
        title: '加入房间失败',
        icon: 'none'
      })
    }
  }

  render() {
    const { rooms, loading, refreshing } = this.state
    const { userName, avatar } = userStore

    return (
      <View className='lobby-container'>
        {/* 头部用户信息 */}
        <View className='lobby-header'>
          <View className='user-info'>
            <Text className='avatar'>{avatar}</Text>
            <View className='user-details'>
              <Text className='user-name'>{userName}</Text>
              <Text className='user-status'>在线</Text>
            </View>
          </View>
          <Button 
            className='btn btn-secondary btn-small'
            onClick={this.handleRefresh}
          >
            刷新
          </Button>
        </View>

        {/* 快速操作 */}
        <View className='quick-actions'>
          <Button 
            className='btn btn-primary btn-large'
            onClick={this.handleQuickJoin}
          >
            🚀 快速开始
          </Button>
          <Button 
            className='btn btn-secondary btn-large'
            onClick={this.handleCreateRoom}
          >
            ➕ 创建房间
          </Button>
        </View>

        {/* 房间列表 */}
        <View className='rooms-section'>
          <View className='section-header'>
            <Text className='section-title'>游戏房间</Text>
            <Text className='room-count'>{rooms.length}个房间</Text>
          </View>

          {loading ? (
            <View className='loading-container'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          ) : (
            <ScrollView 
              className='rooms-list'
              scrollY
              refresherEnabled
              refresherTriggered={refreshing}
              onRefresherRefresh={this.handleRefresh}
            >
              {rooms.length === 0 ? (
                <View className='empty-state'>
                  <Text className='empty-icon'>🏠</Text>
                  <Text className='empty-text'>暂无房间</Text>
                  <Text className='empty-tip'>点击"创建房间"开始游戏</Text>
                </View>
              ) : (
                rooms.map((room: any) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={() => this.handleJoinRoom(room.id)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    )
  }
}

export default Lobby
