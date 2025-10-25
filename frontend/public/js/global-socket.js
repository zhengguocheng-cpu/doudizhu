// frontend/public/js/global-socket.js
/**
 * 全局Socket管理器
 * 管理整个应用的Socket.IO连接，确保单连接架构
 */
class GlobalSocketManager {
    constructor() {
        console.log('🚀 GlobalSocketManager开始初始化');

        this.socket = null;
        this.userAuth = 
        {
            userId: null,
            userName: null,
            socketid:null,
            sessionId: null,
            isConnected: false,
            authenticated: false
        };
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
     * 建立Socket连接（用户名认证模式）
     */
    connect(userName,userId) {
        if (this.socket) {
            console.log('🔄 复用现有Socket连接:', this.socket.id);
            return this.socket;
        }
        this.userAuth.userName=userName;
        this.userAuth.userId=userId;
        console.log('🔌 建立新的Socket连接（用户名认证模式）');

        console.log('🌐 连接到服务器: http://localhost:3000');
        this.socket = io('http://localhost:3000', {
            auth:this.userAuth
        });
        this.setupGlobalListeners();
        return this.socket;
    }
    setupGlobalListeners() {
        this.socket.on('connect', (data) => {
            this.isConnected = true;
            console.log('✅ 全局Socket连接成功:', {
                socketId: this.socket.id
            });
            console.log('✅ 收到认证成功响应:', data);

            this.userAuth = {...data};
            
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.authenticated = false;
            console.log('❌ 全局Socket断开连接:', {
                reason: reason,
                socketId: this.socket?.id
            });
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket错误:', error);
        });

        // 注释掉认证响应监听
        // this.socket.on('authenticated', (data) => {
        //     console.log('✅ 收到认证成功响应:', data);
        //     this.setAuthenticated(data);
        // });

        this.socket.on('error', (error) => {
            console.error('❌ 认证错误:', error);
        });

    }

    /**
     * 设置页面跳转监听（简化版）
     */
    setupPageNavigation() {
        // 移除复杂的页面状态管理
    }

    /**
     * 保存页面状态（简化版）
     */
    savePageState() {
        // 简化：只保存基本信息到localStorage
        const pageState = {
            userId: this.userId,
            userName: this.userName,
            sessionId: this.sessionId,
            authenticated: this.authenticated,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('doudizhu_page_state', JSON.stringify(pageState));
        } catch (error) {
            console.warn('保存页面状态失败:', error);
        }
    }

    /**
     * 恢复页面状态（简化版 - 作为后备方案）
     */
    restorePageState() {
        // 不再需要复杂的localStorage恢复逻辑
        // 现在优先使用全局变量window.userAuth
        this.checkGlobalAuth();
    }

    /**
     * 清理页面状态
     */
    clearPageState() {
        localStorage.removeItem('doudizhu_page_state');
        this.pageState = {};
    }

    /**
     * 用户认证（简化版）- 注释掉
     */
    authenticate(userName) {
        // 注释掉认证方法
        // this.userName = userName;
        // console.log('准备认证用户:', userName);

        // if (!this.socket || !this.isConnected) {
        //     console.warn('Socket未连接，等待连接后认证');
        //     this.waitForConnectionAndAuthenticate(userName);
        //     return;
        // }

        // console.log('发送认证请求:', userName);
        // this.socket.emit('authenticate', { userName: userName });
    }

    /**
     * 等待连接建立后自动认证 - 注释掉
     */
    waitForConnectionAndAuthenticate(userName) {
        // 注释掉等待连接认证方法
        // if (this.socket && this.isConnected) {
        //     this.socket.emit('authenticate', { userName: userName });
        //     return;
        // }

        // setTimeout(() => {
        //     this.waitForConnectionAndAuthenticate(userName);
        // }, 1000);
    }

    /**
     * 检查全局认证状态（简化版）- 注释掉
     */
    // checkGlobalAuth() {
    //     // 注释掉全局认证检查
    //     // if (window.userAuth && window.userAuth.authenticated) {
    //     //     console.log('✅ 发现全局认证状态，更新本地状态');
    //     //     this.setAuthenticated(window.userAuth);
    //     // }
    // }

    /**
     * 设置认证状态（保存到全局变量）- 注释掉
     */
    setAuthenticated(data) {
        // 注释掉认证状态设置
        // this.userId = data.userName;
        // this.userName = data.userName;
        // this.sessionId = data.sessionId;
        // this.authenticated = true;

        // // 保存到全局变量
        // window.userAuth = {
        //     userId: data.userName,
        //     userName: data.userName,
        //     sessionId: data.sessionId,
        //     authenticated: true,
        //     timestamp: Date.now()
        // };

        // console.log('设置认证状态并保存到全局:', window.userAuth);

        // // 如果Socket已连接，设置认证属性
        // if (this.socket) {
        //     this.socket.authenticated = true;
        //     this.socket.userId = this.userId;
        //     this.socket.userName = this.userName;
        //     this.socket.sessionId = this.sessionId;
        //     this.socket.user = { name: this.userName };
        // }
    }

    /**
     * 清理认证状态 - 注释掉
     */
    clearAuthentication() {
        // 注释掉认证状态清理
        // this.userId = null;
        // this.userName = null;
        // this.sessionId = null;
        // this.authenticated = false;

        // // 清理全局变量
        // window.userAuth = null;

        // // 清理localStorage作为后备
        // this.clearPageState();
    }

    /**
     * 加入游戏房间 - 简化版
     */
    joinGame(data) {
        console.log('🔄 前端准备发送join_game请求:', {
            socketConnected: this.isConnected,
            socketId: this.socket?.id,
            requestData: data
        });

        // 简化认证检查 - 直接使用用户名
        const userId = data.userId || data.userName;
        const userName = data.userName || data.playerName;

        if (!userId || !userName) {
            console.error('❌ 缺少用户ID或用户名:', {
                userId: userId,
                userName: userName
            });
            return false;
        }

        // 注释掉认证属性设置
        // if (this.socket) {
        //     this.socket.authenticated = true;
        //     this.socket.userId = userId;
        //     this.socket.userName = userName;
        //     this.socket.sessionId = this.sessionId;
        // }

        if (!this.socket || !this.isConnected) {
            console.error('❌ Socket未连接:', {
                socket: !!this.socket,
                isConnected: this.isConnected,
                socketId: this.socket?.id
            });
            return false;
        }

        console.log('📤 发送join_game事件到服务器:', {
            roomId: data.roomId,
            userId: userId,
            playerName: userName,
            socketId: this.socket.id
        });

        const requestData = {
            roomId: data.roomId,
            userId: userId,
            playerName: userName
        };

        console.log('📤 发送join_game数据详情:', requestData);

        try {
            this.socket.emit('join_game', requestData);
            console.log('✅ join_game事件发送成功，数据:', requestData);
            return true;
        } catch (error) {
            console.error('❌ 发送join_game事件失败:', error);
            return false;
        }
    }

    /**
     * 离开游戏房间
     */
    leaveGame(roomId) {
        if (!this.authenticated) {
            console.error('用户未认证，无法离开游戏');
            return false;
        }

        console.log('发送离开游戏请求:', roomId);
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
        if (!this.authenticated) {
            console.error('用户未认证，无法发送消息');
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
            console.log('主动断开Socket连接');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.authenticated = false;
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            authenticated: this.authenticated,
            userId: this.userId,
            userName: this.userName,
            sessionId: this.sessionId,
            socketId: this.socket ? this.socket.id : null
        };
    }
}

// 导出到全局
window.GlobalSocketManager = GlobalSocketManager;
