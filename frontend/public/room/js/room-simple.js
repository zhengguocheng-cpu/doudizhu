// 斗地主游戏房间客户端 - 极简版
class DoudizhuRoomClient {
    constructor() {
        this.socketManager = window.GlobalSocketManager.getInstance();
        this.socket = null;
        this.currentRoom = null;
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.playerHand = [];
        this.gameStarted = false;
        this.isMyTurn = false;

        // 从URL获取用户信息
        this.initializeFromUrl();
        this.connectToServer();
    }

    /**
     * 从URL参数获取用户信息（极简版）
     */
    initializeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const playerName = urlParams.get('playerName');

        if (!roomId || !playerName) {
            alert('缺少房间或玩家信息，请从大厅进入房间');
            this.backToLobby();
            return;
        }

        // 用户名就是唯一标识
        this.currentPlayer = playerName;
        this.currentPlayerId = playerName;
        this.currentRoom = { id: roomId };

        // 设置全局状态
        this.socketManager.userName = playerName;
        this.socketManager.userId = playerName;
        this.socketManager.authenticated = true;

        console.log('房间初始化:', { playerName, roomId });
    }

    /**
     * 连接到服务器（极简版）
     */
    connectToServer() {
        this.socket = this.socketManager.connect();

        // 连接成功后加入房间
        this.socket.on('connect', () => {
            console.log('房间连接成功');

            // 显示房间号
            const roomIdElement = document.getElementById('currentRoomId');
            if (roomIdElement) {
                roomIdElement.textContent = this.currentRoom.id;
            }

            // 直接加入房间
            this.joinRoom();
        });

        // 房间事件
        this.socket.on('room_joined', (data) => this.onRoomJoined(data));
        this.socket.on('room_left', (data) => this.onRoomLeft(data));
        this.socket.on('player_joined', (data) => this.onPlayerJoined(data));
        this.socket.on('player_left', (data) => this.onPlayerLeft(data));

        // 游戏事件
        this.socket.on('cards_dealt', (data) => this.onCardsDealt(data));
        this.socket.on('game_state_updated', (data) => this.onGameStateUpdated(data));
        this.socket.on('turn_changed', (data) => this.onTurnChanged(data));
        this.socket.on('cards_played', (data) => this.onCardsPlayed(data));
        this.socket.on('game_ended', (data) => this.onGameEnded(data));

        // 聊天消息监听
        this.socket.on('message_received', (data) => this.onMessageReceived(data));

        // 连接成功后绑定事件
        this.socket.on('connect', () => {
            this.bindEvents();
        });
    }

    /**
     * 绑定UI事件监听器
     */
    bindEvents() {
        // 绑定开始游戏按钮
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.socket.emit('start_game', {
                    roomId: this.currentRoom.id,
                    userId: this.currentPlayerId
                });
                this.addMessage('请求开始游戏');
            });
        }

        // 绑定离开房间按钮
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.backToLobby();
            });
        }

        // 绑定出牌按钮
        const playCardsBtn = document.getElementById('playCardsBtn');
        if (playCardsBtn) {
            playCardsBtn.addEventListener('click', () => {
                this.playCards();
            });
        }

        // 绑定不出按钮
        const passBtn = document.getElementById('passBtn');
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                this.passTurn();
            });
        }

        // 绑定提示按钮
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.addMessage('提示功能开发中...');
            });
        }

        // 绑定聊天发送按钮
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');
        if (sendChatBtn && chatInput) {
            sendChatBtn.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message) {
                    this.sendMessage(message);
                    chatInput.value = '';
                }
            });

            // 绑定回车键发送
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const message = chatInput.value.trim();
                    if (message) {
                        this.sendMessage(message);
                        chatInput.value = '';
                    }
                }
            });
        }
    }

    /**
     * 接收聊天消息
     */
    onMessageReceived(data) {
        const playerName = data.playerName || '未知玩家';
        const message = data.message || '';
        this.addMessage(`${playerName}: ${message}`);
    }

    /**
     * 发送聊天消息
     */
    sendMessage(message) {
        this.socket.emit('send_message', {
            roomId: this.currentRoom.id,
            message: message,
            userId: this.currentPlayerId,
            userName: this.currentPlayer
        });
    }

    /**
     * 加入房间
     */
    joinRoom() {
        const success = this.socketManager.joinGame({
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            playerName: this.currentPlayer
        });

        if (success) {
            console.log('加入房间请求已发送');
        } else {
            console.error('加入房间失败');
        }
    }

    /**
     * 房间加入成功
     */
    onRoomJoined(data) {
        this.currentRoom = data.room;
        this.showRoomActions();

        // 绑定事件监听器
        this.bindEvents();
    }

    /**
     * 房间离开
     */
    onRoomLeft(data) {
        this.backToLobby();
    }

    /**
     * 玩家加入
     */
    onPlayerJoined(data) {
        if (data.playerName !== this.currentPlayer) {
            this.addMessage(`玩家 ${data.playerName} 加入了房间`);
        }
    }

    /**
     * 玩家离开
     */
    onPlayerLeft(data) {
        this.addMessage(`玩家 ${data.playerName} 离开了房间`);
    }

    /**
     * 发牌
     */
    onCardsDealt(data) {
        if (data.playerId === this.currentPlayerId) {
            this.playerHand = data.cards;
            this.gameStarted = true;
            this.renderPlayerHand();
            this.addMessage(`游戏开始，您获得了 ${data.cards.length} 张牌`);

            this.hideRoomActions();
            this.showGameActions();
        }
    }

    /**
     * 游戏状态更新
     */
    onGameStateUpdated(data) {
        if (data.gameState) {
            if (data.gameState.currentPlayer === this.currentPlayerId) {
                this.isMyTurn = true;
                this.showGameActions();
            } else {
                this.isMyTurn = false;
                this.hideGameActions();
            }
        }
    }

    /**
     * 轮次改变
     */
    onTurnChanged(data) {
        if (data.nextPlayerId === this.currentPlayerId) {
            this.isMyTurn = true;
            this.showGameActions();
            this.addMessage('轮到你出牌了');
        } else {
            this.isMyTurn = false;
            this.hideGameActions();
        }
    }

    /**
     * 出牌
     */
    onCardsPlayed(data) {
        if (data.playerId !== this.currentPlayerId) {
            this.addMessage(`${data.playerName} 出了 ${data.cards.length} 张牌`);
        }
    }

    /**
     * 游戏结束
     */
    onGameEnded(data) {
        this.gameStarted = false;
        this.isMyTurn = false;
        this.hideGameActions();

        const winnerName = data.winner?.name || '未知玩家';
        this.addMessage(`游戏结束！${winnerName} 获胜！`);

        this.showRoomActions();
    }

    /**
     * 显示房间操作按钮
     */
    showRoomActions() {
        const overlay = document.getElementById('gameControlsOverlay');
        const roomActions = document.getElementById('roomActions');
        const gameActions = document.getElementById('gameActions');

        if (overlay) overlay.style.display = 'flex';
        if (roomActions) roomActions.style.display = 'flex';
        if (gameActions) gameActions.style.display = 'none';
    }

    /**
     * 隐藏房间操作按钮
     */
    hideRoomActions() {
        const roomActions = document.getElementById('roomActions');
        const overlay = document.getElementById('gameControlsOverlay');

        if (roomActions) roomActions.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
    }

    /**
     * 显示游戏操作按钮
     */
    showGameActions() {
        const gameActions = document.getElementById('gameActions');
        const overlay = document.getElementById('gameControlsOverlay');

        if (overlay) overlay.style.display = 'flex';
        if (gameActions) gameActions.style.display = 'flex';
    }

    /**
     * 隐藏游戏操作按钮
     */
    hideGameActions() {
        const gameActions = document.getElementById('gameActions');
        if (gameActions) gameActions.style.display = 'none';
    }

    /**
     * 渲染手牌
     */
    renderPlayerHand() {
        const container = document.getElementById('playerHand');
        if (!container) return;

        container.innerHTML = '';

        if (!this.playerHand || this.playerHand.length === 0) {
            container.innerHTML = '<div class="no-cards">等待发牌...</div>';
            return;
        }

        this.playerHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card;
            cardElement.dataset.index = index;

            cardElement.addEventListener('click', () => this.toggleCardSelection(cardElement));

            container.appendChild(cardElement);
        });
    }

    /**
     * 切换卡牌选择
     */
    toggleCardSelection(cardElement) {
        cardElement.classList.toggle('selected');
    }

    /**
     * 出牌
     */
    playCards() {
        const container = document.getElementById('playerHand');
        if (!container) return;

        const selectedCards = container.querySelectorAll('.card.selected');
        if (selectedCards.length === 0) {
            this.addMessage('请选择要出的牌');
            return;
        }

        const cards = Array.from(selectedCards).map(card => card.textContent);

        this.socket.emit('play_cards', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            cards: cards
        });

        selectedCards.forEach(card => card.classList.remove('selected'));
        this.addMessage(`出了 ${cards.join(', ')}`);
        this.hideGameActions();
    }

    /**
     * 不出牌
     */
    passTurn() {
        this.socket.emit('pass_turn', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId
        });

        this.addMessage('选择不出牌');
        this.hideGameActions();
    }

    /**
     * 添加消息
     */
    addMessage(message) {
        const messageLog = document.getElementById('roomMessageLog');
        if (!messageLog) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="time">${new Date().toLocaleTimeString()}</span>
            <span class="player">系统</span>
            <span class="message">${message}</span>
        `;

        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight;
    }

    /**
     * 返回大厅
     */
    backToLobby() {
        window.location.href = '/lobby/index.html';
    }
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    new DoudizhuRoomClient();
});
