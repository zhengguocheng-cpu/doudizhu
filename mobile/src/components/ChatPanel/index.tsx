import { Component } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import { socketManager } from '../../utils/socket'
import './index.scss'

interface ChatMessage {
  id: string
  playerName: string
  message: string
  timestamp: number
  type: 'message' | 'system'
}

interface ChatPanelProps {
  roomId: string
}

interface ChatPanelState {
  messages: ChatMessage[]
  inputValue: string
  showChat: boolean
}

class ChatPanel extends Component<ChatPanelProps, ChatPanelState> {
  constructor(props: ChatPanelProps) {
    super(props)
    this.state = {
      messages: [],
      inputValue: '',
      showChat: false
    }
  }

  componentDidMount() {
    this.setupSocketListeners()
  }

  componentWillUnmount() {
    socketManager.off('message_received')
    socketManager.off('player_joined')
    socketManager.off('player_left')
    socketManager.off('game_started')
    socketManager.off('game_ended')
  }

  setupSocketListeners = () => {
    // 监听聊天消息
    socketManager.on('message_received', (data: any) => {
      this.addMessage({
        id: Date.now().toString(),
        playerName: data.playerName,
        message: data.message,
        timestamp: Date.now(),
        type: 'message'
      })
    })

    // 监听系统消息
    socketManager.on('player_joined', (data: any) => {
      this.addMessage({
        id: Date.now().toString(),
        playerName: '系统',
        message: `${data.playerName} 加入了房间`,
        timestamp: Date.now(),
        type: 'system'
      })
    })

    socketManager.on('player_left', (data: any) => {
      this.addMessage({
        id: Date.now().toString(),
        playerName: '系统',
        message: `${data.playerName} 离开了房间`,
        timestamp: Date.now(),
        type: 'system'
      })
    })

    socketManager.on('game_started', () => {
      this.addMessage({
        id: Date.now().toString(),
        playerName: '系统',
        message: '游戏开始！',
        timestamp: Date.now(),
        type: 'system'
      })
    })

    socketManager.on('game_ended', (data: any) => {
      this.addMessage({
        id: Date.now().toString(),
        playerName: '系统',
        message: `游戏结束！${data.winner} 获胜！`,
        timestamp: Date.now(),
        type: 'system'
      })
    })
  }

  addMessage = (message: ChatMessage) => {
    this.setState(prevState => ({
      messages: [...prevState.messages, message]
    }))
  }

  handleInputChange = (e: any) => {
    this.setState({ inputValue: e.detail.value })
  }

  handleSendMessage = async () => {
    const { inputValue } = this.state
    const { roomId } = this.props

    if (!inputValue.trim()) {
      return
    }

    try {
      await socketManager.request('send_message', {
        roomId,
        message: inputValue.trim()
      })
      this.setState({ inputValue: '' })
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  handleToggleChat = () => {
    this.setState(prevState => ({
      showChat: !prevState.showChat
    }))
  }

  formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  render() {
    const { messages, inputValue, showChat } = this.state

    return (
      <View className={`chat-panel ${showChat ? 'show' : ''}`}>
        {/* 聊天按钮 */}
        <Button 
          className='chat-toggle-btn'
          onClick={this.handleToggleChat}
        >
          💬 {messages.length > 0 && (
            <Text className='message-count'>{messages.length}</Text>
          )}
        </Button>

        {/* 聊天内容 */}
        {showChat && (
          <View className='chat-content'>
            <View className='chat-header'>
              <Text className='chat-title'>房间聊天</Text>
              <Button 
                className='close-btn'
                onClick={this.handleToggleChat}
              >
                ✕
              </Button>
            </View>

            <ScrollView 
              className='chat-messages'
              scrollY
              scrollIntoView={`message-${messages.length - 1}`}
            >
              {messages.length === 0 ? (
                <View className='empty-chat'>
                  <Text className='empty-text'>暂无消息</Text>
                </View>
              ) : (
                messages.map((message, index) => (
                  <View 
                    key={message.id}
                    id={`message-${index}`}
                    className={`chat-message ${message.type}`}
                  >
                    <View className='message-header'>
                      <Text className='player-name'>{message.playerName}</Text>
                      <Text className='message-time'>
                        {this.formatTime(message.timestamp)}
                      </Text>
                    </View>
                    <Text className='message-text'>{message.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View className='chat-input'>
              <Input
                className='message-input'
                placeholder='输入消息...'
                value={inputValue}
                onInput={this.handleInputChange}
                maxlength={100}
              />
              <Button 
                className='send-btn'
                onClick={this.handleSendMessage}
                disabled={!inputValue.trim()}
              >
                发送
              </Button>
            </View>
          </View>
        )}
      </View>
    )
  }
}

export default ChatPanel

