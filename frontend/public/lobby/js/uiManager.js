/**
 * UI管理器 - 处理所有DOM操作和UI更新
 */
class UIManager {
    constructor() {
        this.elements = {};
        this.onRoomJoin = null;
        this.initializeElements();
    }

    /**
     * 初始化所有DOM元素引用
     */
    initializeElements() {
        this.elements = {
            connectionStatus: document.getElementById('connectionStatus'),
            currentPlayerNameSpan: document.getElementById('currentPlayerName'),
            playerAvatarSpan: document.getElementById('playerAvatar'),
            profileBtn: document.getElementById('profileBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            roomList: document.getElementById('roomList'),
            refreshRoomsBtn: document.getElementById('refreshRoomsBtn'),
            quickJoinBtn: document.getElementById('quickJoinBtn'),
            myRoomsBtn: document.getElementById('myRoomsBtn'),
            messageLog: document.getElementById('messageLog')
        };
    }

    /**
     * 绑定所有UI事件
     */
    bindEvents(eventHandlers) {
        if (this.elements.profileBtn) {
            this.elements.profileBtn.addEventListener('click', eventHandlers.onProfile);
        }
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', eventHandlers.onLogout);
        }
        if (this.elements.refreshRoomsBtn) {
            this.elements.refreshRoomsBtn.addEventListener('click', eventHandlers.onRefreshRooms);
        }
        if (this.elements.quickJoinBtn) {
            this.elements.quickJoinBtn.addEventListener('click', eventHandlers.onQuickJoin);
        }
        if (this.elements.myRoomsBtn) {
            this.elements.myRoomsBtn.addEventListener('click', eventHandlers.onMyRooms);
        }
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(connected) {
        if (!this.elements.connectionStatus) return;

        this.elements.connectionStatus.textContent = connected ? '已连接' : '未连接';
        this.elements.connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    }

    /**
     * 设置当前玩家名称显示
     */
    setCurrentPlayerName(playerName) {
        if (this.elements.currentPlayerNameSpan) {
            this.elements.currentPlayerNameSpan.textContent = playerName;
        }
    }

    /**
     * 设置玩家头像显示
     */
    setPlayerAvatar(avatar) {
        if (this.elements.playerAvatarSpan) {
            this.elements.playerAvatarSpan.textContent = avatar;
        }
    }

    /**
     * 显示房间列表
     */
    displayRoomList(rooms) {
        if (!this.elements.roomList) return;

        console.log('显示房间列表，房间数量:', rooms.length);
        console.log('房间数据:', rooms);

        if (rooms.length === 0) {
            this.elements.roomList.innerHTML = '<div class="loading">暂无房间</div>';
            return;
        }

        this.elements.roomList.innerHTML = '';

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';

            roomElement.innerHTML = `
                <h4>${room.name}</h4>
                <div class="room-info">
                    <p>房间ID: ${room.id}</p>
                    <p>最大玩家数: ${room.maxPlayers}</p>
                    <p>当前玩家数: ${room.players.length}</p>
                    <p>状态: ${room.status}</p>
                </div>
                <div class="room-actions">
                    <button class="btn btn-primary join-room-btn" data-room-id="${room.id}">加入房间</button>
                </div>
            `;

            this.elements.roomList.appendChild(roomElement);
        });

        // 为所有加入房间按钮添加事件监听器
        const joinButtons = this.elements.roomList.querySelectorAll('.join-room-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                if (this.onRoomJoin) {
                    this.onRoomJoin(roomId);
                }
            });
        });
    }

    /**
     * 设置房间加入回调
     */
    setRoomJoinHandler(handler) {
        this.onRoomJoin = handler;
    }

    /**
     * 添加消息到日志
     */
    addMessage(message, type = 'info') {
        if (!this.elements.messageLog) return;

        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.elements.messageLog.appendChild(logItem);
        this.elements.messageLog.scrollTop = this.elements.messageLog.scrollHeight;
    }

    /**
     * 添加成功消息
     */
    addSuccess(message) {
        this.addMessage(message, 'success');
    }

    /**
     * 添加错误消息
     */
    addError(message) {
        this.addMessage(message, 'error');
    }

    /**
     * 添加信息消息
     */
    addInfo(message) {
        this.addMessage(message, 'info');
    }

    /**
     * 添加警告消息
     */
    addWarning(message) {
        this.addMessage(message, 'warning');
    }

    /**
     * 清空房间列表
     */
    clearRoomList() {
        if (this.elements.roomList) {
            this.elements.roomList.innerHTML = '<div class="loading">加载中...</div>';
        }
    }
}

// 导出到全局
window.UIManager = UIManager;
