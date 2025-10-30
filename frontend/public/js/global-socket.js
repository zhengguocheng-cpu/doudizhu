// frontend/public/js/global-socket.js
/**
 * 全局Socket管理器（极简版）
 * 管理整个应用的Socket.IO连接，确保单连接架构
 */
class GlobalSocketManager {
    constructor() {
        console.log('🚀 GlobalSocketManager开始初始化');
        this.socket = null;
        this.isConnected = false;
        this.userName = null;
        this.userId = null;
    }

    /**
     * 获取全局Socket管理器实例
     */
    static getInstance() {
        if (!window.globalSocketManager) {
            window.globalSocketManager = new GlobalSocketManager();
        }
        return window.globalSocketManager;
    }

    /**
     * 建立Socket连接（一次性认证）
     * @param {string} userName - 用户名（可选，如果已认证则从localStorage读取）
     * @param {string} userId - 用户ID（可选，如果已认证则从localStorage读取）
     */
    connect(userName, userId) {
        // 如果已有连接且已连接，直接复用
        if (this.socket && this.isConnected) {
            console.log('🔄 复用现有Socket连接:', this.socket.id);
            console.log('📋 当前用户:', { userId: this.userId, userName: this.userName });
            return this.socket;
        }

        // 如果Socket存在但未连接（可能断线重连），尝试重连
        if (this.socket && !this.isConnected) {
            console.log('🔄 Socket存在但未连接，尝试重连...');
            this.socket.connect();
            return this.socket;
        }

        // 确定用户信息：优先使用参数，其次从实例变量，最后从localStorage
        if (userName && userId) {
            // 新登录，保存用户信息
            this.userName = userName;
            this.userId = userId;
            localStorage.setItem('userId', this.userId);
            localStorage.setItem('userName', this.userName);
            console.log('🆕 新用户登录:', { userId: this.userId, userName: this.userName });
        } else if (this.userName && this.userId) {
            // 使用实例中已有的用户信息
            console.log('📌 使用实例中的用户信息:', { userId: this.userId, userName: this.userName });
        } else {
            // 从localStorage恢复用户信息
            this.userId = localStorage.getItem('userId');
            this.userName = localStorage.getItem('userName');
            
            if (!this.userId || !this.userName) {
                console.error('❌ 无法获取用户信息，请先登录');
                window.location.href = '/';
                return null;
            }
            console.log('💾 从localStorage恢复用户信息:', { userId: this.userId, userName: this.userName });
        }

        console.log('🔔 建立新的Socket连接，用户:', this.userName);

        // 连接时传递auth参数，后端自动认证
        this.socket = io('http://localhost:3000', {
            auth: {
                userId: this.userId,
                userName: this.userName
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.setupGlobalListeners();
        return this.socket;
    }

    /**
     * 设置全局Socket事件监听
     */
    setupGlobalListeners() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Socket连接成功:', {
                socketId: this.socket.id,
                userId: this.userId,
                userName: this.userName
            });
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('❌ Socket断开连接:', {
                reason: reason,
                socketId: this.socket?.id
            });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            console.log('🔄 Socket重连成功:', {
                attemptNumber: attemptNumber,
                socketId: this.socket.id,
                userId: this.userId,
                userName: this.userName
            });
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 尝试重连...', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ 重连失败:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ 重连失败，已达最大尝试次数');
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket错误:', error);
        });
    }


    /**
     * 加入游戏房间
     */
    joinGame(data) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ Socket未连接');
            return false;
        }

        const requestData = {
            roomId: data.roomId,
            userId: data.userId || this.userId,
            playerName: data.playerName || this.userName
        };

        console.log('📤 发送join_game:', requestData);

        try {
            this.socket.emit('join_game', requestData);
            return true;
        } catch (error) {
            console.error('❌ 发送join_game失败:', error);
            return false;
        }
    }

    /**
     * 离开游戏房间
     */
    leaveGame(roomId) {
        if (!this.socket || !this.isConnected) {
            return false;
        }
        this.socket.emit('leave_game', {
            roomId: roomId,
            userId: this.userId
        });
        return true;
    }

    /**
     * 发送聊天消息
     */
    sendChat(roomId, message) {
        if (!this.socket || !this.isConnected) {
            return false;
        }
        this.socket.emit('send_message', {
            roomId: roomId,
            message: message
        });
        return true;
    }

    /**
     * 断开连接（登出时调用）
     */
    disconnect() {
        if (this.socket) {
            console.log('🔌 断开Socket连接');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.userName = null;
            this.userId = null;
        }
    }

    /**
     * 清除用户信息（登出时调用）
     */
    clearAuth() {
        console.log('🗑️ 清除认证信息');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('lastGameSettlement');
        this.disconnect();
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            userId: this.userId,
            userName: this.userName,
            socketId: this.socket ? this.socket.id : null
        };
    }
}

// 导出到全局
window.GlobalSocketManager = GlobalSocketManager;
