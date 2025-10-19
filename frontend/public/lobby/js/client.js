// 斗地主游戏客户端
class DoudizhuClient {
    constructor() {
        this.socket = null;
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.currentRoom = null;
        this.isConnected = false;

        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.connectionStatus = document.getElementById('connectionStatus');
        this.loginSection = document.getElementById('loginSection');
        this.gameLobby = document.getElementById('gameLobby');
        this.playerNameInput = document.getElementById('playerName');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.currentPlayerNameSpan = document.getElementById('currentPlayerName');
        this.roomList = document.getElementById('roomList');
        this.refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
        this.roomNameInput = document.getElementById('roomName');
        this.maxPlayersSelect = document.getElementById('maxPlayers');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.messageLog = document.getElementById('messageLog');
    }

    bindEvents() {
        this.loginBtn.addEventListener('click', () => this.login());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.refreshRoomsBtn.addEventListener('click', () => this.loadRoomList());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
    }

    addMessage(message, type = 'info') {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.messageLog.appendChild(logItem);
        this.messageLog.scrollTop = this.messageLog.scrollHeight;
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        this.connectionStatus.textContent = connected ? '已连接' : '未连接';
        this.connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    }

    async login() {
        const playerName = this.playerNameInput.value.trim();
        if (!playerName) {
            alert('请输入玩家名称');
            return;
        }

        try {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                this.updateConnectionStatus(true);
                this.currentPlayer = playerName;
                this.currentPlayerNameSpan.textContent = playerName;
                this.loginSection.style.display = 'none';
                this.gameLobby.style.display = 'block';
                this.addMessage(`成功连接到服务器，欢迎 ${playerName}!`, 'success');
                this.loadRoomList();
            });

            this.socket.on('disconnect', () => {
                this.updateConnectionStatus(false);
                this.addMessage('与服务器断开连接', 'error');
                if (this.currentRoom && this.socket) {
                    this.socket.emit('leave_game', {
                        roomId: this.currentRoom.id,
                        playerName: this.currentPlayer
                    });
                }
                this.currentRoom = null;
                this.currentPlayerId = null;
            });

            this.socket.on('room_joined', (data) => {
                this.addMessage(`成功加入房间 "${data.room.name}"`, 'success');
                this.currentRoom = data.room;
            });

            this.socket.on('room_left', (data) => {
                this.addMessage(`离开房间 "${data.room.name}"`, 'info');
                this.currentRoom = null;
            });

            this.socket.on('player_ready', (data) => {
                this.addMessage(`玩家 "${data.playerName}" 已准备`, 'info');
            });

            this.socket.on('game_started', (data) => {
                this.addMessage('游戏开始!', 'success');
            });

            this.socket.on('cards_played', (data) => {
                this.addMessage(`玩家 ${data.playerId} 出牌: ${data.cards.join(', ')}`, 'info');
            });

            this.socket.on('player_joined', (data) => {
                this.addMessage(`新玩家加入游戏: ${data.playerId}`, 'info');
            });

            this.socket.on('player_left', (data) => {
                this.addMessage(`玩家离开游戏: ${data.playerId}`, 'info');
            });

        } catch (error) {
            this.addMessage(`连接失败: ${error.message}`, 'error');
        }
    }

    logout() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.currentPlayer = null;
        this.loginSection.style.display = 'block';
        this.gameLobby.style.display = 'none';
        this.updateConnectionStatus(false);
        this.addMessage('已登出', 'info');
    }

    async loadRoomList() {
        try {
            const response = await fetch('http://localhost:3000/api/games/rooms');
            const result = await response.json();
            if (result.success) {
                console.log('获取房间列表成功', result.data);
                this.displayRoomList(result.data);
            } else {
                this.addMessage(`获取房间列表失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addMessage(`网络错误: ${error.message}`, 'error');
        }
    }

    displayRoomList(rooms) {
        if (rooms.length === 0) {
            this.roomList.innerHTML = '<div class="loading">暂无房间</div>';
            return;
        }

        this.roomList.innerHTML = '';

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

            this.roomList.appendChild(roomElement);
        });

        // 为所有加入房间按钮添加事件监听器
        const joinButtons = this.roomList.querySelectorAll('.join-room-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const roomId = e.target.getAttribute('data-room-id');
                this.joinRoom(roomId);
            });
        });
    }

    async createRoom() {
        const roomName = this.roomNameInput.value.trim();
        const maxPlayers = parseInt(this.maxPlayersSelect.value);

        if (!roomName) {
            alert('请输入房间名称');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/games/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: roomName,
                    maxPlayers: maxPlayers
                })
            });

            const result = await response.json();

            if (result.success) {
                this.addMessage(`房间 "${roomName}" 创建成功`, 'success');
                this.roomNameInput.value = '';
                this.loadRoomList();
            } else {
                this.addMessage(`创建房间失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addMessage(`网络错误: ${error.message}`, 'error');
        }
    }

    async joinRoom(roomId) {
        if (!this.currentPlayer) {
            alert('请先登录');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/games/rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: this.currentPlayer,
                    socketId: this.socket.id
                })
            });

            const result = await response.json();

            if (result.success) {
                // 通过Socket.IO加入房间
                this.socket.emit('join_game', {
                    roomId: roomId,
                    playerName: this.currentPlayer
                });

                this.currentRoom = {
                    id: roomId,
                    name: result.data?.name || '未知房间',
                    players: result.data?.players || []
                };

                // 找到当前玩家的ID
                const currentPlayer = this.currentRoom.players.find(p => p.name === this.currentPlayer);
                if (currentPlayer) {
                    this.currentPlayerId = currentPlayer.id;
                } else {
                    // 如果没找到，通过名称匹配，使用socket.id作为备用
                    this.currentPlayerId = this.socket.id;
                }

                // 跳转到房间页面
                window.location.href = `/room/room.html?roomId=${roomId}&playerName=${encodeURIComponent(this.currentPlayer)}&playerId=${this.currentPlayerId}`;
            } else {
                this.addMessage(`加入房间失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addMessage(`网络错误: ${error.message}`, 'error');
        }
    }
}

// 创建客户端实例
const client = new DoudizhuClient();

// 页面加载完成后初始化
window.addEventListener('load', () => {
    console.log('大厅页面加载完成');
});
