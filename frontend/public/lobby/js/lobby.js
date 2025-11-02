/**
 * 大厅页面控制器
 * 处理大厅功能和房间管理
 */
class LobbyController {
    constructor() {
        this.socketManager = window.GlobalSocketManager.getInstance();
        this.uiManager = new UIManager();
        this.roomManager = new RoomManager(this.socketManager, this.uiManager);
        this.messageManager = new MessageManager(this.uiManager);

        this.currentPlayer = null;
        this.playerAvatar = '👑';

        this.initializeFromUrl();
        this.initializeSocket();
        this.bindEvents();
    }

    /**
     * 从URL参数初始化用户信息（统一认证管理）
     */
    initializeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const playerName = urlParams.get('playerName');
        const playerAvatar = urlParams.get('playerAvatar');
        console.log('从URL参数获取playerName:', playerName);
        console.log('从URL参数获取playerAvatar:', playerAvatar);

        if (playerName) {
            this.currentPlayer = decodeURIComponent(playerName);
            this.uiManager.setCurrentPlayerName(this.currentPlayer);
            console.log('[decodeURIComponent]从URL参数获取playerName:', this.currentPlayer);
        }

        if (playerAvatar) {
            this.playerAvatar = decodeURIComponent(playerAvatar);
            this.uiManager.setPlayerAvatar(this.playerAvatar);
        }

        console.log('🏠 大厅页面开始初始化');

        // 注释掉认证状态检查，直接初始化
        // console.log('🔍 检查全局认证状态:', {
        //     windowUserAuth: window.userAuth,
        //     globalSocketAuthenticated: this.socketManager.authenticated,
        //     globalSocketUserId: this.socketManager.userId,
        //     socketConnected: this.socketManager.isConnected,
        //     socketId: this.socketManager.socket?.id
        // });

        // if (window.userAuth && window.userAuth.authenticated) {
        //     console.log('✅ 使用全局认证状态');

        //     // 更新GlobalSocketManager状态
        //     this.socketManager.setAuthenticated(window.userAuth);

        //     // 确保Socket有正确的认证属性
        //     if (this.socketManager.socket) {
        //         this.socketManager.socket.authenticated = true;
        //         this.socketManager.socket.userId = window.userAuth.userId;
        //         this.socketManager.socket.userName = window.userAuth.userName;
        //         this.socketManager.socket.sessionId = window.userAuth.sessionId;
        //         this.socketManager.socket.user = { name: window.userAuth.userName };

        //         console.log('🔌 设置Socket认证属性:', {
        //             socketAuthenticated: this.socketManager.socket.authenticated,
        //             socketUserId: this.socketManager.socket.userId,
        //             socketUserName: this.socketManager.socket.userName,
        //             socketSessionId: this.socketManager.socket.sessionId
        //         });
        //     }

        // } else {
        //     console.log('❌ 无全局认证状态，跳转到登录页面');
        //     this.redirectToLogin();
        //     return;
        // }

        // 注释掉认证检查，直接初始化
        console.log('✅ 跳过认证检查，直接初始化大厅');

