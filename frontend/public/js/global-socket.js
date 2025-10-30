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
        this.currentRoomId = null; // 记录当前房间ID
        this.reconnectAttempts = 0; // 重连尝试次数
        this.maxReconnectAttempts = 10; // 最大重连次数（增加到10次）
        this.isReconnecting = false; // 是否正在重连
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
     * 建立Socket连接（仅在登录时调用）
     * @param {string} userName - 用户名
     * @param {string} userId - 用户ID
     */
    connect(userName, userId) {
        // 如果已有连接且已连接，直接复用（单连接架构的核心）
        if (this.socket && this.isConnected) {
            console.log('🔄 [单连接] 复用现有Socket连接:', this.socket.id);
            console.log('📋 当前用户:', { userId: this.userId, userName: this.userName });
            return this.socket;
        }

        // 如果Socket存在但未连接（断线重连场景）
        if (this.socket && !this.isConnected) {
            console.log('🔄 [单连接] Socket存在但未连接，尝试重连...');
            this.socket.connect();
            return this.socket;
        }

        // 保存用户信息
        this.userName = userName;
        this.userId = userId;
        localStorage.setItem('userId', this.userId);
        localStorage.setItem('userName', this.userName);
        console.log('🆕 [单连接] 新用户登录，建立连接:', { userId: this.userId, userName: this.userName });

        // 连接时传递auth参数，后端自动认证
        this.socket = io('http://localhost:3000', {
            auth: {
                userId: this.userId,
                userName: this.userName
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 10000
        });

        this.setupGlobalListeners();
        return this.socket;
    }

    /**
     * 获取当前Socket连接（不建立新连接）
     * 用于大厅、房间等页面获取已存在的连接
     */
    getSocket() {
        if (!this.socket || !this.isConnected) {
            console.error('❌ [单连接] Socket未连接，请先登录');
            // 尝试从localStorage恢复并重连
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');
            if (userId && userName) {
                console.log('🔄 [单连接] 尝试恢复连接...');
                return this.connect(userName, userId);
            }
            window.location.href = '/';
            return null;
        }
        
        console.log('✅ [单连接] 获取现有Socket连接:', this.socket.id);
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

        // 监听认证失败事件（仅用于登录阶段）
        this.socket.on('auth_failed', (data) => {
            console.error('❌ [单连接] 认证失败:', data.message);
            
            // 只在登录页面才处理认证失败
            if (window.location.pathname === '/' || window.location.pathname.includes('/login/')) {
                this.isConnected = false;
                this.authenticated = false;
                
                // 显示错误提示
                alert(data.message || '用户名已被占用，请使用其他用户名');
                
                // 清除本地存储
                this.clearAuth();
                
                // 跳转回登录页
                window.location.href = '/';
            } else {
                // 其他页面只记录日志，不跳转
                console.warn('⚠️ [单连接] 收到auth_failed但不在登录页，忽略');
            }
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('❌ Socket断开连接:', {
                reason: reason,
                socketId: this.socket?.id
            });
            
            // 显示断线提示
            this.showConnectionStatus('网络连接已断开，正在尝试重连...', 'warning');
            
            // 如果是服务器主动断开，提示用户
            if (reason === 'io server disconnect') {
                this.showConnectionStatus('服务器已断开连接，请刷新页面重新登录', 'error');
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            this.isReconnecting = false;
            this.reconnectAttempts = 0;
            console.log('🔄 Socket重连成功:', {
                attemptNumber: attemptNumber,
                socketId: this.socket.id,
                userId: this.userId,
                userName: this.userName
            });
            
            // 显示重连成功提示
            this.showConnectionStatus('网络连接已恢复', 'success');
            
            // 如果在房间中，尝试重新加入
            if (this.currentRoomId) {
                console.log('🔄 重连后自动重新加入房间:', this.currentRoomId);
                setTimeout(() => {
                    this.rejoinRoom(this.currentRoomId);
                }, 500);
            }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.isReconnecting = true;
            this.reconnectAttempts = attemptNumber;
            console.log('🔄 尝试重连...', attemptNumber);
            
            // 更新重连提示
            this.showConnectionStatus(`正在重连... (${attemptNumber}/${this.maxReconnectAttempts})`, 'warning');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ 重连失败:', error);
        });

        this.socket.on('reconnect_failed', () => {
            this.isReconnecting = false;
            console.error('❌ 重连失败，已达最大尝试次数');
            
            // 显示重连失败提示
            this.showConnectionStatus('网络连接失败，请检查网络后刷新页面', 'error', 0);
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
            this.showConnectionStatus('网络未连接，请稍后重试', 'error');
            return false;
        }

        const requestData = {
            roomId: data.roomId,
            userId: data.userId || this.userId,
            playerName: data.playerName || this.userName,
            playerAvatar: data.playerAvatar || localStorage.getItem('playerAvatar') || '👑'
        };

        console.log('📤 发送join_game:', requestData);

        try {
            this.socket.emit('join_game', requestData);
            // 记录当前房间ID，用于重连后恢复
            this.currentRoomId = data.roomId;
            return true;
        } catch (error) {
            console.error('❌ 发送join_game失败:', error);
            this.showConnectionStatus('加入房间失败，请重试', 'error');
            return false;
        }
    }

    /**
     * 重新加入房间（重连后调用）
     */
    rejoinRoom(roomId) {
        if (!this.socket || !this.isConnected) {
            console.error('❌ 无法重新加入房间：Socket未连接');
            return false;
        }

        console.log('🔄 重新加入房间:', roomId);
        return this.joinGame({ roomId: roomId });
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
        // 清除当前房间ID
        this.currentRoomId = null;
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
            socketId: this.socket ? this.socket.id : null,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * 显示连接状态提示
     * @param {string} message - 提示消息
     * @param {string} type - 类型: success, warning, error
     * @param {number} duration - 显示时长（毫秒），0表示不自动关闭
     */
    showConnectionStatus(message, type = 'info', duration = 3000) {
        // 移除旧的提示
        const oldToast = document.getElementById('connection-toast');
        if (oldToast) {
            oldToast.remove();
        }

        // 创建新提示
        const toast = document.createElement('div');
        toast.id = 'connection-toast';
        toast.className = `connection-toast connection-toast-${type}`;
        
        // 图标映射
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // 添加样式（如果还没有）
        if (!document.getElementById('connection-toast-style')) {
            const style = document.createElement('style');
            style.id = 'connection-toast-style';
            style.textContent = `
                .connection-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                    animation: slideDown 0.3s ease;
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                .connection-toast-success {
                    background: #10b981;
                    color: white;
                }
                
                .connection-toast-warning {
                    background: #f59e0b;
                    color: white;
                }
                
                .connection-toast-error {
                    background: #ef4444;
                    color: white;
                }
                
                .connection-toast-info {
                    background: #3b82f6;
                    color: white;
                }
                
                .toast-icon {
                    font-size: 18px;
                }
                
                .toast-message {
                    flex: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideDown 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
}

// 导出到全局
window.GlobalSocketManager = GlobalSocketManager;
