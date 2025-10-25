/**
 * 斗地主客户端主控制器
 * 协调各个功能模块的工作
 */
class DoudizhuClient {
    constructor() {
        this.socketManager = window.GlobalSocketManager.getInstance();
        this.uiManager = new UIManager();
        this.authManager = new AuthManager(this.socketManager, this.uiManager);
        this.roomManager = new RoomManager(this.socketManager, this.uiManager, this.authManager);
        this.messageManager = new MessageManager(this.uiManager);

        this.initializeSocket();
        this.bindEvents();
    }

    /**
     * 初始化Socket连接和事件监听
     */
    initializeSocket() {
        // 获取全局Socket连接
        this.socket = this.socketManager.connect();

        // 监听认证事件
        this.socket.on('authenticated', (data) => {
            this.authManager.onAuthenticated(data);
            // 认证成功后获取房间列表
            this.roomManager.loadRoomList();
        });

        // 监听房间事件
        this.socket.on('room_joined', (data) => {
            this.roomManager.onRoomJoined(data);
        });

        this.socket.on('room_left', (data) => {
            this.roomManager.onRoomLeft(data);
        });

        this.socket.on('player_joined', (data) => {
            this.roomManager.onPlayerJoined(data);
        });

        this.socket.on('player_left', (data) => {
            this.roomManager.onPlayerLeft(data);
        });

        this.socket.on('error', (error) => {
            this.messageManager.addError(`错误: ${error.message}`);
        });
    }

    /**
     * 绑定UI事件处理
     */
    bindEvents() {
        this.uiManager.bindEvents({
            onLogin: () => this.handleLogin(),
            onLogout: () => this.handleLogout(),
            onRefreshRooms: () => this.handleRefreshRooms(),
            onCreateRoom: () => this.handleCreateRoom()
        });

        this.uiManager.setRoomJoinHandler((roomId) => this.handleJoinRoom(roomId));
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        const formData = this.uiManager.getLoginFormData();
        if (!formData.playerName) {
            alert('请输入玩家名称');
            return;
        }

        const success = await this.authManager.login(formData.playerName);
        if (!success) {
            this.messageManager.addError('登录失败，请检查用户名');
        }
    }

    /**
     * 处理登出
     */
    handleLogout() {
        this.authManager.logout();
    }

    /**
     * 处理刷新房间列表
     */
    async handleRefreshRooms() {
        this.uiManager.clearRoomList();
        await this.roomManager.loadRoomList();
    }

    /**
     * 处理创建房间
     */
    async handleCreateRoom() {
        const formData = this.uiManager.getCreateRoomFormData();
        await this.roomManager.createRoom(formData.roomName, formData.maxPlayers);
    }

    /**
     * 处理加入房间
     */
    async handleJoinRoom(roomId) {
        await this.roomManager.joinRoom(roomId);
    }
}

// 创建客户端实例
const client = new DoudizhuClient();

// 页面加载完成后初始化
window.addEventListener('load', () => {
    console.log('大厅页面加载完成，模块化客户端初始化成功');
});

// 导出到全局以便调试
window.client = client;
