// 斗地主游戏房间客户端 - 极简版
class DoudizhuRoomClient {
    constructor() {
        this.socketManager = window.GlobalSocketManager.getInstance();
        this.socket = null;
        this.currentRoom = null;
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.playerAvatar = null; // 玩家头像
        this.playerHand = [];
        this.gameStarted = false;
        this.isMyTurn = false;
        this.selectedCards = [];
        
        // 拖拽选择状态
        this.isDragging = false;
        this.dragStartSelected = false; // 拖拽开始时的选中状态
        this.hasDragged = false; // 是否真的发生了拖拽
        
        // 倒计时
        this.turnTimer = null;
        this.turnTimeLeft = 0;
        this.roomPlayers = []; // 房间内所有玩家
        this.alreadyJoined = false; // 标记是否已经在大厅加入
        this.eventsAlreadyBound = false; // 标记事件是否已经绑定
        this.biddingTimerInterval = null; // 抢地主倒计时定时器
        
        // 出牌相关状态
        this.lastPlayedCards = null; // 上家出的牌型信息
        this.isFirstPlay = false; // 是否首次出牌（地主先出）
        this.landlordId = null; // 地主ID
        this.bottomCards = null; // 底牌
        
        // 初始化音效（需要用户交互后才能播放）
        this.soundInitialized = false;

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
        const playerAvatar = urlParams.get('playerAvatar'); // 获取头像参数
        const alreadyJoined = urlParams.get('joined') === 'true'; // 检查是否已经在大厅加入

        if (!roomId || !playerName) {
            alert('缺少房间或玩家信息，请从大厅进入房间');
            this.backToLobby();
            return;
        }

        // 用户名就是唯一标识
        this.currentPlayer = decodeURIComponent(playerName);
        this.currentPlayerId = decodeURIComponent(playerName);
        this.playerAvatar = playerAvatar ? decodeURIComponent(playerAvatar) : '👑'; // 保存头像
        this.currentRoom = { id: roomId };
        this.alreadyJoined = alreadyJoined; // 保存是否已加入的状态

        // 设置全局状态
        this.socketManager.userName = this.currentPlayer;
        this.socketManager.userId = this.currentPlayer;
        this.socketManager.authenticated = true;

        // 更新页面显示当前玩家信息
        this.updateCurrentPlayerDisplay();

        console.log('房间初始化:', { playerName: this.currentPlayer, playerAvatar: this.playerAvatar, roomId, alreadyJoined });
    }

