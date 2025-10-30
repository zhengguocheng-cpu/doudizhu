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
     */
    connect(userName, userId) {
        if (this.socket && this.isConnected) {
            console.log('🔄 复用现有Socket连接:', this.socket.id);
            return this.socket;
        }

        // 保存用户信息
        this.userName = userName;
        this.userId = userId || userName;

        // 保存到localStorage，供个人中心等页面使用
        localStorage.setItem('userId', this.userId);
        localStorage.setItem('userName', this.userName);

        console.log('🔔 建立新的Socket连接，用户:', userName);
        console.log('💾 保存用户信息到localStorage:', { userId: this.userId, userName: this.userName });

        // 连接时传递auth参数，后端自动认证
        this.socket = io('http://localhost:3000', {
            auth: {
                userId: this.userId,
                userName: this.userName
            }
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
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            console.log('断开Socket连接');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
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
