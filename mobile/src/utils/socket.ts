import Taro from '@tarojs/taro'

interface SocketMessage {
  event: string
  data: any
}

class SocketManager {
  private socket: any = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 2000
  private eventListeners: Map<string, Function[]> = new Map()
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map()

  constructor() {
    this.setupGlobalErrorHandler()
  }

  // 连接WebSocket
  async connect(): Promise<void> {
    if (this.socket && this.isConnected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl()
        
        this.socket = Taro.connectSocket({
          url: wsUrl,
          header: {
            'Authorization': this.getAuthToken()
          },
          success: () => {
            console.log('WebSocket连接成功')
            this.setupSocketListeners()
            resolve()
          },
          fail: (error: any) => {
            console.error('WebSocket连接失败:', error)
            reject(error)
          }
        })
      } catch (error) {
        console.error('WebSocket连接异常:', error)
        reject(error)
      }
    })
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
    }
  }

  // 发送消息
  send(event: string, data: any = {}): void {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket未连接，无法发送消息')
      return
    }

    const message: SocketMessage = { event, data }
    
    this.socket.send({
      data: JSON.stringify(message)
    })
  }

  // 发送请求并等待响应
  async request(event: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId()
      
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('请求超时'))
      }, 10000)

      // 存储请求
      this.pendingRequests.set(requestId, {
        resolve: (response: any) => {
          clearTimeout(timeout)
          resolve(response)
        },
        reject: (error: any) => {
          clearTimeout(timeout)
          reject(error)
        }
      })

      // 发送请求
      this.send(event, { ...data, requestId })
    })
  }

  // 监听事件
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  // 移除事件监听
  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) {
      return
    }

    if (callback) {
      const listeners = this.eventListeners.get(event)!
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  // 获取连接状态
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  // 设置WebSocket监听器
  private setupSocketListeners(): void {
    if (!this.socket) return

    // 连接打开
    this.socket.onOpen(() => {
      console.log('WebSocket已连接')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    // 接收消息
    this.socket.onMessage((res: any) => {
      try {
        const message: SocketMessage = JSON.parse(res.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('解析消息失败:', error)
      }
    })

    // 连接关闭
    this.socket.onClose(() => {
      console.log('WebSocket连接关闭')
      this.isConnected = false
      this.handleReconnect()
    })

    // 连接错误
    this.socket.onError((error: any) => {
      console.error('WebSocket错误:', error)
      this.isConnected = false
      this.handleReconnect()
    })
  }

  // 处理消息
  private handleMessage(message: SocketMessage): void {
    const { event, data } = message

    // 处理响应消息
    if (data.requestId && this.pendingRequests.has(data.requestId)) {
      const request = this.pendingRequests.get(data.requestId)!
      this.pendingRequests.delete(data.requestId)
      
      if (data.success) {
        request.resolve(data.result)
      } else {
        request.reject(new Error(data.error || '请求失败'))
      }
      return
    }

    // 处理事件消息
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)!
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error)
        }
      })
    }
  }

  // 处理重连
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('重连次数超限，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`)
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('重连失败:', error)
      })
    }, delay)
  }

  // 获取WebSocket URL
  private getWebSocketUrl(): string {
    const baseUrl = process.env.WS_BASE_URL || 'ws://localhost:3000'
    return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
  }

  // 获取认证Token
  private getAuthToken(): string {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      return userInfo?.token || ''
    } catch (error) {
      return ''
    }
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 设置全局错误处理
  private setupGlobalErrorHandler(): void {
    // 监听应用错误
    Taro.onError((error: string) => {
      console.error('应用错误:', error)
    })

    // 监听未处理的Promise拒绝
    Taro.onUnhandledRejection((res: any) => {
      console.error('未处理的Promise拒绝:', res)
    })
  }
}

// 创建单例实例
export const socketManager = new SocketManager()



