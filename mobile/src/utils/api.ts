import Taro from '@tarojs/taro'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiManager {
  private baseUrl: string
  private timeout: number = 10000

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'
  }

  // 通用请求方法
  private async request<T = any>(
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      data?: any
      header?: Record<string, string>
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', data, header = {} } = options

    try {
      // 添加认证头
      const authHeader = this.getAuthHeader()
      const requestHeader = {
        'Content-Type': 'application/json',
        ...authHeader,
        ...header
      }

      const response = await Taro.request({
        url: `${this.baseUrl}${url}`,
        method,
        data,
        header: requestHeader,
        timeout: this.timeout
      })

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {
          success: true,
          data: response.data
        }
      } else {
        return {
          success: false,
          error: `HTTP ${response.statusCode}`,
          message: response.data?.message || '请求失败'
        }
      }
    } catch (error: any) {
      console.error('API请求失败:', error)
      return {
        success: false,
        error: error.message || '网络错误',
        message: '网络连接失败，请检查网络设置'
      }
    }
  }

  // GET请求
  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : ''
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return this.request<T>(fullUrl, { method: 'GET' })
  }

  // POST请求
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', data })
  }

  // PUT请求
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', data })
  }

  // DELETE请求
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' })
  }

  // 获取认证头
  private getAuthHeader(): Record<string, string> {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo?.token) {
        return {
          'Authorization': `Bearer ${userInfo.token}`
        }
      }
    } catch (error) {
      console.warn('获取用户信息失败:', error)
    }
    return {}
  }

  // 构建查询字符串
  private buildQueryString(params: Record<string, any>): string {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
  }

  // 设置超时时间
  setTimeout(timeout: number): void {
    this.timeout = timeout
  }

  // 设置基础URL
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl
  }
}

// 创建API实例
export const apiManager = new ApiManager()

// 房间相关API
export const roomApi = {
  // 获取房间列表
  getRooms: () => apiManager.get('/api/rooms'),
  
  // 获取房间详情
  getRoom: (roomId: string) => apiManager.get(`/api/rooms/${roomId}`),
  
  // 创建房间
  createRoom: (data: { name: string; maxPlayers?: number }) => 
    apiManager.post('/api/rooms', data),
  
  // 加入房间
  joinRoom: (roomId: string, data: { userName: string }) => 
    apiManager.post(`/api/rooms/${roomId}/join`, data),
  
  // 离开房间
  leaveRoom: (roomId: string) => 
    apiManager.post(`/api/rooms/${roomId}/leave`),
  
  // 开始游戏
  startGame: (roomId: string) => 
    apiManager.post(`/api/rooms/${roomId}/start`),
  
  // 结束游戏
  endGame: (roomId: string) => 
    apiManager.post(`/api/rooms/${roomId}/end`)
}

// 游戏相关API
export const gameApi = {
  // 出牌
  playCards: (roomId: string, data: { cards: string[] }) => 
    apiManager.post(`/api/game/${roomId}/play`, data),
  
  // 不出
  passTurn: (roomId: string) => 
    apiManager.post(`/api/game/${roomId}/pass`),
  
  // 抢地主
  grabLandlord: (roomId: string, data: { isGrab: boolean }) => 
    apiManager.post(`/api/game/${roomId}/grab`, data),
  
  // 获取游戏状态
  getGameState: (roomId: string) => 
    apiManager.get(`/api/game/${roomId}/state`)
}

// 用户相关API
export const userApi = {
  // 用户登录
  login: (data: { userName: string; avatar: string }) => 
    apiManager.post('/api/auth/login', data),
  
  // 获取用户信息
  getUserInfo: () => apiManager.get('/api/user/info'),
  
  // 更新用户信息
  updateUserInfo: (data: { userName?: string; avatar?: string }) => 
    apiManager.put('/api/user/info', data)
}

// 聊天相关API
export const chatApi = {
  // 发送消息
  sendMessage: (roomId: string, data: { message: string }) => 
    apiManager.post(`/api/chat/${roomId}/send`, data),
  
  // 获取消息历史
  getMessageHistory: (roomId: string, params?: { limit?: number; offset?: number }) => 
    apiManager.get(`/api/chat/${roomId}/history`, params)
}



