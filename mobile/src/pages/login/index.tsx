import { Component } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import { navigateTo } from '@tarojs/taro'
import { observer, inject } from 'mobx-react'
import { userStore } from '../../store/user'
import { socketManager } from '../../utils/socket'
import './index.scss'

interface LoginState {
  userName: string
  avatar: string
  loading: boolean
}

@inject('userStore')
@observer
class Login extends Component<any, LoginState> {
  constructor(props: any) {
    super(props)
    this.state = {
      userName: '',
      avatar: '👤',
      loading: false
    }
  }

  // 头像选择
  avatarOptions = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🎮', '🦸', '🦸‍♀️', '🎭']

  handleUserNameChange = (e: any) => {
    this.setState({ userName: e.detail.value })
  }

  handleAvatarSelect = (avatar: string) => {
    this.setState({ avatar })
  }

  handleLogin = async () => {
    const { userName, avatar } = this.state
    
    if (!userName.trim()) {
      // 显示错误提示
      return
    }

    this.setState({ loading: true })

    try {
      // 连接Socket
      await socketManager.connect()
      
      // 设置用户信息
      userStore.setUser({
        userName: userName.trim(),
        avatar,
        userId: Date.now().toString()
      })

      // 跳转到大厅
      navigateTo({
        url: '/pages/lobby/index'
      })
    } catch (error) {
      console.error('登录失败:', error)
      // 显示错误提示
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { userName, avatar, loading } = this.state

    return (
      <View className='login-container'>
        {/* 头部 */}
        <View className='login-header'>
          <Image 
            className='logo' 
            src='/assets/images/logo.png' 
            mode='aspectFit'
          />
          <Text className='title'>斗地主游戏</Text>
          <Text className='subtitle'>经典扑克游戏，等你来战！</Text>
        </View>

        {/* 登录表单 */}
        <View className='login-form'>
          <View className='form-group'>
            <Text className='label'>玩家昵称</Text>
            <Input
              className='input'
              placeholder='请输入昵称'
              value={userName}
              onInput={this.handleUserNameChange}
              maxlength={10}
            />
          </View>

          <View className='form-group'>
            <Text className='label'>选择头像</Text>
            <View className='avatar-grid'>
              {this.avatarOptions.map((option, index) => (
                <View
                  key={index}
                  className={`avatar-option ${avatar === option ? 'selected' : ''}`}
                  onClick={() => this.handleAvatarSelect(option)}
                >
                  <Text className='avatar-text'>{option}</Text>
                </View>
              ))}
            </View>
          </View>

          <Button
            className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
            onClick={this.handleLogin}
            disabled={!userName.trim() || loading}
          >
            {loading ? '登录中...' : '进入游戏'}
          </Button>
        </View>

        {/* 底部信息 */}
        <View className='login-footer'>
          <Text className='tips'>登录即表示同意用户协议和隐私政策</Text>
        </View>
      </View>
    )
  }
}

export default Login