        // 完成初始化
        this.completeInitialization();
    }

    /**
     * 完成大厅页面初始化 - 简化版
     */
    completeInitialization() {
        console.log('🔄 开始完成大厅页面初始化');

        // 注释掉认证状态使用，直接设置用户名
        // this.currentPlayer = this.socketManager.userName;
        // this.uiManager.setCurrentPlayerName(this.currentPlayer);

        // 设置房间管理器的当前玩家
        this.currentPlayer = this.currentPlayer || '玩家'; // 默认玩家名
        this.uiManager.setCurrentPlayerName(this.currentPlayer);

        // 设置房间管理器的当前玩家
        this.roomManager.setCurrentPlayer(this.currentPlayer, this.playerAvatar);

        console.log('👤 设置大厅用户信息:', {
            currentPlayer: this.currentPlayer,
            playerAvatar: this.playerAvatar,
            socketConnected: this.socketManager.isConnected,
            socketId: this.socketManager.socket?.id
        });

        // 直接设置事件监听（Socket应该已经连接好了）
        this.initializeSocket();
        this.bindEvents();

        console.log('✅ 大厅页面初始化完成');

        console.log('大厅页面初始化用户信息:', {
            playerName: this.currentPlayer,
            playerAvatar: this.playerAvatar,
            socketId: this.socketManager.socket?.id
        });
    }

    /**
     * 初始化Socket事件监听（多页面架构）
     */
    initializeSocket() {
        // 建立新的Socket连接
        const socket = this.socketManager.connect(this.currentPlayer,
            this.currentPlayer, 'lobby');
        if (!socket) {
            console.error('❌ 无法建立Socket连接');
            return;
        }

        console.log('🔌 [MPA] 大厅页面建立Socket连接:', socket.id);

        // 连接状态事件
        socket.on('connect', () => {
            console.log('✅ Socket已连接');
            this.uiManager.updateConnectionStatus(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket已断开');
            this.uiManager.updateConnectionStatus(false);
        });

        // 初始化时更新连接状态
        this.uiManager.updateConnectionStatus(this.socketManager.isConnected);

        // 房间相关事件
        socket.on('room_joined', (data) => {
            this.roomManager.onRoomJoined(data);
        });

        socket.on('room_left', (data) => {
            this.roomManager.onRoomLeft(data);
        });

        socket.on('player_joined', (data) => {
            this.roomManager.onPlayerJoined(data);
        });

        socket.on('player_left', (data) => {
            this.roomManager.onPlayerLeft(data);
        });

        socket.on('error', (error) => {
            this.messageManager.addError(`错误: ${error.message}`);
        });

        // 设置房间更新监听
        this.roomManager.setupRoomsUpdateListener();

        // 页面初始化时直接获取房间列表
        this.roomManager.loadRoomList();
    }

    /**
     * 绑定UI事件
     */
    bindEvents() {
        this.uiManager.bindEvents({
            onProfile: () => this.handleProfile(),
            onLogout: () => this.handleLogout(),
            onRefreshRooms: () => this.handleRefreshRooms(),
            onQuickJoin: () => this.handleQuickJoin(),
            onMyRooms: () => this.handleMyRooms(),
            onFeedback: () => this.handleFeedback()
        });

        this.uiManager.setRoomJoinHandler((roomId) => this.handleJoinRoom(roomId));
    }

    /**
     * 处理反馈
     */
    handleFeedback() {
        console.log('📝 跳转到反馈页面');
        window.location.href = '/feedback/';
    }

    /**
     * 处理进入个人中心
     */
    handleProfile() {
        console.log('👤 进入个人中心');
        // const userId = this.currentPlayer;
        // console.log('👤 进入个人中心', userId);
        // window.location.href = 
        // '/profile/index.html?userId=' +
        // '${encodeURIComponent(userId)}';
        // 通过URL参数传递完整的用户信息，确保查看的是当前玩家的个人中心
        const params = new URLSearchParams({
            userId: encodeURIComponent(this.currentPlayer),
            userName: encodeURIComponent(this.currentPlayer),
            playerAvatar: encodeURIComponent(this.playerAvatar)
        });

        //window.location.href = `/profile?${params.toString()}`;

        const profileUrl = `/profile/index.html?${params.toString()}`;

        const goprofile = () => { window.location.href = profileUrl; };

        const socket = this.socketManager?.socket;
        if (socket?.connected) {
            socket.once('disconnect', goprofile);
            this.socketManager.disconnect();
            setTimeout(goprofile, 200); // 防止断开失败或过久未回调
        } else {
            goprofile();
        }
    }

    /**
     * 处理登出（简化版）
     */
    handleLogout() {
        // 使用GlobalSocketManager的clearAuth方法清除所有认证信息
        this.socketManager.clearAuth();

        this.messageManager.addInfo('已登出');

        // 跳转到登录页面
        setTimeout(() => {
            this.redirectToLogin();
        }, 1000);
    }

    /**
     * 处理刷新房间列表
     */
    async handleRefreshRooms() {
        this.uiManager.clearRoomList();
        await this.roomManager.loadRoomList();
    }

    /**
     * 处理快速加入
     */
    async handleQuickJoin() {
        this.messageManager.addInfo('正在寻找可用房间...');
        const availableRooms = await this.roomManager.getAvailableRooms();
        if (availableRooms.length > 0) {
            await this.handleJoinRoom(availableRooms[0].id);
        } else {
            this.messageManager.addWarning('暂无可用房间');
        }
    }

    /**
     * 处理查看我的房间
     */
    async handleMyRooms() {
        this.messageManager.addInfo('正在加载您的房间...');
    }

    /**
     * 处理加入房间
     * MPA架构：大厅只负责导航，不发送join_game请求
     * 房间页面的Socket会负责真正的加入操作
     */
    async handleJoinRoom(roomId) {
        try {
            console.log('🚀 [大厅] 准备跳转到房间:', roomId);

            // 生成页面跳转令牌，用于后端识别合法的页面跳转
            const pageNavigationToken = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 保存到localStorage，供房间页面使用
            localStorage.setItem('pageNavigationToken', pageNavigationToken);
            localStorage.setItem('pageNavigationTime', Date.now().toString());

            console.log('🎫 [大厅] 生成页面跳转令牌:', pageNavigationToken);

            // 直接跳转到房间页面，不在大厅发送join_game
            // 房间页面会建立新的Socket连接并发送join_game请求
            const params = new URLSearchParams({
                roomId: roomId,
                playerName: encodeURIComponent(this.currentPlayer),
                playerAvatar: encodeURIComponent(this.playerAvatar)
            });
            
            const roomUrl = `/room/room.html?${params.toString()}`;
            const goRoom = () => { window.location.href = roomUrl; };

            const socket = this.socketManager?.socket;
            if (socket?.connected) {
                socket.once('disconnect', goRoom);
                this.socketManager.disconnect();
                setTimeout(goRoom, 200); // 防止断开失败或过久未回调
            } else {
                goRoom();
            }
        } catch (error) {
            this.messageManager.addError(`跳转失败: ${error.message}`);
        }
    }

    /**
     * 跳转到登录页面
     */
    redirectToLogin() {
        window.location.href = '/login/index.html';
    }
}

// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('🚨 全局JavaScript错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未处理的Promise错误:', {
        reason: event.reason,
        promise: event.promise
    });
});

// 页面加载完成后初始化
window.addEventListener('load', () => {
    console.log('🏠 大厅页面加载完成');
    console.log('📋 URL参数:', window.location.search);
    console.log('🌐 当前完整URL:', window.location.href);

    const urlParams = new URLSearchParams(window.location.search);
    console.log('📝 解析的URL参数:', {
        playerName: urlParams.get('playerName'),
        playerAvatar: urlParams.get('playerAvatar'),
        loginTime: urlParams.get('loginTime')
    });

    try {
        new LobbyController();
    } catch (error) {
        console.error('❌ LobbyController初始化失败:', error);
    }
});

// 导出到全局以便调试
window.LobbyController = LobbyController;