// 斗地主游戏房间客户端
class DoudizhuRoomClient {
    constructor() {
        this.socket = null;
        this.topLeftPlayerId = null; // 顶部左侧玩家ID
        this.topRightPlayerId = null; // 顶部右侧玩家ID
        this.usedAvatars = new Set(); // 已使用的头像，避免重复
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.currentRoom = null;
        this.isConnected = false;
        this.playerHand = []; // 当前玩家的手牌
        this.gameState = null; // 游戏状态
        this.isMyTurn = false; // 是否轮到我出牌
        this.gameStarted = false; // 游戏是否已开始

        // 页面加载时立即显示调试信息
        this.addMessage('[DEBUG] 页面加载完成，正在初始化游戏客户端...', 'debug');
        this.addMessage('[DEBUG] 正在连接到服务器...', 'debug');

        this.initializeElements();
        this.bindEvents();
        this.connectToServer();

        // 初始化时设置牌数显示为等待发牌状态
        this.setCardCountDisplay('topLeftCardCount', '等待发牌...');
        this.setCardCountDisplay('topRightCardCount', '等待发牌...');
        this.setCardCountDisplay('currentPlayerCardCount', '等待发牌...');

        // 为当前玩家分配头像
        this.setPlayerAvatar('currentPlayer', '👑');
        this.usedAvatars.add('👑');

        // 添加一些默认头像到已使用集合中（避免与其他玩家重复）
        this.usedAvatars.add('🎲');
        this.usedAvatars.add('🎯');
    }

