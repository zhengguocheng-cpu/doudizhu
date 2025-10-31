// 斗地主游戏房间客户端 - 简化版
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
     * 从URL参数获取用户信息（统一认证管理）- 简化版
     */
    initializeFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const playerName = urlParams.get('playerName');
        const playerAvatar = urlParams.get('playerAvatar');

        if (!roomId || !playerName) {
            alert('缺少房间或玩家信息，请从大厅进入房间');
            this.backToLobby();
            return;
        }

        // 注释掉认证状态检查，直接初始化
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
        //     }

        // } else {
        //     console.log('❌ 无全局认证状态，跳转到登录页面');
        //     alert('登录已过期，请重新登录');
        //     window.location.href = '/login/index.html';
        //     return;
        // }

        // 简化认证检查，直接初始化
        console.log('✅ 跳过认证检查，直接初始化房间');

        // 完成房间页面初始化
        this.completeRoomInitialization(roomId, playerName, playerAvatar);
    }

    /**
     * 完成房间页面初始化 - 简化版
     */
    completeRoomInitialization(roomId, playerName, playerAvatar) {
        // 注释掉认证验证
        // if (this.socketManager.userName !== playerName) {
        //     console.error('玩家信息不匹配，URL:', playerName, '认证状态:', this.socketManager.userName);
        //     alert('玩家信息验证失败，请重新登录');
        //     window.location.href = '/login/index.html';
        //     return;
        // }

        // 简化初始化，直接设置用户信息
        this.currentPlayer = playerName;
        this.currentPlayerId = playerName; // 使用用户名作为ID
        this.currentRoom = { id: roomId, name: '房间 ' + roomId };

        // 设置房间管理器状态（可选，用于UI显示）
        if (playerAvatar) {
            this.playerAvatar = decodeURIComponent(playerAvatar);
        }

        // 连接到服务器
        this.connectToServer();

        console.log('房间页面初始化用户信息:', {
            playerName: this.currentPlayer,
            roomId: roomId,
            socketId: this.socketManager.socket?.id
        });
    }

    /**
     * 连接到服务器（使用已认证的Socket连接）- 简化版
     */
    connectToServer() {
        try {
            // 获取全局Socket管理器的Socket连接
            this.socket = this.socketManager.socket;

            if (!this.socket) {
                console.error('Socket连接不存在');
                alert('连接错误，请重新登录');
                window.location.href = '/login/index.html';
                return;
            }

            // 注释掉认证属性设置
            // if (!this.socket.authenticated) {
            //     this.socket.authenticated = true;
            //     this.socket.userId = this.socketManager.userId;
            //     this.socket.userName = this.socketManager.userName;
            //     this.socket.sessionId = this.socketManager.sessionId;
            //     this.socket.user = { name: this.socketManager.userName };
            // }

            // 设置Socket认证属性（简化版）
            if (this.socket) {
                this.socket.authenticated = true;
                this.socket.userId = this.currentPlayerId;
                this.socket.userName = this.currentPlayer;
                this.socket.user = { name: this.currentPlayer };
            }

            console.log('房间页面使用Socket连接:', {
                socketId: this.socket.id,
                authenticated: this.socket.authenticated,
                userId: this.socket.userId,
                userName: this.socket.userName
            });

            // 显示房间号
            const roomIdElement = document.getElementById('currentRoomId');
            if (roomIdElement && this.currentRoom) {
                roomIdElement.textContent = this.currentRoom.id;
            }

            // 更新连接状态
            this.updateConnectionStatus(true);

            // 直接加入房间
            this.joinRoom();

            // 设置事件监听器
            this.setupSocketEventListeners();

        } catch (error) {
            console.error('房间连接失败:', error);
        }
    }

    /**
     * 设置Socket事件监听器
     */
    setupSocketEventListeners() {
        // 房间相关事件
        this.socket.on('room_joined', (data) => {
            this.onRoomJoined(data);
        });

        this.socket.on('room_left', (data) => {
            this.onRoomLeft(data);
        });

        this.socket.on('player_joined', (data) => {
            this.onPlayerJoined(data);
        });

        this.socket.on('player_left', (data) => {
            this.onPlayerLeft(data);
        });

        this.socket.on('error', (error) => {
            console.error('房间连接错误:', error);
        });

        // 房间状态更新事件（从大厅广播）
        this.socket.on('rooms_updated', (data) => {
            this.onRoomsUpdated(data);
        });

        // 游戏相关事件
        this.socket.on('cards_dealt', (data) => {
            this.onCardsDealt(data);
        });

        this.socket.on('game_state_updated', (data) => {
            this.onGameStateUpdated(data);
        });

        this.socket.on('turn_changed', (data) => {
            this.onTurnChanged(data);
        });

        this.socket.on('cards_played', (data) => {
            this.onCardsPlayed(data);
        });

        this.socket.on('game_ended', (data) => {
            this.onGameEnded(data);
        });

        // 聊天消息监听
        this.socket.on('message_received', (data) => {
            this.onMessageReceived(data);
        });

        // 连接状态监听
        this.socket.on('connect', () => {
            console.log('Socket重新连接');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket断开连接');
            this.updateConnectionStatus(false);
        });
    }

    /**
     * 绑定UI事件监听器
     */
    bindEvents() {
        // 绑定聊天发送按钮
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');

        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => {
                const message = chatInput ? chatInput.value : '';
                this.sendMessage(message);
                if (chatInput) chatInput.value = '';
            });
        }

        // 绑定回车键发送消息
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const message = chatInput.value;
                    this.sendMessage(message);
                    chatInput.value = '';
                }
            });
        }

        // 绑定其他UI事件
        const startGameBtn = document.getElementById('startGameBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        const playCardsBtn = document.getElementById('playCardsBtn');
        const passBtn = document.getElementById('passBtn');
        const hintBtn = document.getElementById('hintBtn');

        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.socket.emit('start_game', {
                    roomId: this.currentRoom.id,
                    userId: this.currentPlayerId
                });
                this.addMessage('请求开始游戏', 'info');
            });
        }

        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.backToLobby();
            });
        }

        if (playCardsBtn) {
            playCardsBtn.addEventListener('click', () => {
                this.playCards();
            });
        }

        if (passBtn) {
            passBtn.addEventListener('click', () => {
                this.passTurn();
            });
        }

        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.addMessage('提示功能开发中...', 'info');
            });
        }

        // 添加测试聊天消息按钮（仅开发模式）
        if (document.getElementById('debugPanel')) {
            const testChatBtn = document.createElement('button');
            testChatBtn.textContent = '测试聊天';
            testChatBtn.style.cssText = 'margin: 2px; padding: 2px 5px; font-size: 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;';
            testChatBtn.onclick = () => {
                this.addMessageToChat('测试用户', '这是一条测试聊天消息', new Date());
            };
            document.getElementById('debugPanel').appendChild(testChatBtn);
        }
    }

    /**
     * 加入房间（简化版）
     */
    joinRoom() {
        console.log('发送加入房间请求:', this.currentRoom.id);

        const success = this.socketManager.joinGame({
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            playerName: this.currentPlayer
        });

        if (success) {
            console.log('房间加入请求已发送');
        } else {
            console.error('房间加入失败：Socket连接错误');
        }
    }

    /**
     * 房间加入成功处理
     */
    onRoomJoined(data) {
        console.log('成功加入房间:', data);
        this.currentRoom = data.room;

        // 显示房间操作按钮
        this.showRoomActions();

        // 绑定事件监听器
        this.bindEvents();
    }

    /**
     * 房间离开处理
     */
    onRoomLeft(data) {
        console.log('离开房间:', data);
        this.currentRoom = null;
        this.backToLobby();
    }

    /**
     * 玩家加入处理
     */
    onPlayerJoined(data) {
        console.log('玩家加入:', data);
        if (data.playerName !== this.currentPlayer) {
            this.addMessage(`玩家 ${data.playerName} 加入了房间`, 'info');
        }
    }

    /**
     * 玩家离开处理
     */
    onPlayerLeft(data) {
        console.log('玩家离开:', data);
        this.addMessage(`玩家 ${data.playerName} 离开了房间`, 'info');
    }

    /**
     * 发牌处理
     */
    onCardsDealt(data) {
        console.log('收到发牌:', data);
        if (data.playerId === this.currentPlayerId) {
            this.playerHand = data.cards;
            this.gameStarted = true;
            this.renderPlayerHand();
            this.addMessage(`游戏开始，您获得了 ${data.cards.length} 张牌`, 'success');

            // 隐藏房间操作按钮，显示游戏操作按钮
            this.hideRoomActions();
            this.showGameActions();

            if (data.gameState && data.gameState.currentPlayer === this.currentPlayerId) {
                this.isMyTurn = true;
            }
        }
    }

    /**
     * 游戏状态更新
     */
    onGameStateUpdated(data) {
        console.log('游戏状态更新:', data);
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
    onRoomsUpdated(data) {
        console.log('房间状态更新:', data.eventType, data.roomId);

        // 更新当前房间信息
        if (this.currentRoom && data.roomId === this.currentRoom.id) {
            // 根据事件类型处理不同的更新
            switch(data.eventType) {
                case 'game_started':
                    this.gameStarted = true;
                    this.addMessage('游戏开始！', 'success');
                    this.hideRoomActions();
                    this.showGameActions();
                    break;

                case 'game_ended':
                    this.gameStarted = false;
                    this.isMyTurn = false;
                    this.hideGameActions();
                    this.showRoomActions();
                    this.addMessage('游戏结束，返回房间模式', 'info');
                    break;

                case 'player_joined':
                    // 玩家加入已在专门的player_joined事件中处理
                    break;

                case 'player_left':
                    // 玩家离开已在专门的player_left事件中处理
                    break;

                default:
                    // 其他事件类型不需要特殊处理
                    break;
            }
        }
    }

    /**
     * 游戏结束处理
     */
    onGameEnded(data) {
        console.log('游戏结束:', data);
        this.gameStarted = false;
        this.isMyTurn = false;
        this.hideGameActions();

        const winnerName = data.winner?.name || '未知玩家';
        this.addMessage(`游戏结束！${winnerName} 获胜！`, 'success');

        // 显示房间操作按钮
        this.showRoomActions();
    }

    /**
     * 更新连接状态
     */
    updateConnectionStatus(connected) {
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = connected ? '已连接' : '未连接';
            connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        }
    }

    /**
     * 显示房间操作按钮
     */
    showRoomActions() {
        const gameControlsOverlay = document.getElementById('gameControlsOverlay');
        const roomActions = document.getElementById('roomActions');
        const gameActions = document.getElementById('gameActions');

        if (gameControlsOverlay) gameControlsOverlay.style.display = 'flex';
        if (roomActions) roomActions.style.display = 'flex';
        if (gameActions) gameActions.style.display = 'none';
    }

    /**
     * 隐藏房间操作按钮
     */
    hideRoomActions() {
        const roomActions = document.getElementById('roomActions');
        const gameControlsOverlay = document.getElementById('gameControlsOverlay');

        if (roomActions) roomActions.style.display = 'none';
        if (gameControlsOverlay) gameControlsOverlay.style.display = 'none';
    }

    /**
     * 显示游戏操作按钮
     */
    showGameActions() {
        const gameActions = document.getElementById('gameActions');
        const gameControlsOverlay = document.getElementById('gameControlsOverlay');

        if (gameControlsOverlay) gameControlsOverlay.style.display = 'flex';
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
        const playerHandContainer = document.getElementById('playerHand');
        if (!playerHandContainer) return;

        playerHandContainer.innerHTML = '';

        if (!this.playerHand || this.playerHand.length === 0) {
            playerHandContainer.innerHTML = '<div class="no-cards">等待发牌...</div>';
            return;
        }

        this.playerHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card;
            cardElement.dataset.index = index;

            cardElement.addEventListener('click', () => this.toggleCardSelection(cardElement));

            playerHandContainer.appendChild(cardElement);
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
        const playerHandContainer = document.getElementById('playerHand');
        if (!playerHandContainer) return;

        const selectedCards = playerHandContainer.querySelectorAll('.card.selected');
        if (!selectedCards || selectedCards.length === 0) {
            this.addMessage('请选择要出的牌', 'warning');
            return;
        }

        const cards = Array.from(selectedCards).map(card => card.textContent);

        this.socket.emit('play_cards', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            cards: cards
        });

        selectedCards.forEach(card => card.classList.remove('selected'));
        this.addMessage(`出了 ${cards.join(', ')}`, 'info');
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

        this.addMessage('选择不出牌', 'info');
        this.hideGameActions();
    }

    /**
     * 添加消息
     */
    addMessage(message, type = 'info') {
        const messageLog = document.getElementById('roomMessageLog');
        if (!messageLog) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.innerHTML = `
            <span class="time">${new Date().toLocaleTimeString()}</span>
            <span class="player">系统</span>
            <span class="message">${message}</span>
        `;

        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight;
    }

    /**
     * 接收到聊天消息处理
     */
    onMessageReceived(data) {
        console.log('收到聊天消息:', data);
        const playerName = data.playerName || '未知玩家';
        const message = data.message || '';
        const timestamp = data.timestamp || new Date();

        // 添加消息到聊天栏
        this.addMessageToChat(playerName, message, timestamp);
    }

    /**
     * 添加消息到聊天栏
     */
    addMessageToChat(playerName, message, timestamp) {
        const messageLog = document.getElementById('roomMessageLog');
        if (!messageLog) {
            console.error('聊天消息容器未找到');
            console.error('查找的元素ID: roomMessageLog');
            console.error('页面中的所有div元素:', document.querySelectorAll('div'));
            return;
        }

        console.log('找到聊天消息容器:', messageLog);
        console.log('容器尺寸:', {
            width: messageLog.offsetWidth,
            height: messageLog.offsetHeight,
            scrollHeight: messageLog.scrollHeight
        });

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';

        const timeStr = timestamp instanceof Date ? timestamp.toLocaleTimeString() :
                       new Date(timestamp).toLocaleTimeString();

        messageElement.innerHTML = `
            <span class="time">${timeStr}</span>
            <span class="player">${playerName}</span>
            <span class="message">${message}</span>
        `;

        console.log('创建消息元素:', messageElement);
        console.log('消息元素内容:', messageElement.innerHTML);

        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight;

        console.log('消息已添加到聊天栏:', {
            playerName: playerName,
            message: message,
            time: timeStr,
            totalMessages: messageLog.children.length
        });

        // 强制重新计算样式
        messageLog.style.display = 'none';
        messageLog.offsetHeight; // 触发重排
        messageLog.style.display = '';
    }

    /**
     * 发送聊天消息
     */
    sendMessage(message) {
        if (!message || message.trim().length === 0) {
            return;
        }

        console.log('发送聊天消息:', message);

        this.socket.emit('send_message', {
            roomId: this.currentRoom.id,
            message: message.trim(),
            userId: this.currentPlayerId,
            userName: this.currentPlayer
        });

        // 本地也显示自己的消息（不再需要，因为后端会广播给自己）
        // this.addMessageToChat(this.currentPlayer, message.trim(), new Date());
    }
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    new DoudizhuRoomClient();
});

// 头像生成工具函数
function generateRandomAvatar() {
    const avatarTypes = [
        // 数字头像
        () => {
            const numbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
            return numbers[Math.floor(Math.random() * numbers.length)];
        },
        // 动物头像
        () => {
            const animals = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸'];
            return animals[Math.floor(Math.random() * animals.length)];
        },
        // 水果头像
        () => {
            const fruits = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍'];
            return fruits[Math.floor(Math.random() * fruits.length)];
        },
        // 表情头像
        () => {
            const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃'];
            return emojis[Math.floor(Math.random() * emojis.length)];
        }
    ];

    return avatarTypes[Math.floor(Math.random() * avatarTypes.length)]();
}

function getRandomAvatar() {
    let avatar;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        avatar = generateRandomAvatar();
        attempts++;
    } while (window.doudizhuClient && window.doudizhuClient.usedAvatars.has(avatar) && attempts < maxAttempts);

    if (window.doudizhuClient) {
        window.doudizhuClient.usedAvatars.add(avatar);
    }

    return avatar;
}