    /**
     * 更新当前玩家显示
     */
    updateCurrentPlayerDisplay() {
        // 更新当前玩家头像
        const avatarElement = document.getElementById('currentPlayerAvatar');
        if (avatarElement) {
            avatarElement.textContent = this.playerAvatar;
        }

        // 更新当前玩家名字
        const nameElement = document.getElementById('currentPlayerNameDisplay');
        if (nameElement) {
            nameElement.textContent = this.currentPlayer;
        }

        console.log('✅ 更新当前玩家显示:', { avatar: this.playerAvatar, name: this.currentPlayer });
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            if (connected) {
                statusElement.textContent = '已连接';
                statusElement.style.color = '#27ae60';
            } else {
                statusElement.textContent = '未连接';
                statusElement.style.color = '#e74c3c';
            }
        }
    }

    /**
     * 连接到服务器（多页面架构）
     */
    connectToServer() {
        // 建立新的Socket连接
        this.socket = this.socketManager.connect();
        
        if (!this.socket) {
            console.error('❌ 无法建立Socket连接');
            this.backToLobby();
            return;
        }

        console.log('🔌 [MPA] 房间页面建立Socket连接:', this.socket.id);

        // 连接成功后加入房间
        this.socket.on('connect', () => {
            console.log('✅ [房间] Socket连接成功');
            this.updateConnectionStatus(true);

            // 显示房间号
            const roomIdElement = document.getElementById('currentRoomId');
            if (roomIdElement) {
                roomIdElement.textContent = this.currentRoom.id;
            }

            // MPA架构：房间页面负责真正的加入操作
            // 大厅页面只负责导航，不发送join_game
            // 这里是唯一发送join_game的地方
            console.log('🔄 [房间] 发送join_game请求，加入房间:', this.currentRoom.id);
            
            // 发送join_game请求，让Socket加入房间
            this.joinRoom();
        });

        // 房间事件
        this.socket.on('join_game_success', (data) => {
            console.log('🎉 [Socket事件] 收到 join_game_success，Socket已加入房间');
            this.onJoinGameSuccess(data);
        });
        this.socket.on('join_game_failed', (data) => {
            console.error('❌ [Socket事件] 收到 join_game_failed');
            this.onJoinGameFailed(data);
        });
        this.socket.on('room_joined', (data) => this.onRoomJoined(data));
        this.socket.on('room_left', (data) => this.onRoomLeft(data));
        this.socket.on('player_joined', (data) => {
            console.log('🔔 [Socket事件] 收到 player_joined 事件');
            this.onPlayerJoined(data);
        });
        this.socket.on('player_left', (data) => this.onPlayerLeft(data));
        this.socket.on('player_ready', (data) => {
            console.log('🔔 [Socket事件] 收到 player_ready 事件');
            this.onPlayerReady(data);
        });

        // 游戏事件
        this.socket.on('game_started', (data) => this.onGameStarted(data));
        this.socket.on('deal_cards', (data) => this.onDealCards(data));
        this.socket.on('deal_cards_all', (data) => this.onDealCardsAll(data)); // 新增：房间广播发牌
        this.socket.on('cards_dealt', (data) => this.onCardsDealt(data));
        this.socket.on('bidding_start', (data) => this.onBiddingStart(data));
        this.socket.on('bid_result', (data) => this.onBidResult(data));
        this.socket.on('landlord_determined', (data) => this.onLandlordDetermined(data));
        this.socket.on('game_state_updated', (data) => this.onGameStateUpdated(data));
        this.socket.on('turn_to_play', (data) => this.onTurnToPlay(data));
        this.socket.on('turn_changed', (data) => this.onTurnChanged(data));
        this.socket.on('cards_played', (data) => {
            console.log('🎴 [Socket事件] 收到 cards_played 事件:', data);
            this.onCardsPlayed(data);
        });
        this.socket.on('player_passed', (data) => this.onPlayerPassed(data));
        this.socket.on('new_round_started', (data) => this.onNewRoundStarted(data));
        this.socket.on('game_over', (data) => this.onGameOver(data));
        this.socket.on('game_ended', (data) => this.onGameEnded(data));

        // 聊天消息监听
        this.socket.on('message_received', (data) => this.onMessageReceived(data));

        // 监听断开连接
        this.socket.on('disconnect', () => {
            console.log('房间连接断开');
            this.updateConnectionStatus(false);
        });

        // 连接成功后绑定事件
        this.socket.on('connect', () => {
            this.bindEvents();
        });
    }

    /**
     * 绑定UI事件监听器
     */
    bindEvents() {
        // 防止重复绑定
        if (this.eventsAlreadyBound) {
            console.log('⚠️ 事件已经绑定，跳过重复绑定');
            return;
        }
        
        console.log('🔗 绑定UI事件监听器');
        this.eventsAlreadyBound = true;
        
        // 绑定开始游戏按钮（添加防抖）
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            let isProcessing = false; // 防抖标志
            
            startGameBtn.addEventListener('click', () => {
                // 防止重复点击
                if (isProcessing) {
                    console.log('⚠️ 操作正在处理中，请稍候...');
                    if (window.MessageToast) {
                        window.MessageToast.warning('操作正在处理中，请稍候...');
                    }
                    return;
                }
                
                // 设置处理标志并禁用按钮
                isProcessing = true;
                const originalText = startGameBtn.textContent;
                startGameBtn.disabled = true;
                
                // 初始化音效系统
                this.initSound();
                
                // 播放背景音乐
                this.playBgMusic();
                
                // 播放点击音效
                this.playSound('click');
                
                // 获取当前玩家状态
                const currentPlayer = this.roomPlayers.find(p => p.id === this.currentPlayerId);
                const isReady = currentPlayer?.ready || false;
                
                // 🔧 修复Bug2：切换准备状态
                // 后端的togglePlayerReady会自动切换状态，所以统一发送player_ready事件
                this.socket.emit('player_ready', {
                    roomId: this.currentRoom.id,
                    userId: this.currentPlayerId
                });
                
                console.log(`🎮 发送player_ready事件 (当前状态: ${isReady ? '已准备' : '未准备'})`);
                
                // 立即更新本地玩家的准备状态
                if (currentPlayer) {
                    currentPlayer.ready = !currentPlayer.ready;
                }
                
                // 根据新状态更新按钮
                if (currentPlayer?.ready) {
                    // 更新按钮文字为"取消准备"
                    startGameBtn.textContent = '取消准备';
                    startGameBtn.classList.remove('btn-success');
                    startGameBtn.classList.add('btn-warning');
                } else {
                    // 更新按钮文字为"开始游戏"
                    startGameBtn.textContent = '开始游戏';
                    startGameBtn.classList.remove('btn-warning');
                    startGameBtn.classList.add('btn-success');
                }
                
                // 更新玩家列表显示
                this.updateRoomPlayers();
                
                // 1秒后解除锁定
                setTimeout(() => {
                    isProcessing = false;
                    startGameBtn.disabled = false;
                    console.log('✅ 准备按钮已解锁，可以再次点击');
                }, 1000);
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
                this.initSound();
                this.playCards();
            });
        }

        // 绑定不出按钮
        const passBtn = document.getElementById('passBtn');
        if (passBtn) {
            passBtn.addEventListener('click', () => {
                this.initSound();
                this.playSound('pass');
                this.passTurn();
            });
        }

        // 绑定提示按钮
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.initSound();
                this.playSound('hint');
                this.showHint();
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
        
        // 使用更好的格式显示聊天消息
        const messageLog = document.getElementById('roomMessageLog');
        if (!messageLog) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';

        const time = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <span class="time">${time}</span>
            <span class="player">${playerName}</span>
            <span class="message">${message}</span>
        `;

        messageLog.appendChild(messageDiv);
        messageLog.scrollTop = messageLog.scrollHeight;
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
     * 加入游戏成功
     */
    onJoinGameSuccess(data) {
        console.log('加入游戏成功:', data);
        this.addGameMessage(`✅ 成功加入房间 ${data.roomId}`, 'system');
        
        // 更新房间玩家列表
        if (data.players) {
            // 为每个玩家补充avatar字段
            this.roomPlayers = this.enrichPlayersWithAvatars(data.players);
            this.updateRoomPlayers();
            
            // 显示所有玩家的准备状态
            this.addGameMessage(`👥 房间玩家 (${data.players.length}/3):`, 'system');
            data.players.forEach(player => {
                const status = player.ready ? '✅已准备' : '⏳未准备';
                this.addGameMessage(`  ${status} ${player.name}`, 'system');
            });
        }
        
        this.showRoomActions();
        this.bindEvents();
    }

    /**
     * 加入游戏失败
     */
    onJoinGameFailed(data) {
        console.error('加入房间失败:', data.message);
        
        // 显示错误提示
        this.showErrorMessage(data.message || '无法加入房间');
        
        // 立即返回大厅（不等待）
        setTimeout(() => {
            this.backToLobby();
        }, 1500);
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
        console.log('🎯 [玩家加入事件] 收到数据:', data);
        console.log('🎯 [玩家加入事件] 当前玩家列表:', this.roomPlayers);
        
        if (data.playerName !== this.currentPlayer) {
            this.addGameMessage(`👤 ${data.playerName} 加入了房间`, 'system');
        }
        
        // 如果服务器发送了完整的玩家列表，使用它来更新
        if (data.players && Array.isArray(data.players)) {
            console.log('📋 收到完整玩家列表，更新房间玩家:', data.players);
            // 为每个玩家补充avatar字段
            this.roomPlayers = this.enrichPlayersWithAvatars(data.players);
            console.log('📋 更新后的玩家列表:', this.roomPlayers);
            this.updateRoomPlayers();
            console.log('✅ updateRoomPlayers 已调用');
        } else {
            // 兼容旧版本：只收到单个玩家信息
            console.log('⚠️ 未收到完整玩家列表，使用单个玩家信息');
            const existingPlayer = this.roomPlayers.find(p => p.id === data.playerId || p.name === data.playerName);
            if (!existingPlayer) {
                this.roomPlayers.push({
                    id: data.playerId || data.playerName,
                    name: data.playerName,
                    avatar: this.getPlayerAvatar(this.roomPlayers.length),
                    ready: false
                });
            }
            this.updateRoomPlayers();
        }
        
        // 显示当前房间玩家数
        this.addGameMessage(`👥 房间玩家数: ${this.roomPlayers.length}/3`, 'system');
    }

    /**
     * 玩家准备
     */
    onPlayerReady(data) {
        console.log('🎯 [玩家准备事件] 收到数据:', data);
        console.log('🎯 [玩家准备事件] 当前玩家列表:', this.roomPlayers);
        
        // 如果服务器发送了完整的玩家列表，使用它来更新
        if (data.players && Array.isArray(data.players)) {
            console.log('📋 收到完整玩家列表（准备状态更新）:', data.players);
            
            // 查找该玩家的最新状态
            const updatedPlayer = data.players.find(p => p.name === data.playerName || p.id === data.playerId);
            
            // 根据玩家的实际状态显示消息
            if (updatedPlayer) {
                if (updatedPlayer.ready) {
                    this.addGameMessage(`✅ ${data.playerName} 已准备`, 'system');
                } else {
                    this.addGameMessage(`⏳ ${data.playerName} 取消准备`, 'system');
                }
            } else {
                // 如果找不到玩家，默认显示已准备（向后兼容）
                this.addGameMessage(`✅ ${data.playerName} 已准备`, 'system');
            }
            
            // 为每个玩家补充avatar字段
            this.roomPlayers = this.enrichPlayersWithAvatars(data.players);
            console.log('📋 更新后的玩家列表:', this.roomPlayers);
            this.updateRoomPlayers();
            console.log('✅ updateRoomPlayers 已调用');
        } else {
            // 兼容旧版本：只更新单个玩家状态
            console.log('⚠️ 未收到完整玩家列表，使用单个玩家信息');
            const player = this.roomPlayers.find(p => p.name === data.playerName);
            if (player) {
                player.ready = true;
                this.addGameMessage(`✅ ${data.playerName} 已准备`, 'system');
                this.updateRoomPlayers();
            } else {
                console.error('❌ 未找到玩家:', data.playerName);
            }
        }
    }

    /**
     * 玩家离开
     */
    onPlayerLeft(data) {
        console.log('玩家离开:', data);
        if (data.playerName) {
            this.addGameMessage(`👋 ${data.playerName} 离开了房间`, 'system');
        }
        
        // 如果服务器发送了完整的玩家列表，使用它来更新
        if (data.players && Array.isArray(data.players)) {
            console.log('📋 收到完整玩家列表（玩家离开）:', data.players);
            // 为每个玩家补充avatar字段
            this.roomPlayers = this.enrichPlayersWithAvatars(data.players);
            this.updateRoomPlayers();
        } else {
            // 兼容旧版本：手动移除玩家
            this.roomPlayers = this.roomPlayers.filter(p => 
                p.id !== data.playerId && p.name !== data.playerName
            );
            this.updateRoomPlayers();
        }
        
        // 显示当前房间玩家数
        this.addGameMessage(`👥 房间玩家数: ${this.roomPlayers.length}/3`, 'system');
    }

    /**
     * 游戏开始
     */
    onGameStarted(data) {
        console.log('游戏开始:', data);
        this.addGameMessage(`🎮 游戏开始！所有玩家已准备完毕`, 'important');
        
        // 隐藏房间操作按钮
        this.hideRoomActions();
        
        // 显示游戏区域
        this.showGameArea();
    }

    /**
     * 发牌事件（房间广播版本）
     */
    onDealCardsAll(data) {
        console.log('🎯 [发牌事件-广播] 收到数据:', data);
        
        // 找到当前玩家的牌
        const myCards = data.players.find(p => p.playerId === this.currentPlayerId);
        
        if (myCards && myCards.cards && myCards.cards.length > 0) {
            console.log('🎴 找到我的牌，开始发牌动画，牌数:', myCards.cards.length);
            
            // 确保游戏区域可见
            this.showGameArea();
            
            // 隐藏房间按钮
            this.hideRoomActions();
            
            // 播放发牌动画
            this.dealCardsWithAnimation(myCards.cards);
        } else {
            console.error('❌ 未找到我的牌数据，currentPlayerId:', this.currentPlayerId);
            console.error('❌ 所有玩家数据:', data.players);
        }
    }

    /**
     * 发牌事件（旧版本，保留兼容）
     */
    onDealCards(data) {
        console.log('🎯 [发牌事件-单播] 收到数据:', data);
        
        if (data.cards && data.cards.length > 0) {
            console.log('🎴 开始发牌动画，牌数:', data.cards.length);
            
            // 确保游戏区域可见
            this.showGameArea();
            
            // 隐藏房间按钮
            this.hideRoomActions();
            
            // 播放发牌动画
            this.dealCardsWithAnimation(data.cards);
        } else {
            console.error('❌ 未收到牌数据');
        }
    }

    /**
     * 发牌（旧事件兼容）
     */
    onCardsDealt(data) {
        if (data.playerId === this.currentPlayerId) {
            this.playerHand = data.cards;
            this.gameStarted = true;
            this.addGameMessage(`🎴 您获得了 ${data.cards.length} 张牌`, 'game');
            this.dealCardsWithAnimation(data.cards);
            this.hideRoomActions();
        }
    }

    /**
     * 抢地主开始
     */
    onBiddingStart(data) {
        console.log('抢地主开始:', data);
        this.addGameMessage(`🎲 开始抢地主！第一个玩家：${data.firstBidderName}`, 'game');
        
        // 延迟3秒后显示抢地主按钮（等待发牌动画完成）
        setTimeout(() => {
            // 如果是当前玩家的回合，显示抢地主按钮
            if (data.firstBidderName === this.currentPlayer) {
                this.showBiddingActions();
            }
        }, 3000); // 3秒延迟
    }

    /**
     * 显示抢地主按钮
     */
    showBiddingActions() {
        const overlay = document.getElementById('gameControlsOverlay');
        const biddingActions = document.getElementById('biddingActions');
        const bidBtn = document.getElementById('bidBtn');
        const noBidBtn = document.getElementById('noBidBtn');
        
        if (!overlay || !biddingActions) return;
        
        // 显示抢地主界面
        overlay.style.display = 'flex';
        biddingActions.style.display = 'flex';
        
        // 开始倒计时
        this.startBiddingTimer(15);
        
        // 绑定按钮事件
        bidBtn.onclick = () => this.handleBid(true);
        noBidBtn.onclick = () => this.handleBid(false);
    }

    /**
     * 隐藏抢地主按钮
     */
    hideBiddingActions() {
        const biddingActions = document.getElementById('biddingActions');
        if (biddingActions) {
            biddingActions.style.display = 'none';
        }
        
        // 停止倒计时
        if (this.biddingTimerInterval) {
            clearInterval(this.biddingTimerInterval);
            this.biddingTimerInterval = null;
        }
    }

    /**
     * 开始抢地主倒计时
     */
    startBiddingTimer(seconds) {
        const timerElement = document.getElementById('biddingTimer');
        if (!timerElement) return;
        
        let remaining = seconds;
        timerElement.textContent = remaining;
        
        // 清除之前的计时器
        if (this.biddingTimerInterval) {
            clearInterval(this.biddingTimerInterval);
        }
        
        this.biddingTimerInterval = setInterval(() => {
            remaining--;
            timerElement.textContent = remaining;
            
            // 倒计时结束，自动选择不抢
            if (remaining <= 0) {
                clearInterval(this.biddingTimerInterval);
                this.handleBid(false);
            }
        }, 1000);
    }

    /**
     * 处理抢地主选择
     */
    handleBid(bid) {
        console.log('选择抢地主:', bid);
        
        // 播放抢地主音效
        if (bid) {
            console.log('🔊 [音效] 准备播放抢地主音效');
            if (window.SoundManager) {
                console.log('🔊 [音效] SoundManager存在，调用playBid()');
                window.SoundManager.playBid();
            } else {
                console.warn('⚠️ [音效] SoundManager不存在');
            }
        }
        
        // 发送选择到服务器
        this.socket.emit('bid', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            bid: bid
        });
        
        // 隐藏抢地主按钮
        this.hideBiddingActions();
        
        // 显示消息
        const bidText = bid ? '抢地主' : '不抢';
        this.addGameMessage(`您选择：${bidText}`, 'game');
    }

    /**
     * 抢地主结果
     */
    onBidResult(data) {
        const bidText = data.bid ? '抢' : '不抢';
        this.addGameMessage(`${data.userName} 选择：${bidText}`, 'game');
        
        // 隐藏当前玩家的抢地主按钮
        this.hideBiddingActions();
        
        // 如果有下一个玩家，延迟后显示抢地主按钮
        if (data.nextBidderId) {
            setTimeout(() => {
                if (data.nextBidderId === this.currentPlayerId) {
                    this.addGameMessage(`轮到你抢地主了！`, 'info');
                    this.showBiddingActions();
                } else {
                    // 显示等待提示
                    const nextPlayer = this.roomPlayers.find(p => p.id === data.nextBidderId);
                    if (nextPlayer) {
                        this.addGameMessage(`等待 ${nextPlayer.name} 抢地主...`, 'info');
                    }
                }
            }, 1000); // 1秒延迟
        }
    }

    /**
     * 地主确定
     */
    onLandlordDetermined(data) {
        console.log('🎯 [地主确定] 收到数据:', data);
        
        // 保存地主ID和底牌
        this.landlordId = data.landlordId;
        this.bottomCards = data.bottomCards;
        
        // 设置首次出牌标志（地主先出）
        if (data.landlordId === this.currentPlayerId) {
            this.isFirstPlay = true;
            this.lastPlayedCards = null;
        }
        
        // 显示地主确定消息
        this.addGameMessage(`👑 ${data.landlordName} 成为地主！`, 'important');
        
        // 显示底牌
        if (data.bottomCards && data.bottomCards.length > 0) {
            this.addGameMessage(`底牌：${data.bottomCards.join(' ')}`, 'game');
            
            // 显示底牌动画（中央）
            this.showBottomCardsAnimation(data.bottomCards);
            
            // 在桌面顶端显示底牌（持续显示）
            setTimeout(() => {
                this.displayBottomCardsOnTable(data.bottomCards);
            }, 2000); // 等待中央动画完成
        }
        
        // 添加地主标识
        this.showLandlordBadge(data.landlordId, data.landlordName);
        
        // 如果我是地主，更新手牌
        if (data.landlordId === this.currentPlayerId) {
            console.log('✅ 我是地主，更新手牌');
            if (data.landlordCards && data.landlordCards.length > 0) {
                this.playerHand = data.landlordCards;
                this.addGameMessage(`🎴 您获得底牌，现在有 ${data.landlordCards.length} 张牌`, 'success');
                
                // 延迟渲染，等待底牌动画完成
                setTimeout(() => {
                    this.renderPlayerHand();
                }, 2000);
            }
        }
        
        // 更新玩家角色标记
        this.updatePlayerRoles(data.roles);
    }

    /**
     * 轮到出牌
     */
    onTurnToPlay(data) {
        console.log('🎴 [轮到出牌] 收到turn_to_play事件:', data);
        console.log('🎴 [轮到出牌] 当前玩家ID:', this.currentPlayerId);
        console.log('🎴 [轮到出牌] 事件中的玩家ID:', data.playerId);
        console.log('🎴 [轮到出牌] 当前lastPlayedCards:', this.lastPlayedCards);
        
        if (data.playerId === this.currentPlayerId) {
            this.isMyTurn = true;
            
            // 重置提示索引
            CardHintHelper.resetHintIndex();
            
            // 判断是否可以不出
            // 如果是首次出牌或新一轮开始，不能不出
            const canPass = !data.isFirstPlay && this.lastPlayedCards !== null;
            console.log('🎴 [轮到出牌] 是否可以不出:', canPass);
            console.log('🎴 [轮到出牌] 首次出牌:', data.isFirstPlay);
            console.log('🎴 [轮到出牌] 上家出牌:', this.lastPlayedCards);
            
            this.showGameActions(canPass);
            this.addGameMessage('🎯 轮到你出牌了！', 'important');
            
            // 开始倒计时（30秒）
            this.startTurnTimer(30);
        } else {
            this.isMyTurn = false;
            this.hideGameActions();
            this.stopTurnTimer(); // 不是自己的回合，停止倒计时
            this.addGameMessage(`等待 ${data.playerName} 出牌...`, 'system');
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
        console.log('🎴 [出牌事件] 收到cards_played事件:', data);
        console.log('🎴 [出牌事件] 出牌玩家:', data.playerName, '(', data.playerId, ')');
        console.log('🎴 [出牌事件] 出的牌:', data.cards);
        console.log('🎴 [出牌事件] 牌型:', data.cardType);
        
        // 第一次出牌时隐藏底牌
        if (this.bottomCards && this.bottomCards.length > 0) {
            console.log('🎴 [出牌事件] 第一次出牌，隐藏底牌');
            this.hideBottomCardsOnTable();
            this.bottomCards = null; // 清空底牌标记
        }
        
        // 更新上家出牌信息
        if (data.cardType) {
            this.lastPlayedCards = data.cardType;
            console.log('🎴 [出牌事件] 更新lastPlayedCards:', this.lastPlayedCards);
        } else {
            console.warn('⚠️ [出牌事件] cardType为空！');
        }
        
        // 显示出牌消息
        if (data.playerId !== this.currentPlayerId) {
            const cardTypeDesc = data.cardType ? data.cardType.description : '';
            this.addGameMessage(`${data.playerName} 出了 ${cardTypeDesc}：${data.cards.join(' ')}`, 'game');
        }
        
        // 显示上家出的牌在桌面上
        this.displayPlayedCards(data.cards, data.playerName, data.cardType);
    }

    /**
     * 玩家不出
     */
    onPlayerPassed(data) {
        console.log('🎴 [不出] 收到不出事件:', data);
        
        // 显示不出消息
        if (data.playerId !== this.currentPlayerId) {
            this.addGameMessage(`${data.playerName} 不出`, 'game');
        }
        
        // 如果所有人都pass了，清空上家出牌信息
        if (data.allPassed) {
            this.lastPlayedCards = null;
            this.addGameMessage('所有人都不出，可以出任意牌型', 'info');
        }
    }

    /**
     * 新一轮开始
     */
    onNewRoundStarted(data) {
        console.log('🔄 [新一轮] 收到new_round_started事件:', data);
        
        // 清空上家出牌信息
        this.lastPlayedCards = null;
        this.isFirstPlay = false;
        
        // 隐藏上家出牌区域
        this.hidePlayedCards();
        
        // 显示消息
        this.addGameMessage(`🔄 新一轮开始，${data.startPlayerName} 可以出任意牌型`, 'info');
        
        // 检查是否轮到自己出牌
        if (data.startPlayerId === this.currentPlayerId) {
            console.log('🎴 [新一轮] 轮到我出牌');
            this.isMyTurn = true;
            this.showGameActions(false); // 新一轮不能不出
        } else {
            console.log('🎴 [新一轮] 等待其他玩家出牌');
            this.isMyTurn = false;
            this.hideGameActions();
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
        this.addGameMessage(`🎊 游戏结束！${winnerName} 获胜！`, 'important');

        this.showRoomActions();
    }

    /**
     * 游戏结束（新事件）
     */
    onGameOver(data) {
        console.log('🎊 [游戏结束] 收到game_over事件:', data);
        this.gameStarted = false;
        this.isMyTurn = false;
        this.hideGameActions();

        const winnerName = data.winnerName || '未知玩家';
        const role = data.winnerRole === 'landlord' ? '地主' : '农民';
        this.addGameMessage(`🎊 游戏结束！${winnerName}（${role}）获胜！`, 'important');

        // 准备结算数据，包含当前玩家信息
        const currentUserId = this.currentPlayerId;
        const currentUserName = this.currentPlayer;
        const currentUserAvatar = this.playerAvatar;
        
        const settlementData = {
            ...data,
            currentUserId: currentUserId,
            currentUserName: currentUserName,
            currentUserAvatar: currentUserAvatar
        };
        
        // 保存到localStorage作为备份
        localStorage.setItem('lastGameSettlement', JSON.stringify(settlementData));
        
        console.log('🎊 [结算] 当前玩家信息:', {
            userId: currentUserId,
            userName: currentUserName,
            avatar: currentUserAvatar
        });

        // 跳转到结算页面，通过URL参数传递数据
        setTimeout(() => {
            const params = new URLSearchParams({
                data: encodeURIComponent(JSON.stringify(settlementData))
            });
            window.location.href = `/settlement/index.html?${params.toString()}`;
        }, 1500); // 延迟1.5秒让玩家看到消息
    }

    /**
     * 显示游戏结算界面
     */
    showSettlementModal(data) {
        const modal = document.getElementById('gameSettlementModal');
        if (!modal) return;

        // 设置标题
        const title = document.getElementById('settlementTitle');
        if (title) {
            title.textContent = data.landlordWin ? '地主获胜！' : '农民获胜！';
        }

        // 设置获胜者信息
        const winnerAvatar = document.getElementById('winnerAvatar');
        const winnerName = document.getElementById('winnerName');
        const winnerRole = document.getElementById('winnerRole');

        if (winnerAvatar) winnerAvatar.textContent = '👑';
        if (winnerName) winnerName.textContent = data.winnerName || '未知玩家';
        if (winnerRole) {
            const roleText = data.winnerRole === 'landlord' ? '地主' : '农民';
            winnerRole.textContent = roleText;
        }

        // 获取得分信息
        const score = data.score;
        let baseScore = 1;
        let multiplier = 1;
        let totalScore = 1;
        let multiplierDesc = [];

        if (score) {
            baseScore = score.baseScore || 1;
            multiplier = score.playerScores?.[0]?.multipliers?.total || 1;
            totalScore = baseScore * multiplier;
            
            // 格式化倍数说明
            const multipliers = score.playerScores?.[0]?.multipliers;
            if (multipliers) {
                if (multipliers.bomb > 1) {
                    const bombCount = Math.log2(multipliers.bomb);
                    multiplierDesc.push(`炸弹×${bombCount}`);
                }
                if (multipliers.rocket > 1) {
                    const rocketCount = Math.log(multipliers.rocket) / Math.log(4);
                    multiplierDesc.push(`王炸×${rocketCount}`);
                }
                if (multipliers.spring > 1) {
                    multiplierDesc.push('春天');
                }
                if (multipliers.antiSpring > 1) {
                    multiplierDesc.push('反春');
                }
            }
        }

        // 设置得分信息
        const baseScoreEl = document.getElementById('baseScore');
        const multiplierEl = document.getElementById('multiplier');
        const totalScoreEl = document.getElementById('totalScore');

        if (baseScoreEl) baseScoreEl.textContent = baseScore;
        if (multiplierEl) {
            let text = `×${multiplier}`;
            if (multiplierDesc.length > 0) {
                text += ` (${multiplierDesc.join(', ')})`;
            }
            multiplierEl.textContent = text;
        }
        if (totalScoreEl) {
            const sign = data.winnerId === this.currentPlayerId ? '+' : '-';
            totalScoreEl.textContent = `${sign}${totalScore}`;
            totalScoreEl.style.color = sign === '+' ? '#27ae60' : '#e74c3c';
        }

        // 显示详细得分（如果有）
        if (score && score.playerScores) {
            console.log('💰 [结算] 详细得分:', score);
            score.playerScores.forEach(ps => {
                console.log(`   ${ps.playerName} (${ps.role}): ${ps.finalScore > 0 ? '+' : ''}${ps.finalScore}`);
            });
        }

        // 绑定按钮事件
        const viewProfileBtn = document.getElementById('viewProfileBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');
        const backToLobbyBtn = document.getElementById('backToLobbyBtn');

        if (viewProfileBtn) {
            viewProfileBtn.onclick = () => this.viewProfile();
        }

        if (playAgainBtn) {
            playAgainBtn.onclick = () => this.playAgain();
        }

        if (backToLobbyBtn) {
            backToLobbyBtn.onclick = () => this.backToLobby();
        }

        // 显示弹窗
        modal.style.display = 'flex';
    }

    /**
     * 再来一局
     */
    playAgain() {
        console.log('🔄 再来一局');
        const modal = document.getElementById('gameSettlementModal');
        if (modal) modal.style.display = 'none';

        // 重置游戏状态
        this.resetGameState();
        
        // 显示房间操作按钮
        this.showRoomActions();
        
        // 隐藏开始游戏按钮
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            console.log('🔧 [再来一局] 隐藏开始游戏按钮');
            startGameBtn.style.display = 'none';
        }
        
        this.addGameMessage('🔄 准备开始新一局...', 'info');
        
        // 自动发送准备事件
        this.socket.emit('player_ready', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId
        });
        
        console.log('🔄 [再来一局] 已发送player_ready事件');
    }

    /**
     * 重置游戏状态
     */
    resetGameState() {
        this.gameStarted = false;
        this.isMyTurn = false;
        this.playerHand = [];
        this.selectedCards = [];
        this.lastPlayedCards = null;
        this.isFirstPlay = false;
        this.landlordId = null;
        this.bottomCards = null;

        // 清空手牌显示
        const playerHandEl = document.getElementById('playerHand');
        if (playerHandEl) {
            playerHandEl.innerHTML = '';
        }

        // 隐藏底牌
        this.hideBottomCardsOnTable();

        // 隐藏上家出牌
        this.hidePlayedCards();

        // 清除玩家角色标记
        this.roomPlayers.forEach(player => {
            const playerEl = document.getElementById(`player-${player.id}`);
            if (playerEl) {
                const badge = playerEl.querySelector('.landlord-badge');
                if (badge) badge.remove();
            }
        });
    }

    /**
     * 更新房间玩家显示（逆时针排列）
     */
    updateRoomPlayers() {
        if (!this.roomPlayers || this.roomPlayers.length === 0) return;

        // 找到当前玩家的索引
        const myIndex = this.roomPlayers.findIndex(p => 
            p.id === this.currentPlayerId || p.name === this.currentPlayer
        );
        
        if (myIndex === -1) return;

        // 更新当前玩家（底部）
        this.updatePlayerPosition('current', this.roomPlayers[myIndex]);

        // 更新左侧玩家（逆时针下一位）
        if (this.roomPlayers.length >= 2) {
            const leftIndex = (myIndex + 1) % this.roomPlayers.length;
            this.updatePlayerPosition('topLeft', this.roomPlayers[leftIndex]);
        }

        // 更新右侧玩家（逆时针再下一位）
        if (this.roomPlayers.length >= 3) {
            const rightIndex = (myIndex + 2) % this.roomPlayers.length;
            this.updatePlayerPosition('topRight', this.roomPlayers[rightIndex]);
        }
    }

    /**
     * 更新单个玩家位置
     */
    updatePlayerPosition(position, player) {
        if (!player) return;

        const positionMap = {
            'current': {
                container: 'currentPlayerPosition',
                avatar: 'currentPlayerAvatar',
                name: 'currentPlayerNameDisplay',
                status: 'currentPlayerCardCount'
            },
            'topLeft': {
                container: 'topLeftPlayer',
                avatar: 'topLeftPlayerAvatar',
                name: 'topLeftPlayerName',
                status: 'topLeftCardCount'
            },
            'topRight': {
                container: 'topRightPlayer',
                avatar: 'topRightPlayerAvatar',
                name: 'topRightPlayerName',
                status: 'topRightCardCount'
            }
        };

        const ids = positionMap[position];
        if (!ids) return;

        // 显示容器
        const container = document.getElementById(ids.container);
        if (container) {
            container.classList.remove('hidden');
        }

        // 更新头像 - 对于当前玩家使用保存的头像
        const avatar = document.getElementById(ids.avatar);
        if (avatar) {
            if (position === 'current' && this.playerAvatar) {
                avatar.textContent = this.playerAvatar;
            } else {
                avatar.textContent = player.avatar || '👤';
            }
        }

        // 更新名称
        const name = document.getElementById(ids.name);
        if (name) {
            name.textContent = player.name;
        }

        // 更新状态
        const status = document.getElementById(ids.status);
        if (status) {
            status.textContent = player.ready ? '已准备' : '未准备';
        }
    }

    /**
     * 获取玩家头像
     */
    getPlayerAvatar(index) {
        const avatars = ['👑', '🎲', '🎯', '🎪', '🎨'];
        return avatars[index % avatars.length];
    }

    /**
     * 为玩家列表补充avatar字段
     * 优先使用服务器返回的avatar，确保所有客户端看到的头像一致
     */
    enrichPlayersWithAvatars(players) {
        if (!players || !Array.isArray(players)) return [];
        
        console.log('🎨 [enrichPlayersWithAvatars] 输入玩家列表:', players);
        
        const result = players.map((player, index) => {
            console.log(`🎨 处理玩家 ${player.name}:`, {
                hasAvatar: !!player.avatar,
                avatar: player.avatar,
                isCurrentPlayer: player.id === this.currentPlayerId || player.name === this.currentPlayer,
                currentPlayerAvatar: this.playerAvatar
            });
            
            // 优先使用服务器返回的avatar（服务器基于玩家名称生成固定头像）
            if (player.avatar) {
                console.log(`✅ 使用服务器avatar: ${player.avatar}`);
                return player;
            }
            
            // 如果是当前玩家且有保存的头像，使用它
            if ((player.id === this.currentPlayerId || player.name === this.currentPlayer) && this.playerAvatar) {
                console.log(`✅ 使用当前玩家avatar: ${this.playerAvatar}`);
                return {
                    ...player,
                    avatar: this.playerAvatar
                };
            }
            
            // 尝试从旧的roomPlayers中找到对应玩家的avatar
            const existingPlayer = this.roomPlayers?.find(p => 
                p.id === player.id || p.name === player.name
            );
            
            if (existingPlayer && existingPlayer.avatar) {
                console.log(`✅ 使用旧玩家avatar: ${existingPlayer.avatar}`);
                return {
                    ...player,
                    avatar: existingPlayer.avatar
                };
            }
            
            // 最后才使用本地生成的avatar（作为后备方案）
            const fallbackAvatar = this.getPlayerAvatar(index);
            console.log(`⚠️ 使用后备avatar: ${fallbackAvatar}`);
            return {
                ...player,
                avatar: fallbackAvatar
            };
        });
        
        console.log('🎨 [enrichPlayersWithAvatars] 输出玩家列表:', result);
        return result;
    }

    /**
     * 添加游戏消息
     */
    addGameMessage(message, type = 'game') {
        const messageLog = document.getElementById('roomMessageLog');
        if (!messageLog) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const time = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        messageDiv.innerHTML = `
            <span class="message-time">[${time}]</span>
            <span class="message-content">${message}</span>
        `;

        messageLog.appendChild(messageDiv);
        messageLog.scrollTop = messageLog.scrollHeight;
    }

    /**
     * 发牌动画
     */
    async dealCardsWithAnimation(cards) {
        if (!cards || cards.length === 0) return;

        this.playerHand = cards;
        this.gameStarted = true;

        // 显示桌面中央发牌动画
        await this.showCenterDealingAnimation();

        const cardContainer = document.getElementById('playerHand');
        if (!cardContainer) return;

        // 显示发牌提示
        this.addGameMessage('🎴 开始发牌...', 'game');
        
        // 清空容器
        cardContainer.innerHTML = '';
        cardContainer.style.display = 'flex';

        // 逐张发牌动画
        for (let i = 0; i < cards.length; i++) {
            await this.animateCard(cards[i], i);
            await this.sleep(50); // 每张牌间隔50ms，更流畅
        }

        // 动画完成后显示最终手牌
        setTimeout(() => {
            this.addGameMessage(`✅ 发牌完成！您获得了 ${cards.length} 张牌`, 'success');
            this.renderPlayerHand();
            // 隐藏中央发牌动画
            this.hideCenterDealingAnimation();
        }, 500);
    }

    /**
     * 显示桌面中央发牌动画
     */
    async showCenterDealingAnimation() {
        console.log('🎬 [发牌动画] 开始显示中央发牌动画');
        
        const centerArea = document.getElementById('centerDealingArea');
        const cardsContainer = document.getElementById('dealingCardsContainer');
        const message = document.getElementById('dealingMessage');
        
        console.log('🎬 [发牌动画] 元素查找结果:', {
            centerArea: !!centerArea,
            cardsContainer: !!cardsContainer,
            message: !!message
        });
        
        if (!centerArea || !cardsContainer) {
            console.error('❌ [发牌动画] 找不到发牌动画元素！');
            return;
        }

        // 显示区域
        centerArea.style.display = 'block';
        message.textContent = '正在发牌...';
        
        console.log('🎬 [发牌动画] 已设置display=block');
        
        // 清空容器
        cardsContainer.innerHTML = '';
        
        // 创建3张扑克牌动画（代表发给3个玩家）
        for (let i = 0; i < 3; i++) {
            await this.sleep(200);
            const card = document.createElement('div');
            card.className = 'dealing-card';
            card.textContent = '🎴';
            cardsContainer.appendChild(card);
            console.log(`🎬 [发牌动画] 添加第${i+1}张牌`);
        }
        
        console.log('🎬 [发牌动画] 所有牌已添加，等待500ms');
        await this.sleep(500);
        console.log('🎬 [发牌动画] 中央动画完成');
    }

    /**
     * 隐藏桌面中央发牌动画
     */
    hideCenterDealingAnimation() {
        const centerArea = document.getElementById('centerDealingArea');
        if (centerArea) {
            centerArea.style.display = 'none';
        }
    }

    /**
     * 显示底牌动画
     */
    async showBottomCardsAnimation(bottomCards) {
        console.log('🎴 [底牌动画] 开始显示底牌:', bottomCards);
        
        const centerArea = document.getElementById('centerDealingArea');
        const cardsContainer = document.getElementById('dealingCardsContainer');
        const message = document.getElementById('dealingMessage');
        
        if (!centerArea || !cardsContainer) {
            console.error('❌ [底牌动画] 找不到动画元素');
            return;
        }

        // 显示区域
        centerArea.style.display = 'block';
        message.textContent = '底牌';
        
        // 清空容器
        cardsContainer.innerHTML = '';
        
        // 显示3张底牌
        for (let i = 0; i < bottomCards.length; i++) {
            await this.sleep(200);
            const card = document.createElement('div');
            card.className = 'dealing-card';
            card.textContent = bottomCards[i];
            cardsContainer.appendChild(card);
            console.log(`🎴 [底牌动画] 显示第${i+1}张底牌: ${bottomCards[i]}`);
        }
        
        // 停留1.5秒后隐藏
        await this.sleep(1500);
        centerArea.style.display = 'none';
        console.log('🎴 [底牌动画] 底牌动画完成');
    }

    /**
     * 在桌面顶端显示底牌
     */
    displayBottomCardsOnTable(bottomCards) {
        console.log('🎴 [底牌显示] 在桌面顶端显示底牌:', bottomCards);
        
        const bottomCardsDisplay = document.getElementById('bottomCardsDisplay');
        const bottomCardsContainer = document.getElementById('bottomCardsContainer');
        
        if (!bottomCardsDisplay || !bottomCardsContainer) {
            console.error('❌ [底牌显示] 找不到底牌显示元素');
            return;
        }
        
        // 清空容器
        bottomCardsContainer.innerHTML = '';
        
        // 创建3张底牌
        bottomCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'bottom-card';
            
            // 解析卡牌
            const { value, suit, isJoker } = this.parseCard(card);
            
            // 根据花色或JOKER类型添加颜色类
            if (isJoker) {
                cardElement.classList.add(isJoker === 'big' ? 'red' : 'black');
            } else if (suit === '♥' || suit === '♦') {
                cardElement.classList.add('red');
            } else {
                cardElement.classList.add('black');
            }
            
            // 创建数字元素
            const valueSpan = document.createElement('div');
            valueSpan.className = 'card-value';
            if (isJoker) {
                valueSpan.classList.add('joker-text');
            }
            valueSpan.textContent = value;
            
            // 创建花色元素
            const suitSpan = document.createElement('div');
            suitSpan.className = 'card-suit';
            suitSpan.textContent = suit;
            
            // 添加到卡牌
            cardElement.appendChild(valueSpan);
            if (!isJoker) {
                cardElement.appendChild(suitSpan);
            }
            
            bottomCardsContainer.appendChild(cardElement);
        });
        
        // 显示底牌区域
        bottomCardsDisplay.style.display = 'flex';
        
        console.log('✅ [底牌显示] 底牌显示完成');
    }

    /**
     * 隐藏桌面顶端的底牌
     */
    hideBottomCardsOnTable() {
        console.log('🎴 [底牌显示] 隐藏底牌');
        
        const bottomCardsDisplay = document.getElementById('bottomCardsDisplay');
        if (bottomCardsDisplay) {
            bottomCardsDisplay.style.display = 'none';
        }
    }

    /**
     * 显示上家出的牌在桌面中央
     */
    displayPlayedCards(cards, playerName, cardType) {
        console.log('🎴 [上家出牌] 显示上家出的牌:', cards, playerName, cardType);
        
        const playedCardsArea = document.getElementById('playedCardsArea');
        const playedCardsLabel = document.getElementById('playedCardsLabel');
        const playedCardsContainer = document.getElementById('playedCardsContainer');
        
        if (!playedCardsArea || !playedCardsContainer) {
            console.error('❌ [上家出牌] 找不到显示元素');
            return;
        }
        
        // 清空容器
        playedCardsContainer.innerHTML = '';
        
        // 更新标签
        const cardTypeDesc = cardType ? cardType.description : '';
        playedCardsLabel.textContent = `${playerName} 出牌：${cardTypeDesc}`;
        
        // 创建卡牌元素
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'played-card';
            
            // 解析卡牌
            const { value, suit, isJoker } = this.parseCard(card);
            
            // 根据花色或JOKER类型添加颜色类
            if (isJoker) {
                cardElement.classList.add(isJoker === 'big' ? 'red' : 'black');
            } else if (suit === '♥' || suit === '♦') {
                cardElement.classList.add('red');
            } else {
                cardElement.classList.add('black');
            }
            
            // 创建数字元素
            const valueSpan = document.createElement('div');
            valueSpan.className = 'card-value';
            if (isJoker) {
                valueSpan.classList.add('joker-text');
            }
            valueSpan.textContent = value;
            
            // 创建花色元素
            const suitSpan = document.createElement('div');
            suitSpan.className = 'card-suit';
            suitSpan.textContent = suit;
            
            // 添加到卡牌
            cardElement.appendChild(valueSpan);
            if (!isJoker) {
                cardElement.appendChild(suitSpan);
            }
            
            playedCardsContainer.appendChild(cardElement);
        });
        
        // 显示区域
        playedCardsArea.style.display = 'flex';
        
        console.log('✅ [上家出牌] 显示完成');
    }

    /**
     * 隐藏上家出牌区域
     */
    hidePlayedCards() {
        const playedCardsArea = document.getElementById('playedCardsArea');
        if (playedCardsArea) {
            playedCardsArea.style.display = 'none';
        }
    }

    /**
     * 显示地主标识
     */
    showLandlordBadge(landlordId, landlordName) {
        console.log('👑 [地主标识] 显示地主标识:', landlordId, landlordName);
        
        // 移除所有现有的地主标识
        document.querySelectorAll('.landlord-badge').forEach(badge => badge.remove());
        document.querySelectorAll('.player-position').forEach(pos => pos.classList.remove('landlord'));
        
        // 为地主玩家添加标识
        if (landlordId === this.currentPlayerId) {
            // 当前玩家是地主
            const currentPlayerPos = document.getElementById('currentPlayerPosition');
            if (currentPlayerPos) {
                currentPlayerPos.classList.add('landlord');
                
                // 添加地主徽章
                const badge = document.createElement('div');
                badge.className = 'landlord-badge';
                badge.textContent = '👑';
                badge.title = '地主';
                currentPlayerPos.appendChild(badge);
            }
            
            // 更新名字显示
            const nameDisplay = document.getElementById('currentPlayerNameDisplay');
            if (nameDisplay) {
                nameDisplay.textContent = '我 👑';
            }
        } else {
            // 其他玩家是地主
            // 查找地主玩家的位置
            const players = this.roomPlayers || [];
            const landlordPlayer = players.find(p => p.id === landlordId || p.name === landlordName);
            
            if (landlordPlayer) {
                // 根据玩家位置添加标识
                const playerElements = [
                    { id: 'topLeftPlayer', name: 'topLeftPlayerName' },
                    { id: 'topRightPlayer', name: 'topRightPlayerName' }
                ];
                
                for (const elem of playerElements) {
                    const nameElem = document.getElementById(elem.name);
                    if (nameElem && nameElem.textContent === landlordName) {
                        const playerPos = document.getElementById(elem.id);
                        if (playerPos) {
                            playerPos.classList.add('landlord');
                            
                            // 添加地主徽章
                            const badge = document.createElement('div');
                            badge.className = 'landlord-badge';
                            badge.textContent = '👑';
                            badge.title = '地主';
                            playerPos.appendChild(badge);
                        }
                        break;
                    }
                }
            }
        }
        
        console.log('✅ [地主标识] 地主标识显示完成');
    }

    /**
     * 更新玩家角色标记
     */
    updatePlayerRoles(roles) {
        console.log('👑 [角色标记] 更新玩家角色:', roles);
        
        if (!roles) return;
        
        // 更新所有玩家的角色标记
        Object.keys(roles).forEach(playerId => {
            const role = roles[playerId];
            const isLandlord = role === 'landlord';
            
            // 更新当前玩家
            if (playerId === this.currentPlayerId) {
                const nameDisplay = document.getElementById('currentPlayerNameDisplay');
                if (nameDisplay) {
                    nameDisplay.textContent = isLandlord ? '我 👑' : '我';
                }
            } else {
                // 更新其他玩家（需要根据玩家位置更新）
                // TODO: 实现其他玩家的角色标记更新
            }
        });
    }

    /**
     * 单张牌动画
     */
    async animateCard(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card card-dealing';
        cardElement.textContent = card;
        cardElement.style.setProperty('--deal-delay', `${index * 0.03}s`);

        const container = document.getElementById('playerHand');
        if (container) {
            container.appendChild(cardElement);
        }

        return new Promise(resolve => {
            setTimeout(resolve, 100);
        });
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        console.log('🎯 [隐藏房间按钮] 开始隐藏房间操作按钮');
        
        const roomActions = document.getElementById('roomActions');
        const overlay = document.getElementById('gameControlsOverlay');
        const startGameBtn = document.getElementById('startGameBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');

        if (roomActions) {
            roomActions.style.display = 'none';
            console.log('✅ roomActions 已隐藏');
        }
        if (overlay) {
            overlay.style.display = 'none';
            console.log('✅ overlay 已隐藏');
        }
        if (startGameBtn) {
            startGameBtn.style.display = 'none';
            console.log('✅ startGameBtn 已隐藏');
        }
        if (leaveRoomBtn) {
            leaveRoomBtn.style.display = 'none';
            console.log('✅ leaveRoomBtn 已隐藏');
        }
    }

    /**
     * 显示游戏操作按钮
     * @param {boolean} canPass - 是否可以不出（新一轮开始时不能不出）
     */
    showGameActions(canPass = true) {
        const gameActions = document.getElementById('gameActions');
        const overlay = document.getElementById('gameControlsOverlay');
        const passBtn = document.getElementById('passBtn');

        if (overlay) overlay.style.display = 'flex';
        if (gameActions) gameActions.style.display = 'flex';
        
        // 根据是否可以不出来显示/隐藏"不出"按钮
        if (passBtn) {
            if (canPass) {
                passBtn.style.display = 'inline-block';
            } else {
                passBtn.style.display = 'none';
            }
        }
    }

    /**
     * 隐藏游戏操作按钮
     */
    hideGameActions() {
        const gameActions = document.getElementById('gameActions');
        if (gameActions) gameActions.style.display = 'none';
    }

    /**
     * 显示游戏区域（扑克牌区域）
     */
    showGameArea() {
        const gameArea = document.getElementById('gameArea');
        const playerHand = document.getElementById('playerHand');
        
        if (gameArea) {
            gameArea.style.display = 'block';
            this.log('🎴 游戏区域已显示');
        }
        
        if (playerHand) {
            playerHand.style.display = 'flex';
            this.log('🃏 手牌区域已显示');
        }
    }

    /**
     * 日志输出
     */
    log(message) {
        console.log(`[房间] ${message}`);
    }

    /**
     * 渲染手牌（竖直排列，数字在上花色在下）
     */
    renderPlayerHand() {
        const container = document.getElementById('playerHand');
        if (!container) return;

        container.innerHTML = '';

        if (!this.playerHand || this.playerHand.length === 0) {
            container.innerHTML = '<div class="no-cards">等待发牌...</div>';
            return;
        }

        // 排序手牌：从大到小
        const sortedHand = this.sortCards([...this.playerHand]);
        const cardCount = sortedHand.length;
        
        sortedHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            // 分离数字和花色
            const {value, suit, isJoker} = this.parseCard(card);
            
            // 根据花色或JOKER类型添加颜色类
            if (isJoker) {
                // 大王红色，小王黑色
                cardElement.classList.add(isJoker === 'big' ? 'red' : 'black');
            } else {
                const colorClass = this.getCardColor(card);
                if (colorClass) {
                    cardElement.classList.add(colorClass);
                }
            }
            
            // 创建卡牌内容：数字在上，花色在下
            const valueSpan = document.createElement('div');
            valueSpan.className = 'card-value';
            if (isJoker) {
                valueSpan.classList.add('joker-text'); // 添加JOKER特殊类
            }
            valueSpan.textContent = value;
            
            const suitSpan = document.createElement('div');
            suitSpan.className = 'card-suit';
            suitSpan.textContent = suit;
            
            cardElement.appendChild(valueSpan);
            cardElement.appendChild(suitSpan);
            
            cardElement.dataset.index = index;
            cardElement.dataset.card = card;

            // 单击选择
            cardElement.addEventListener('click', () => this.toggleCardSelection(cardElement));
            
            // 拖拽选择
            cardElement.addEventListener('mousedown', (e) => this.onCardMouseDown(e, cardElement));
            cardElement.addEventListener('mouseenter', () => this.onCardMouseEnter(cardElement));

            container.appendChild(cardElement);
        });
        
        console.log(`✅ 渲染手牌完成: ${cardCount}张牌，竖直排列`);
    }
    
    /**
     * 解析卡牌，分离数字和花色
     */
    parseCard(card) {
        // 处理大小王 - 改为JOKER显示
        if (card === '大王' || card === '🃏大王' || card.includes('大王')) {
            return { value: 'JOKER', suit: '', isJoker: 'big' };
        }
        if (card === '小王' || card === '🃏小王' || card.includes('小王')) {
            return { value: 'JOKER', suit: '', isJoker: 'small' };
        }
        
        // 处理JOKER格式
        if (card.includes('JOKER')) {
            return { value: 'JOKER', suit: '', isJoker: 'big' };
        }
        
        // 分离花色和数字
        const suits = ['♠', '♥', '♦', '♣'];
        let suit = '';
        let value = card;
        
        for (const s of suits) {
            if (card.includes(s)) {
                suit = s;
                value = card.replace(s, '');
                break;
            }
        }
        
        return { value, suit };
    }

    /**
     * 排序卡牌（从大到小）
     */
    sortCards(cards) {
        const rankOrder = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
            '🃏小王': 16, '小王': 16,
            '🃏大王': 17, '大王': 17
        };
        
        const suitOrder = { '♦': 1, '♣': 2, '♥': 3, '♠': 4 };
        
        return cards.sort((a, b) => {
            // 获取牌面值
            let rankA, rankB;
            
            // 处理大小王
            if (a.includes('王')) {
                rankA = rankOrder[a] || (a.includes('大') ? 17 : 16);
            } else {
                const {value: valueA} = this.parseCard(a);
                rankA = rankOrder[valueA] || 0;
            }
            
            if (b.includes('王')) {
                rankB = rankOrder[b] || (b.includes('大') ? 17 : 16);
            } else {
                const {value: valueB} = this.parseCard(b);
                rankB = rankOrder[valueB] || 0;
            }
            
            // 先按牌面值排序（从大到小）
            if (rankA !== rankB) {
                return rankB - rankA;
            }
            
            // 牌面值相同，按花色排序
            const {suit: suitA} = this.parseCard(a);
            const {suit: suitB} = this.parseCard(b);
            return (suitOrder[suitB] || 0) - (suitOrder[suitA] || 0);
        });
    }

    /**
     * 获取卡牌颜色类
     */
    getCardColor(card) {
        // 红桃♥和方块♦是红色
        if (card.includes('♥') || card.includes('♦')) {
            return 'red';
        }
        // 黑桃♠和梅花♣是黑色
        if (card.includes('♠') || card.includes('♣')) {
            return 'black';
        }
        // 大小王
        if (card.includes('王')) {
            return card.includes('大') ? 'red' : 'black';
        }
        return 'black'; // 默认黑色
    }

    /**
     * 切换卡牌选择
     */
    toggleCardSelection(cardElement) {
        cardElement.classList.toggle('selected');
        // CSS已经处理了transform和z-index，不需要在这里设置
    }

    /**
     * 出牌
     */
    playCards() {
        // 停止倒计时
        this.stopTurnTimer();
        
        const container = document.getElementById('playerHand');
        if (!container) return;

        const selectedCards = container.querySelectorAll('.card.selected');
        if (selectedCards.length === 0) {
            this.addGameMessage('❌ 请选择要出的牌', 'error');
            return;
        }

        // 从dataset中获取原始卡牌字符串
        const cards = Array.from(selectedCards).map(card => card.dataset.card);
        console.log('🎴 [出牌] 选中的牌:', cards);
        console.log('🎴 [出牌] 玩家手牌:', this.playerHand);

        // 验证出牌是否合法
        const validation = CardValidator.validate(
            cards,
            this.lastPlayedCards,  // 上家出的牌
            this.isFirstPlay,      // 是否首次出牌
            this.playerHand        // 玩家手牌
        );

        if (!validation.valid) {
            this.addGameMessage(`❌ ${validation.reason}`, 'error');
            return;
        }

        // 显示牌型信息
        console.log('🎴 [出牌] 牌型:', validation.cardType);
        this.addGameMessage(`✅ 出牌：${validation.cardType.description}`, 'success');
        
        // 播放出牌音效（根据牌型）
        this.playCardTypeSound(validation.cardType);

        // 第一次出牌时隐藏底牌
        if (this.bottomCards && this.bottomCards.length > 0) {
            console.log('🎴 [出牌] 第一次出牌，隐藏底牌');
            this.hideBottomCardsOnTable();
            this.bottomCards = null;
        }

        // 立即显示自己出的牌在桌面上
        console.log('🎴 [出牌] 显示上家出牌');
        this.displayPlayedCards(cards, this.currentPlayer, validation.cardType);

        // 发送出牌请求
        console.log('🎴 [出牌] 准备发送play_cards事件');
        console.log('🎴 [出牌] roomId:', this.currentRoom.id);
        console.log('🎴 [出牌] userId:', this.currentPlayerId);
        console.log('🎴 [出牌] cards:', cards);
        console.log('🎴 [出牌] cardType:', validation.cardType);
        
        // 转换cardType为后端期望的格式（小写type）
        const cardTypeForBackend = {
            type: CardValidator.normalizeType(validation.cardType.type),
            value: validation.cardType.value,
            cards: validation.cardType.cards,
            description: validation.cardType.description
        };
        console.log('🎴 [出牌] 转换后的cardType:', cardTypeForBackend);
        
        this.socket.emit('play_cards', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId,
            cards: cards,
            cardType: cardTypeForBackend
        });
        
        console.log('🎴 [出牌] play_cards事件已发送');

        // 从手牌数组中移除出的牌
        cards.forEach(card => {
            const index = this.playerHand.indexOf(card);
            if (index > -1) {
                this.playerHand.splice(index, 1);
            }
        });
        console.log('🎴 [出牌] 剩余手牌:', this.playerHand.length, '张');
        
        // 从DOM中移除出的牌
        selectedCards.forEach(card => card.remove());
        
        // 保存本次出牌信息
        this.lastPlayedCards = validation.cardType;
        this.isFirstPlay = false;
        
        // 隐藏操作按钮
        this.hideGameActions();
    }

    /**
     * 不出牌
     */
    passTurn() {
        // 停止倒计时
        this.stopTurnTimer();
        
        this.socket.emit('pass_turn', {
            roomId: this.currentRoom.id,
            userId: this.currentPlayerId
        });

        this.addMessage('选择不出牌');
        this.hideGameActions();
    }

    /**
     * 显示出牌提示
     */
    showHint() {
        console.log('💡 [提示] 请求出牌提示');

        if (!this.playerHand || this.playerHand.length === 0) {
            this.addGameMessage('❌ 没有手牌', 'error');
            return;
        }

        // 转换手牌格式：字符串 -> 对象
        const playerHandObjects = this.convertCardsToObjects(this.playerHand);
        console.log('💡 [提示] 转换后的手牌:', playerHandObjects);

        // 获取提示
        const hintCards = CardHintHelper.getHint(
            playerHandObjects,
            this.lastPlayedCards,
            this.isFirstPlay
        );

        if (!hintCards || hintCards.length === 0) {
            this.addGameMessage('💡 没有可出的牌，自动不出', 'info');
            // 自动不出
            this.passTurn();
            return;
        }

        console.log('💡 [提示] 推荐出牌:', hintCards);

        // 清除之前的选中
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => card.classList.remove('selected'));

        // 高亮推荐的牌
        hintCards.forEach(hintCard => {
            // 将对象格式转回字符串格式用于匹配DOM
            const cardString = typeof hintCard === 'string' ? hintCard : `${hintCard.suit}${hintCard.rank}`;
            
            const cardElement = Array.from(allCards).find(el => 
                el.dataset.card === cardString
            );
            if (cardElement) {
                cardElement.classList.add('selected');
            }
        });

        // 显示提示消息
        const cardType = CardTypeDetector.detect(hintCards);
        const message = cardType && cardType.description 
            ? `💡 建议出：${cardType.description}` 
            : '💡 建议出这些牌';
        
        this.addGameMessage(message, 'info');
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
     * 显示错误消息
     */
    showErrorMessage(message) {
        // 创建错误提示框
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-overlay';
        errorDiv.innerHTML = `
            <div class="error-message-box">
                <div class="error-icon">⚠️</div>
                <div class="error-title">无法加入房间</div>
                <div class="error-content">${message}</div>
                <div class="error-footer">3秒后自动返回大厅...</div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 3秒后移除提示框
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    /**
     * 鼠标按下开始拖拽
     */
    onCardMouseDown(e, cardElement) {
        e.preventDefault();
        this.isDragging = true;
        this.hasDragged = false; // 重置拖拽标记
        this.dragStartSelected = cardElement.classList.contains('selected');
        this.dragStartCard = cardElement; // 记录起始卡牌
        
        // 不在这里切换状态，等到真正拖拽时再切换
        
        // 添加全局鼠标松开监听
        document.addEventListener('mouseup', this.onMouseUp.bind(this), { once: true });
    }
    
    /**
     * 鼠标进入卡牌区域
     */
    onCardMouseEnter(cardElement) {
        if (!this.isDragging) return;
        
        // 标记为已拖拽
        this.hasDragged = true;
        
        // 如果是第一次拖拽，先切换起始卡牌的状态
        if (this.dragStartCard && !this.dragStartCard.dataset.dragProcessed) {
            this.dragStartCard.dataset.dragProcessed = 'true';
            if (this.dragStartSelected) {
                this.dragStartCard.classList.remove('selected');
            } else {
                this.dragStartCard.classList.add('selected');
            }
        }
        
        // 根据拖拽开始时的状态，切换选中状态
        if (this.dragStartSelected) {
            // 如果开始时是选中的，拖拽时取消选中
            cardElement.classList.remove('selected');
        } else {
            // 如果开始时是未选中的，拖拽时选中
            cardElement.classList.add('selected');
        }
    }
    
    /**
     * 鼠标松开结束拖拽
     */
    onMouseUp() {
        // 清理拖拽标记
        if (this.dragStartCard) {
            delete this.dragStartCard.dataset.dragProcessed;
            this.dragStartCard = null;
        }
        
        this.isDragging = false;
        this.hasDragged = false;
    }
    
    /**
     * 开始出牌倒计时
     */
    startTurnTimer(duration = 30) {
        // 清除之前的计时器
        this.stopTurnTimer();
        
        this.turnTimeLeft = duration;
        this.updateTimerDisplay();
        
        // 显示倒计时UI
        const timerEl = document.getElementById('turnTimer');
        if (timerEl) {
            timerEl.style.display = 'block';
        }
        
        // 每秒更新一次
        this.turnTimer = setInterval(() => {
            this.turnTimeLeft--;
            this.updateTimerDisplay();
            
            if (this.turnTimeLeft <= 0) {
                this.stopTurnTimer();
                // 倒计时结束，自动处理
                if (this.isMyTurn) {
                    // 如果是首次出牌或新一轮（不能不出），自动按提示出牌
                    if (this.isFirstPlay || !this.lastPlayedCards) {
                        console.log('⏰ [倒计时] 时间到，自动按提示出牌');
                        this.addGameMessage('⏰ 时间到，自动出牌', 'warning');
                        this.autoPlayByHint();
                    } else {
                        // 否则自动不出
                        console.log('⏰ [倒计时] 时间到，自动不出');
                        this.addGameMessage('⏰ 时间到，自动不出', 'warning');
                        this.passTurn();
                    }
                }
            }
        }, 1000);
    }
    
    /**
     * 停止倒计时
     */
    stopTurnTimer() {
        if (this.turnTimer) {
            clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
        
        // 隐藏倒计时UI
        const timerEl = document.getElementById('turnTimer');
        if (timerEl) {
            timerEl.style.display = 'none';
        }
    }
    
    /**
     * 更新倒计时显示
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('turnTimer');
        if (timerEl) {
            timerEl.textContent = `⏰ ${this.turnTimeLeft}秒`;
            
            // 时间不足10秒时变红
            if (this.turnTimeLeft <= 10) {
                timerEl.classList.add('warning');
            } else {
                timerEl.classList.remove('warning');
            }
        }
    }

    /**
     * 自动按提示出牌
     */
    autoPlayByHint() {
        console.log('🤖 [自动出牌] 开始自动出牌');
        
        if (!this.playerHand || this.playerHand.length === 0) {
            console.warn('⚠️ [自动出牌] 没有手牌');
            this.passTurn();
            return;
        }
        
        // 转换手牌格式
        const playerHandObjects = this.convertCardsToObjects(this.playerHand);
        
        // 获取提示
        const hintCards = CardHintHelper.getHint(
            playerHandObjects,
            this.lastPlayedCards,
            this.isFirstPlay
        );
        
        if (!hintCards || hintCards.length === 0) {
            console.log('🤖 [自动出牌] 没有可出的牌，自动不出');
            this.passTurn();
            return;
        }
        
        console.log('🤖 [自动出牌] 推荐出牌:', hintCards);
        
        // 自动选中推荐的牌
        const container = document.getElementById('playerHand');
        if (!container) return;
        
        // 清除之前的选中
        const allCards = container.querySelectorAll('.card');
        allCards.forEach(card => card.classList.remove('selected'));
        
        // 选中推荐的牌
        hintCards.forEach(hintCard => {
            // 将对象格式转回字符串格式用于匹配DOM
            const cardString = typeof hintCard === 'string' ? hintCard : `${hintCard.suit}${hintCard.rank}`;
            
            const cardElement = Array.from(allCards).find(el => 
                el.dataset.card === cardString
            );
            if (cardElement) {
                cardElement.classList.add('selected');
            }
        });
        
        // 延迟500ms后自动出牌，让玩家看到选中的牌
        setTimeout(() => {
            this.playCards();
        }, 500);
    }
    
    /**
     * 初始化音效系统
     */
    initSound() {
        if (this.soundInitialized) return;
        
        if (window.TempSoundGenerator) {
            window.TempSoundGenerator.init();
            this.soundInitialized = true;
            console.log('🔊 音效系统已初始化');
        }
    }
    
    /**
     * 播放背景音乐
     */
    playBgMusic() {
        if (window.SoundManager) {
            window.SoundManager.playBgMusic('game');
            console.log('🎵 背景音乐已开始播放');
        }
    }
    
    /**
     * 停止背景音乐
     */
    stopBgMusic() {
        if (window.SoundManager) {
            window.SoundManager.stopBgMusic();
            console.log('🎵 背景音乐已停止');
        }
    }
    
    /**
     * 播放音效
     */
    playSound(soundName) {
        if (!this.soundInitialized) return;
        
        if (window.TempSoundGenerator && typeof window.TempSoundGenerator[soundName] === 'function') {
            window.TempSoundGenerator[soundName]();
        }
    }
    
    /**
     * 根据牌型播放音效
     */
    playCardTypeSound(cardType) {
        if (!cardType) {
            this.playSound('play');
            return;
        }
        
        const type = cardType.type || cardType.TYPE;
        switch (type) {
            case 'bomb':
            case 'BOMB':
                this.playSound('bomb');
                break;
            case 'rocket':
            case 'ROCKET':
                this.playSound('rocket');
                break;
            case 'airplane':
            case 'airplane_with_wings':
            case 'PLANE':
            case 'PLANE_PLUS_WINGS':
                this.playSound('plane');
                break;
            default:
                this.playSound('play');
        }
    }

    /**
     * 查看个人中心
     */
    viewProfile() {
        console.log('👤 [查看战绩] 跳转到个人中心');
        
        // 优先使用当前玩家信息（确保无痕窗口显示正确），其次使用localStorage
        const userId = this.currentPlayerId || localStorage.getItem('userId');
        const userName = this.currentPlayerName || this.currentPlayer || localStorage.getItem('userName');
        const playerAvatar = this.playerAvatar || localStorage.getItem('playerAvatar') || '👤';
        
        console.log('👤 获取的用户信息:', {
            currentPlayerId: this.currentPlayerId,
            currentPlayerName: this.currentPlayerName,
            currentPlayer: this.currentPlayer,
            playerAvatar: this.playerAvatar,
            userId,
            userName
        });
        
        if (userId) {
            // 通过URL参数传递用户信息，确保无痕窗口也能正确显示
            const params = new URLSearchParams({
                userId: userId,
                userName: userName,
                playerAvatar: playerAvatar
            });
            window.location.href = `/profile?${params.toString()}`;
            console.log('👤 跳转参数:', { userId, userName, playerAvatar });
        } else {
            console.error('❌ 无法获取用户ID');
            window.location.href = '/profile';
        }
    }

    /**
     * 返回大厅
     */
    backToLobby() {
        console.log('🚪 [返回大厅] 准备离开房间');
        
        // 停止倒计时
        this.stopTurnTimer();
        
        // 停止背景音乐
        this.stopBgMusic();
        
        // 通知后端离开房间
        if (this.socket && this.currentRoom) {
            console.log('🚪 [返回大厅] 发送leave_game事件');
            this.socket.emit('leave_game', {
                roomId: this.currentRoom.id,
                userId: this.currentPlayerId
            });
            
            // 等待一小段时间让事件发送完成，然后跳转
            setTimeout(() => {
                window.location.href = '/lobby/index.html';
            }, 100);
        } else {
            // 如果没有socket或房间信息，直接跳转
            window.location.href = '/lobby/index.html';
        }
    }

    /**
     * 将字符串格式的牌转换为对象格式
     * '♠3' -> {suit: '♠', rank: '3', value: 3}
     */
    convertCardsToObjects(cards) {
        if (!cards || !Array.isArray(cards)) return [];
        
        return cards.map(card => {
            // 如果已经是对象格式，直接返回
            if (typeof card === 'object' && card.rank !== undefined) {
                return card;
            }
            
            // 字符串格式转对象
            if (typeof card === 'string') {
                const suit = card.charAt(0); // 花色
                const rank = card.substring(1); // 点数
                const value = CardTypeDetector.RANK_VALUES[rank] || 0;
                
                return {
                    suit: suit,
                    rank: rank,
                    value: value
                };
            }
            
            console.error('❌ 无效的卡牌格式:', card);
            return null;
        }).filter(card => card !== null);
    }
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    window.roomClient = new DoudizhuRoomClient();
    console.log('✅ roomClient 已暴露到全局变量');
});
