import { makeAutoObservable } from 'mobx'
import Taro from '@tarojs/taro'

export interface UserInfo {
  userId: string
  userName: string
  avatar: string
  token?: string
  isOnline: boolean
  lastLoginTime?: number
}

class UserStore {
  userInfo: UserInfo | null = null
  isLoggedIn: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.loadUserFromStorage()
  }

  // 设置用户信息
  setUser(userInfo: UserInfo): void {
    this.userInfo = userInfo
    this.isLoggedIn = true
    this.saveUserToStorage()
  }

  // 更新用户信息
  updateUser(updates: Partial<UserInfo>): void {
    if (this.userInfo) {
      this.userInfo = { ...this.userInfo, ...updates }
      this.saveUserToStorage()
    }
  }

  // 设置在线状态
  setOnlineStatus(isOnline: boolean): void {
    if (this.userInfo) {
      this.userInfo.isOnline = isOnline
      this.saveUserToStorage()
    }
  }

  // 登出
  logout(): void {
    this.userInfo = null
    this.isLoggedIn = false
    this.clearUserFromStorage()
  }

  // 从本地存储加载用户信息
  private loadUserFromStorage(): void {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo) {
        this.userInfo = userInfo
        this.isLoggedIn = true
      }
    } catch (error) {
      console.warn('加载用户信息失败:', error)
    }
  }

  // 保存用户信息到本地存储
  private saveUserToStorage(): void {
    try {
      if (this.userInfo) {
        Taro.setStorageSync('userInfo', this.userInfo)
      }
    } catch (error) {
      console.warn('保存用户信息失败:', error)
    }
  }

  // 清除本地存储的用户信息
  private clearUserFromStorage(): void {
    try {
      Taro.removeStorageSync('userInfo')
    } catch (error) {
      console.warn('清除用户信息失败:', error)
    }
  }

  // 获取用户显示名称
  get displayName(): string {
    return this.userInfo?.userName || '游客'
  }

  // 获取用户头像
  get userAvatar(): string {
    return this.userInfo?.avatar || '👤'
  }

  // 获取用户ID
  get userId(): string {
    return this.userInfo?.userId || ''
  }

  // 检查是否已登录
  get isAuthenticated(): boolean {
    return this.isLoggedIn && !!this.userInfo
  }
}

// 创建用户状态管理实例
export const userStore = new UserStore()