    initializeElements() {
        // 获取DOM元素
        this.connectionStatus = document.getElementById('connectionStatus');
        this.roomNameDisplay = document.getElementById('roomNameDisplay');
        this.roomIdDisplay = document.getElementById('roomIdDisplay');
        this.currentRoomId = document.getElementById('currentRoomId');
        this.exitGameBtn = document.getElementById('exitGameBtn');

        // 玩家位置元素
        this.topLeftPlayer = document.getElementById('topLeftPlayer');
        this.topRightPlayer = document.getElementById('topRightPlayer');
        this.currentPlayerPosition = document.getElementById('currentPlayerPosition');
        this.currentPlayerNameDisplay = document.getElementById('currentPlayerNameDisplay');
        this.topLeftPlayerName = document.getElementById('topLeftPlayerName');
        this.topRightPlayerName = document.getElementById('topRightPlayerName');

        // 操作按钮
        this.playCardsBtn = document.getElementById('playCardsBtn');
        this.playCardsBtn2 = document.getElementById('playCardsBtn2');
        this.playCardsBtn3 = document.getElementById('playCardsBtn3');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.leaveRoomBtn = document.getElementById('leaveRoomBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.exitGameBtn = document.getElementById('exitGameBtn');
        this.roomActions = document.getElementById('roomActions');
        this.gameActions = document.getElementById('gameActions');
        this.gameControlsOverlay = document.getElementById('gameControlsOverlay');

        // 出牌区域
        this.playedCards = document.getElementById('playedCards');
        this.playerHand = document.getElementById('playerHand');

        // 聊天
        this.roomMessageLog = document.getElementById('roomMessageLog');
        this.chatInput = document.getElementById('chatInput');
        this.sendChatBtn = document.getElementById('sendChatBtn');
    }

    bindEvents() {
        // 开始游戏按钮
        this.startGameBtn?.addEventListener('click', () => this.playerReady());

        // 离开房间按钮
        this.leaveRoomBtn?.addEventListener('click', () => this.leaveRoom());

        // 退出游戏按钮
        this.exitGameBtn?.addEventListener('click', () => this.exitGame());

        // 游戏操作按钮 - 初始隐藏，需要游戏开始后且轮到玩家时才显示
        this.hintBtn?.addEventListener('click', () => this.showHint());
        this.playCardsBtn?.addEventListener('click', () => this.playCards());
        this.passBtn?.addEventListener('click', () => this.passTurn());

        // 发送聊天按钮
        this.sendChatBtn?.addEventListener('click', () => this.sendChat());

        // 聊天输入框回车发送
        this.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChat();
            }
        });

        // 点击输入区域聚焦输入框
        const chatInputArea = document.querySelector('.chat-input-area');
        if (chatInputArea) {
            chatInputArea.addEventListener('click', (e) => {
                // 如果点击的是输入区域本身（不是输入框或按钮），则聚焦输入框
                if (e.target === chatInputArea) {
                    this.chatInput?.focus();
                }
            });
        }

        // 卡牌点击选择
        this.setupCardSelection();
    }

    setupCardSelection() {
        // 为当前玩家的手牌添加点击事件
        const playerHandContainer = document.getElementById('playerHand');
        if (playerHandContainer) {
            const cards = playerHandContainer.querySelectorAll('.card');
            cards.forEach(card => {
                card.addEventListener('click', () => this.toggleCardSelection(card));
            });
        }
    }

    toggleCardSelection(card) {
        card.classList.toggle('selected');
    }

    sendChat() {
        if (!this.socket || !this.currentRoom) {
            this.addMessage('无法发送消息：未连接到服务器或不在房间中', 'error');
            return;
        }

        const message = this.chatInput.value.trim();
        if (!message) {
            return;
        }

        this.addMessage(`[DEBUG] 发送聊天消息给服务器: "${message}"`, 'debug');

        // 发送消息到服务器
        this.socket.emit('room_chat', {
            roomId: this.currentRoom.id,
            playerName: this.currentPlayer,
            message: message
        });

        // 清空输入框
        this.chatInput.value = '';

        this.addMessage(`[发送] ${this.currentPlayer}: ${message}`, 'chat-send');
    }

    addMessage(message, type = '') {
        const chatMessages = document.getElementById('roomMessageLog');
        if (!chatMessages) {
            console.error('聊天消息区域未找到');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.innerHTML = `
            <span class="time">[${new Date().toLocaleTimeString()}]</span>
            <span class="message">${message}</span>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addChatMessage(playerName, message) {
        const chatMessages = document.getElementById('roomMessageLog');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="time">[${new Date().toLocaleTimeString()}]</span>
            <span class="player">${playerName}:</span>
            <span class="message">${message}</span>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 更新房间显示
    updateRoomDisplay() {
        const roomNameDisplay = document.getElementById('roomNameDisplay');
        const roomIdDisplay = document.getElementById('roomIdDisplay');
        const currentRoomId = document.getElementById('currentRoomId');

        if (this.currentRoom) {
            if (roomNameDisplay) roomNameDisplay.textContent = this.currentRoom.name;
            if (roomIdDisplay) roomIdDisplay.textContent = this.currentRoom.id;
            if (currentRoomId) currentRoomId.textContent = this.currentRoom.id;
            this.updatePlayerPositions();
        }
    }

    // 更新玩家位置显示
    updatePlayerPositions() {
        if (!this.currentRoom || !this.currentRoom.players) return;

        const players = this.currentRoom.players;

        // 更新玩家姓名
        const topPlayerName = document.querySelector('#topPlayerName');
        const leftPlayerName = document.querySelector('#leftPlayerName');
        const currentPlayerNameDisplay = document.getElementById('currentPlayerNameDisplay');

        if (topPlayerName) {
            topPlayerName.textContent = players.length >= 2 ? players[1].name : '玩家2';
        }
        if (leftPlayerName) {
            leftPlayerName.textContent = players.length >= 3 ? players[2].name : '玩家3';
        }

        // 设置当前玩家位置
        if (currentPlayerNameDisplay) {
            currentPlayerNameDisplay.textContent = this.currentPlayer;
        }
    }


    sendChat() {
        const message = this.chatInput?.value.trim();
        if (!message || !this.socket) return;

        // 发送聊天消息到服务器
        this.socket.emit('chat_message', {
            roomId: this.currentRoom?.id,
            playerName: this.currentPlayer,
            message: message
        });

        // 本地显示
        this.addChatMessage(this.currentPlayer, message);

        // 清空输入框
        if (this.chatInput) {
            this.chatInput.value = '';
        }
    }

    // 渲染玩家手牌
    renderPlayerHand() {
        const playerHandContainer = document.getElementById('playerHand');
        if (!playerHandContainer) return;

        // 清空现有手牌
        playerHandContainer.innerHTML = '';

        // 如果没有手牌，显示空状态
        if (!this.playerHand || this.playerHand.length === 0) {
            playerHandContainer.innerHTML = '<div class="no-cards">等待发牌...</div>';
            return;
        }

        // 渲染每张牌
        this.playerHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card;
            cardElement.dataset.index = index;

            // 添加点击事件
            cardElement.addEventListener('click', () => this.toggleCardSelection(cardElement));

            playerHandContainer.appendChild(cardElement);
        });
    }

    // 更新卡牌数量显示
    updateCardCounts() {
        // 如果游戏还没开始，显示玩家准备状态
        if (!this.gameStarted) {
            this.updatePlayerReadyStatus();
            return;
        }

        // 如果有游戏状态更新，使用游戏状态中的牌数信息
        if (this.gameState && this.gameState.players) {
            const gamePlayers = this.gameState.players;

            // 遍历所有玩家位置，找到对应的玩家信息
            const updatePlayerCardCount = (playerElementId, gamePlayerId) => {
                const playerElement = document.getElementById(playerElementId);
                if (!playerElement) return;

                const cardCountElement = playerElement.querySelector('.player-cards-count');
                if (!cardCountElement) return;

                // 查找对应玩家ID的游戏玩家信息
                const gamePlayer = gamePlayers.find(p => p.id === gamePlayerId);
                if (gamePlayer) {
                    cardCountElement.textContent = `${gamePlayer.cardCount || 0}张`;
                }
            };

            // 更新各个玩家的牌数
            updatePlayerCardCount('topLeftPlayer', this.topLeftPlayerId);
            updatePlayerCardCount('topRightPlayer', this.topRightPlayerId);

            // 更新当前玩家牌数（使用手牌数量）
            const currentPlayerPosition = document.getElementById('currentPlayerPosition');
            if (currentPlayerPosition) {
                const cardCountElement = currentPlayerPosition.querySelector('.player-cards-count');
                if (cardCountElement) {
                    const currentPlayerCardCount = this.playerHand ? this.playerHand.length : 0;
                    cardCountElement.textContent = `${currentPlayerCardCount}张`;
                }
            }

            return;
        }

        // 如果没有游戏状态，回退到房间玩家信息
        if (!this.currentRoom || !this.currentRoom.players) return;

        const players = this.currentRoom.players;

        // 更新顶部左侧玩家卡牌数量
        if (this.topLeftPlayerId && players.find(p => p.id === this.topLeftPlayerId)) {
            const topLeftPlayer = document.getElementById('topLeftPlayer');
            const cardCountElement = topLeftPlayer?.querySelector('.player-cards-count');
            if (cardCountElement) {
                const player = players.find(p => p.id === this.topLeftPlayerId);
                cardCountElement.textContent = `${player?.cardCount || 0}张`;
            }
        }

        // 更新顶部右侧玩家卡牌数量
        if (this.topRightPlayerId && players.find(p => p.id === this.topRightPlayerId)) {
            const topRightPlayer = document.getElementById('topRightPlayer');
            const cardCountElement = topRightPlayer?.querySelector('.player-cards-count');
            if (cardCountElement) {
                const player = players.find(p => p.id === this.topRightPlayerId);
                cardCountElement.textContent = `${player?.cardCount || 0}张`;
            }
        }

        // 更新当前玩家卡牌数量
        const currentPlayerPosition = document.getElementById('currentPlayerPosition');
        if (currentPlayerPosition) {
            const cardCountElement = currentPlayerPosition.querySelector('.player-cards-count');
            if (cardCountElement) {
                const currentPlayerCardCount = this.playerHand ? this.playerHand.length : 0;
                cardCountElement.textContent = `${currentPlayerCardCount}张`;
            }
        }
    }

    // 更新玩家准备状态显示
    updatePlayerReadyStatus() {
        if (!this.currentRoom) return;

        const readyPlayers = this.currentRoom.readyPlayers || [];

        const updatePlayerStatus = (playerElementId, playerId) => {
            const playerElement = document.getElementById(playerElementId);
            if (!playerElement) return;

            const statusElement = playerElement.querySelector('.player-cards-count');
            if (!statusElement) return;

            const isReady = readyPlayers.includes(playerId);
            statusElement.textContent = isReady ? '已准备' : '未准备';
        };

        // 更新各个玩家的准备状态
        updatePlayerStatus('topLeftPlayer', this.topLeftPlayerId);
        updatePlayerStatus('topRightPlayer', this.topRightPlayerId);

        // 更新当前玩家准备状态
        const currentPlayerPosition = document.getElementById('currentPlayerPosition');
        if (currentPlayerPosition) {
            const statusElement = currentPlayerPosition.querySelector('.player-cards-count');
            if (statusElement) {
                const isCurrentPlayerReady = readyPlayers.includes(this.currentPlayerId);
                statusElement.textContent = isCurrentPlayerReady ? '已准备' : '未准备';
            }
        }
    }

    // 设置玩家头像
    setPlayerAvatar(playerElementId, avatarText) {
        const avatarElement = document.getElementById(playerElementId + 'Avatar');
        if (avatarElement) {
            avatarElement.textContent = avatarText;
        }
    }

    // 为玩家分配随机头像
    assignRandomAvatar(playerElementId) {
        const avatar = getRandomAvatar();
        this.setPlayerAvatar(playerElementId, avatar);
        return avatar;
    }

    connectToServer() {
        try {
            // 从URL参数获取房间和玩家信息
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId');
            const playerName = urlParams.get('playerName');
            const playerId = urlParams.get('playerId');

            if (!roomId || !playerName) {
                alert('缺少房间或玩家信息，请从大厅进入房间');
                this.backToLobby();
                return;
            }

            // 显示房间ID在标题中
            this.currentRoomId.textContent = roomId;

            this.currentRoom = { id: roomId, name: '加载中...' };
            this.currentPlayer = playerName;
            this.currentPlayerId = playerId;

            // 初始化Socket.IO连接
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                this.updateConnectionStatus(true);
                this.addMessage(`[DEBUG] 连接成功，发送join_game消息给服务器`, 'debug');

                // 加入房间
                this.socket.emit('join_game', {
                    roomId: roomId,
                    playerName: playerName
                });

                this.updateRoomDisplay();

                // 连接成功后不要立即显示按钮，等待服务器确认
                this.addMessage(`[DEBUG] 已发送加入房间请求，等待服务器响应...`, 'debug');
            });

            this.socket.on('disconnect', () => {
                this.updateConnectionStatus(false);
                this.addMessage('与服务器断开连接', 'error');
            });

            this.socket.on('room_joined', (data) => {
                this.addMessage(`[DEBUG] 收到服务器room_joined消息: ${JSON.stringify(data)}`, 'debug');
                this.addMessage(`成功加入房间`, 'success');

                if (data.room) {
                    this.currentRoom = data.room;
                    this.updateRoomDisplay();

                    // 根据玩家顺序设置玩家位置ID并分配头像
                    if (data.room.players && data.room.players.length > 0) {
                        // 找到当前玩家在玩家列表中的索引
                        const currentPlayerIndex = data.room.players.findIndex(p => p.id === this.currentPlayerId);

                        if (currentPlayerIndex !== -1) {
                            // 根据当前玩家位置，确定其他玩家的位置
                            const totalPlayers = data.room.players.length;

                            if (totalPlayers === 2) {
                                // 两人游戏：当前玩家在底部，另一个玩家在顶部左侧
                                this.topLeftPlayerId = data.room.players.find(p => p.id !== this.currentPlayerId)?.id;
                                this.topRightPlayerId = null;
                                // 为顶部左侧玩家分配头像
                                if (this.topLeftPlayerId) {
                                    this.assignRandomAvatar('topLeftPlayer');
                                }
                            } else if (totalPlayers === 3) {
                                // 三人游戏：当前玩家在底部，左侧和右侧各一个玩家
                                // 根据当前玩家索引确定其他玩家位置
                                const leftIndex = (currentPlayerIndex - 1 + totalPlayers) % totalPlayers;
                                const rightIndex = (currentPlayerIndex + 1) % totalPlayers;

                                this.topLeftPlayerId = data.room.players[leftIndex].id;
                                this.topRightPlayerId = data.room.players[rightIndex].id;

                                // 为其他玩家分配头像
                                if (this.topLeftPlayerId) {
                                    this.assignRandomAvatar('topLeftPlayer');
                                }
                                if (this.topRightPlayerId) {
                                    this.assignRandomAvatar('topRightPlayer');
                                }
                            }
                        }
                    }
                }

                // 收到服务器确认后显示房间操作按钮
                this.showRoomActions();
                this.hideExitGameButton();
                this.addMessage(`[DEBUG] 已显示房间操作按钮`, 'debug');
            });

            this.socket.on('room_left', (data) => {
                this.addMessage(`[DEBUG] 收到服务器room_left消息: ${JSON.stringify(data)}`, 'debug');
                this.addMessage(`离开房间 "${data.room.name}"`, 'info');
                this.currentRoom = null;
                this.gameStarted = false; // 重置游戏状态
                this.backToLobby();
            });

            // 添加玩家加入房间的监听
            this.socket.on('player_joined', (data) => {
                this.addMessage(`[DEBUG] 收到服务器player_joined消息: ${JSON.stringify(data)}`, 'debug');
                this.addMessage(`玩家 ${data.playerName} 加入了房间`, 'info');
                this.updateRoomDisplay();

                // 为新加入的玩家分配随机头像
                if (data.playerId && data.playerId !== this.currentPlayerId) {
                    // 确定玩家位置并分配头像
                    if (!this.topLeftPlayerId && this.currentRoom.players.length >= 2) {
                        this.topLeftPlayerId = data.playerId;
                        this.assignRandomAvatar('topLeftPlayer');
                    } else if (!this.topRightPlayerId && this.currentRoom.players.length >= 3) {
                        this.topRightPlayerId = data.playerId;
                        this.assignRandomAvatar('topRightPlayer');
                    }
                }

                // 重新计算玩家位置ID（因为玩家数量可能发生变化）
                if (this.currentRoom && this.currentRoom.players && this.currentRoom.players.length > 0) {
                    const currentPlayerIndex = this.currentRoom.players.findIndex(p => p.id === this.currentPlayerId);

                    if (currentPlayerIndex !== -1) {
                        const totalPlayers = this.currentRoom.players.length;

                        if (totalPlayers === 2) {
                            this.topLeftPlayerId = this.currentRoom.players.find(p => p.id !== this.currentPlayerId)?.id;
                            this.topRightPlayerId = null;
                        } else if (totalPlayers === 3) {
                            const leftIndex = (currentPlayerIndex - 1 + totalPlayers) % totalPlayers;
                            const rightIndex = (currentPlayerIndex + 1) % totalPlayers;

                            this.topLeftPlayerId = this.currentRoom.players[leftIndex].id;
                            this.topRightPlayerId = this.currentRoom.players[rightIndex].id;
                }
            }
        }

        // 设置玩家头像
        setPlayerAvatar(playerElementId, avatarText) {
            const avatarElement = document.getElementById(playerElementId + 'Avatar');
            if (avatarElement) {
                avatarElement.textContent = avatarText;
            }
        }

        // 为玩家分配随机头像
        assignRandomAvatar(playerElementId) {
            const avatar = getRandomAvatar();
            this.setPlayerAvatar(playerElementId, avatar);
            return avatar;
        }

        connectToServer() {
            try {
                // 从URL参数获取房间和玩家信息
                const urlParams = new URLSearchParams(window.location.search);
                const roomId = urlParams.get('roomId');
                const playerName = urlParams.get('playerName');
                const playerId = urlParams.get('playerId');

                if (!roomId || !playerName) {
                    alert('缺少房间或玩家信息，请从大厅进入房间');
                    this.backToLobby();
                    return;
                }

                // 显示房间ID在标题中
                this.currentRoomId.textContent = roomId;

                this.currentRoom = { id: roomId, name: '加载中...' };
                this.currentPlayer = playerName;
                this.currentPlayerId = playerId;

                // 初始化Socket.IO连接
                this.socket = io('http://localhost:3000');

                this.socket.on('connect', () => {
                    this.updateConnectionStatus(true);
                    this.addMessage(`[DEBUG] 连接成功，发送join_game消息给服务器`, 'debug');

                    // 加入房间
                    this.socket.emit('join_game', {
                        roomId: roomId,
                        playerName: playerName
                    });

                    this.updateRoomDisplay();

                    // 连接成功后不要立即显示按钮，等待服务器确认
                    this.addMessage(`[DEBUG] 已发送加入房间请求，等待服务器响应...`, 'debug');
                });

                this.socket.on('disconnect', () => {
                    this.updateConnectionStatus(false);
                    this.addMessage('与服务器断开连接', 'error');
                });

                this.socket.on('room_joined', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器room_joined消息: ${JSON.stringify(data)}`, 'debug');
                    this.addMessage(`成功加入房间`, 'success');

                    if (data.room) {
                        this.currentRoom = data.room;
                        this.updateRoomDisplay();

                        // 根据玩家顺序设置玩家位置ID并分配头像
                        if (data.room.players && data.room.players.length > 0) {
                            // 找到当前玩家在玩家列表中的索引
                            const currentPlayerIndex = data.room.players.findIndex(p => p.id === this.currentPlayerId);

                            if (currentPlayerIndex !== -1) {
                                // 根据当前玩家位置，确定其他玩家的位置
                                const totalPlayers = data.room.players.length;

                                if (totalPlayers === 2) {
                                    // 两人游戏：当前玩家在底部，另一个玩家在顶部左侧
                                    this.topLeftPlayerId = data.room.players.find(p => p.id !== this.currentPlayerId)?.id;
                                    this.topRightPlayerId = null;
                                    // 为顶部左侧玩家分配头像
                                    if (this.topLeftPlayerId) {
                                        this.assignRandomAvatar('topLeftPlayer');
                                    }
                                } else if (totalPlayers === 3) {
                                    // 三人游戏：当前玩家在底部，左侧和右侧各一个玩家
                                    // 根据当前玩家索引确定其他玩家位置
                                    const leftIndex = (currentPlayerIndex - 1 + totalPlayers) % totalPlayers;
                                    const rightIndex = (currentPlayerIndex + 1) % totalPlayers;

                                    this.topLeftPlayerId = data.room.players[leftIndex].id;
                                    this.topRightPlayerId = data.room.players[rightIndex].id;

                                    // 为其他玩家分配头像
                                    if (this.topLeftPlayerId) {
                                        this.assignRandomAvatar('topLeftPlayer');
                                    }
                                    if (this.topRightPlayerId) {
                                        this.assignRandomAvatar('topRightPlayer');
                                    }
                                }
                            }
                        }
                    }

                    // 收到服务器确认后显示房间操作按钮
                    this.showRoomActions();
                    this.hideExitGameButton();
                    this.addMessage(`[DEBUG] 已显示房间操作按钮`, 'debug');
                });

                this.socket.on('room_left', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器room_left消息: ${JSON.stringify(data)}`, 'debug');
                    this.addMessage(`离开房间 "${data.room.name}"`, 'info');
                    this.currentRoom = null;
                    this.gameStarted = false; // 重置游戏状态
                    this.backToLobby();
                });

                // 添加玩家加入房间的监听
                this.socket.on('player_joined', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器player_joined消息: ${JSON.stringify(data)}`, 'debug');
                    this.addMessage(`玩家 ${data.playerName} 加入了房间`, 'info');
                    this.updateRoomDisplay();

                    // 为新加入的玩家分配随机头像
                    if (data.playerId && data.playerId !== this.currentPlayerId) {
                        // 确定玩家位置并分配头像
                        if (!this.topLeftPlayerId && this.currentRoom.players.length >= 2) {
                            this.topLeftPlayerId = data.playerId;
                            this.assignRandomAvatar('topLeftPlayer');
                        } else if (!this.topRightPlayerId && this.currentRoom.players.length >= 3) {
                            this.topRightPlayerId = data.playerId;
                            this.assignRandomAvatar('topRightPlayer');
                        }
                    }
                });

                // 添加玩家离开房间的监听
                this.socket.on('player_left', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器player_left消息: ${JSON.stringify(data)}`, 'debug');
                    this.addMessage(`玩家 ${data.playerName} 离开了房间`, 'info');
                    this.updateRoomDisplay();
                });

                // 添加房间状态更新监听
                this.socket.on('room_state_updated', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器room_state_updated消息: ${JSON.stringify(data)}`, 'debug');
                    this.updateRoomDisplay();
                });

                // 处理玩家准备
                this.socket.on('player_ready', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器player_ready消息: ${JSON.stringify(data)}`, 'debug');

                    // 立即更新玩家准备状态显示
                    this.updatePlayerReadyStatus();

                    // 检查是否所有玩家都准备好了
                    if (this.currentRoom && this.currentRoom.readyPlayers) {
                        const totalPlayers = this.currentRoom.players ? this.currentRoom.players.length : 0;
                        const readyPlayersCount = this.currentRoom.readyPlayers.length;

                        if (readyPlayersCount >= totalPlayers && totalPlayers >= 3) {
                            this.addMessage('所有玩家已准备，等待游戏开始...', 'success');
                            // 更新状态显示为等待发牌
                            this.setCardCountDisplay('topLeftCardCount', '等待发牌...');
                            this.setCardCountDisplay('topRightCardCount', '等待发牌...');
                            this.setCardCountDisplay('currentPlayerCardCount', '等待发牌...');
                        }
                    }
                });

                this.socket.on('cards_dealt', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器cards_dealt消息: ${JSON.stringify(data)}`, 'debug');
                    this.addMessage(`游戏开始，发牌完成`, 'success');
                    if (data.playerId === this.currentPlayerId) {
                        this.playerHand = data.cards;
                        this.gameStarted = true; // 标记游戏已开始
                        this.renderPlayerHand();
                        this.updateCardCounts();
                        this.addMessage(`您获得了 ${data.cards.length} 张牌`, 'info');

                        // 游戏开始后，隐藏房间操作按钮，显示游戏操作按钮
                        this.hideRoomActions();
                        // 显示退出游戏按钮
                        this.showExitGameButton();

                        if (data.gameState && data.gameState.currentPlayer === this.currentPlayerId) {
                            this.isMyTurn = true;
                            this.showGameActions();
                        }
                    }
                });

                this.socket.on('game_state_updated', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器game_state_updated消息: ${JSON.stringify(data)}`, 'debug');
                    this.gameState = data.gameState;
                    this.updateCardCounts();

                    // 检查是否轮到当前玩家出牌
                    if (data.gameState && data.gameState.currentPlayer === this.currentPlayerId) {
                        this.isMyTurn = true;
                        this.showGameActions();
                    } else {
                        this.isMyTurn = false;
                        this.hideGameActions();
                    }

                    // 如果游戏结束，显示房间操作按钮
                    if (data.gameState && data.gameState.gameEnded) {
                        this.showRoomActions();
                        this.hideExitGameButton(); // 游戏结束后隐藏退出游戏按钮
                        this.gameStarted = false; // 重置游戏状态
                        this.updateCardCounts(); // 更新显示为等待发牌状态
                    }
                });

                this.socket.on('cards_played', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器cards_played消息: ${JSON.stringify(data)}`, 'debug');
                    // 处理其他玩家出牌
                    if (data.playerId !== this.currentPlayerId) {
                        this.addMessage(`其他玩家出了 ${data.cards.length} 张牌`, 'info');
                    }
                });

                // 添加聊天消息监听
                this.socket.on('room_chat', (data) => {
                    this.addMessage(`[DEBUG] 收到服务器room_chat消息: ${JSON.stringify(data)}`, 'debug');
                    if (data.playerName !== this.currentPlayer) {
                        this.addMessage(`[接收] ${data.playerName}: ${data.message}`, 'chat-receive');
                    }
                });

            } catch (error) {
                this.addMessage(`连接失败: ${error.message}`, 'error');
            }
        }

    // 更新连接状态
    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.textContent = connected ? '已连接' : '未连接';
            connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        }
    }

    // 返回大厅
    backToLobby() {
        window.location.href = '/lobby/index.html';
    }

    // 离开房间
    leaveRoom() {
        if (!this.currentRoom || !this.socket) {
            this.backToLobby();
            return;
        }

        this.socket.emit('leave_game', {
            roomId: this.currentRoom.id,
            playerName: this.currentPlayer
        });

        this.gameStarted = false; // 重置游戏状态
        this.backToLobby();
    }

    // 玩家准备
    async playerReady() {
        if (!this.currentRoom || !this.currentPlayer) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/games/rooms/${this.currentRoom.id}/ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: this.currentPlayerId
                })
            });

            const result = await response.json();

            if (result.success) {
                // 立即更新本地显示为已准备
                this.updatePlayerReadyStatus();
                this.addMessage('已准备', 'success');

                // 检查是否所有玩家都准备好了
                if (result.data && result.data.allReady) {
                    this.addMessage('所有玩家已准备，等待游戏开始...', 'success');
                    // 更新状态显示为等待发牌
                    this.setCardCountDisplay('topLeftCardCount', '等待发牌...');
                    this.setCardCountDisplay('topRightCardCount', '等待发牌...');
                    this.setCardCountDisplay('currentPlayerCardCount', '等待发牌...');
                }
            } else {
                this.addMessage(`准备失败: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addMessage(`网络错误: ${error.message}`, 'error');
        }
    }

    // 显示房间操作按钮（开始游戏、返回大厅）
    showRoomActions() {
        const gameControlsOverlay = document.getElementById('gameControlsOverlay');
        const roomActions = document.getElementById('roomActions');
        const gameActions = document.getElementById('gameActions');

        if (gameControlsOverlay) {
            gameControlsOverlay.style.display = 'flex';
        } else {
            console.error('游戏控制覆盖层未找到');
        }

        if (roomActions) {
            roomActions.style.display = 'flex';
        } else {
            console.error('房间操作按钮未找到');
        }

        if (gameActions) {
            gameActions.style.display = 'none';
        }

        // 隐藏退出游戏按钮
        this.hideExitGameButton();
    }

    // 隐藏房间操作按钮
    hideRoomActions() {
        const roomActions = document.getElementById('roomActions');
        const gameControlsOverlay = document.getElementById('gameControlsOverlay');

        if (roomActions) {
            roomActions.style.display = 'none';
        }
        if (gameControlsOverlay) {
            gameControlsOverlay.style.display = 'none';
        }
    }

    // 隐藏退出游戏按钮
    hideExitGameButton() {
        if (this.exitGameBtn) {
            this.exitGameBtn.style.display = 'none';
        }
    }

    // 显示提示（智能提示玩家可以出的牌）
    showHint() {
        if (!this.playerHand || this.playerHand.length === 0) {
            this.addMessage('没有手牌可以提示', 'warning');
            return;
        }

        // 这里应该实现智能提示逻辑
        // 暂时简单提示：选一张牌
        const playerHandContainer = document.getElementById('playerHand');
        if (playerHandContainer) {
            const cards = playerHandContainer.querySelectorAll('.card');
            if (cards.length > 0) {
                // 取消之前选中的牌
                cards.forEach(card => card.classList.remove('selected'));

                // 选中第一张牌作为提示
                cards[0].classList.add('selected');
                this.addMessage('提示：选中了一张可出的牌', 'info');
            }
        }
    }

    // 出牌
    playCards() {
        if (!this.currentRoom || !this.socket) {
            return;
        }

        // 获取选中的牌
        const playerHandContainer = document.getElementById('playerHand');
        if (!playerHandContainer) return;

        const selectedCards = playerHandContainer.querySelectorAll('.card.selected');
        if (!selectedCards || selectedCards.length === 0) {
            this.addMessage('请选择要出的牌', 'warning');
            return;
        }

        // 提取牌值
        const cards = Array.from(selectedCards).map(card => card.textContent);

        // 发送出牌消息到服务器
        this.socket.emit('play_cards', {
            roomId: this.currentRoom.id,
            cards: cards
        });

        // 清空选中状态
        selectedCards.forEach(card => card.classList.remove('selected'));

        this.addMessage(`出了 ${cards.join(', ')}`, 'info');

        // 出牌后隐藏操作按钮，等待服务器响应
        this.hideGameActions();
    }

    // 不出牌
    passTurn() {
        if (!this.currentRoom || !this.socket) {
            return;
        }

        this.socket.emit('pass_turn', {
            roomId: this.currentRoom.id,
            playerName: this.currentPlayer
        });

        this.addMessage('选择不出牌', 'info');

        // 不出牌后隐藏操作按钮
        this.hideGameActions();
    }

    // 返回大厅
    backToLobby() {
        window.location.href = '/lobby/index.html';
    }

    // 离开房间
    leaveRoom() {
        if (!this.currentRoom || !this.socket) {
            this.backToLobby();
            return;
        }

        // 隐藏所有操作按钮
        this.hideRoomActions();
        this.hideGameActions();
        this.hideExitGameButton();

        this.socket.emit('leave_game', {
            roomId: this.currentRoom.id,
            playerName: this.currentPlayer
        });

        this.backToLobby();
    }

    // 退出游戏（游戏进行中强制退出）
    exitGame() {
        if (!this.currentRoom || !this.socket) {
            this.backToLobby();
            return;
        }

        // 确认退出游戏
        if (confirm('游戏正在进行中，确定要退出游戏吗？')) {
            // 隐藏所有操作按钮
            this.hideRoomActions();
            this.hideGameActions();
            this.hideExitGameButton();

            // 发送退出游戏消息
            this.socket.emit('exit_game', {
                roomId: this.currentRoom.id,
                playerName: this.currentPlayer,
                playerId: this.currentPlayerId
            });

            this.addMessage('已退出游戏', 'warning');
            this.gameStarted = false; // 重置游戏状态
            this.backToLobby();
        }
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
