/**
 * 认证管理器 - 处理用户认证和登录逻辑
 */
class AuthManager {
    constructor(socketManager, uiManager) {
        this.socketManager = socketManager;
        this.uiManager = uiManager;
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.currentRoom = null;
    }

    /**
     * 用户登录
     */
    async login(playerName) {
        if (!playerName) {
            alert('请输入玩家名称');
            return false;
        }

        try {
            console.log('正在连接服务器...');

            // 确保连接已建立，然后进行认证
            const socket = this.socketManager.connect();

            // 等待连接建立
            if (!this.socketManager.isConnected) {
                this.uiManager.addMessage('等待连接建立...', 'info');
                // 给连接一些时间建立
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // 进行认证
            this.socketManager.authenticate(playerName);
            return true;

        } catch (error) {
            this.uiManager.addMessage(`连接失败: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * 用户登出
     */
    logout() {
        // 清理当前用户状态
        this.socketManager.userId = null;
        this.socketManager.userName = null;
        this.socketManager.sessionId = null;
        this.socketManager.authenticated = false;

        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.currentRoom = null;

        this.uiManager.toggleLoginSection(true);
        this.uiManager.updateConnectionStatus(false);
        this.uiManager.addMessage('已登出', 'info');
    }

    /**
     * 处理认证成功
     */
    onAuthenticated(data) {
        this.currentPlayer = data.userName;
        this.currentPlayerId = data.userName; // 使用用户名作为playerId

        this.uiManager.updateConnectionStatus(true);
        this.uiManager.setCurrentPlayerName(data.userName);
        this.uiManager.toggleLoginSection(false);
        this.uiManager.addMessage(`成功连接到服务器，欢迎 ${data.userName}!`, 'success');
    }

    /**
     * 获取当前玩家信息
     */
    getCurrentPlayer() {
        return {
            name: this.currentPlayer,
            id: this.currentPlayerId,
            room: this.currentRoom
        };
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return this.currentPlayer && this.currentPlayerId;
    }
}

// 导出到全局
window.AuthManager = AuthManager;
