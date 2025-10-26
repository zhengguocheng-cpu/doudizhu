import { _decorator, Component, Node, Label, Button, Sprite, SpriteFrame, tween, Vec3, Layout, Prefab, instantiate, sys } from 'cc';
import { GameManager } from '../GameManager';
import { Player, Room } from '../Data/GameData';

const { ccclass, property } = _decorator;

/**
 * 游戏界面控制器
 */
@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    public gameTable: Node = null!;

    @property(Node)
    public playerHand: Node = null!;

    @property(Node)
    public gameControls: Node = null!;

    @property(Button)
    public playCardsButton: Button = null!;

    @property(Button)
    public passButton: Button = null!;

    @property(Button)
    public leaveRoomButton: Button = null!;

    @property(Label)
    public statusLabel: Label = null!;

    @property(Label)
    public currentPlayerLabel: Label = null!;

    @property(SpriteFrame)
    public cardBackSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    public cardSprites: SpriteFrame[] = [];

    // 玩家位置节点
    private playerPositions: { [key: string]: Node } = {};
    private playerCards: { [key: string]: Node[] } = {};
    private selectedCards: string[] = [];
    private myCards: Node[] = [];

    onLoad() {
        this.initUI();
        this.setupEventListeners();
        this.initGame();
    }

    /**
     * 初始化UI
     */
    private initUI(): void {
        console.log('🎮 游戏界面初始化');

        // 初始化玩家位置
        this.initPlayerPositions();

        // 初始化手牌区域
        this.initPlayerHand();

        // 初始化游戏控制
        this.initGameControls();

        // 更新游戏状态
        this.updateGameState();
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 按钮事件
        this.playCardsButton.node.on('click', this.onPlayCardsClicked, this);
        this.passButton.node.on('click', this.onPassClicked, this);
        this.leaveRoomButton.node.on('click', this.onLeaveRoomClicked, this);

        // 网络事件监听
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.on('game_started', this.onGameStarted, this);
            networkManager.on('cards_dealt', this.onCardsDealt, this);
            networkManager.on('game_state_updated', this.onGameStateUpdated, this);
            networkManager.on('cards_played', this.onCardsPlayed, this);
            networkManager.on('game_ended', this.onGameEnded, this);
            networkManager.on('player_joined', this.onPlayerJoined, this);
            networkManager.on('player_left', this.onPlayerLeft, this);
        }
    }

    /**
     * 初始化游戏
     */
    private initGame(): void {
        const gameData = GameManager.instance?.gameData;
        if (gameData && gameData.currentRoom) {
            this.updateRoomInfo(gameData.currentRoom);
        }
    }

    /**
     * 初始化玩家位置
     */
    private initPlayerPositions(): void {
        // 查找玩家位置节点
        const positions = ['top', 'left', 'right', 'bottom'];
        positions.forEach(pos => {
            const node = this.gameTable.getChildByName(`${pos}Player`);
            if (node) {
                this.playerPositions[pos] = node;
            }
        });
    }

    /**
     * 初始化手牌区域
     */
    private initPlayerHand(): void {
        if (!this.playerHand) return;

        // 设置手牌区域布局
        const layout = this.playerHand.getComponent('Layout');
        if (layout) {
            layout.type = 1; // HORIZONTAL
            layout.spacingX = 5;
        }
    }

    /**
     * 初始化游戏控制
     */
    private initGameControls(): void {
        this.updateControlButtons();
    }

    /**
     * 更新房间信息
     */
    private updateRoomInfo(room: Room): void {
        console.log('🏠 更新房间信息:', room);

        // 更新玩家信息
        room.players.forEach((player, index) => {
            this.updatePlayerInfo(player, index);
        });

        // 更新游戏状态
        this.updateGameState();
    }

    /**
     * 更新玩家信息
     */
    private updatePlayerInfo(player: Player, index: number): void {
        const positions = ['top', 'left', 'right', 'bottom'];
        const position = positions[index] || 'bottom';
        
        const playerNode = this.playerPositions[position];
        if (!playerNode) return;

        // 更新玩家名称
        const nameLabel = playerNode.getChildByName('NameLabel');
        if (nameLabel) {
            const label = nameLabel.getComponent(Label);
            if (label) {
                label.string = player.name;
            }
        }

        // 更新玩家头像
        const avatarSprite = playerNode.getChildByName('AvatarSprite');
        if (avatarSprite) {
            const sprite = avatarSprite.getComponent(Sprite);
            if (sprite) {
                // 这里可以设置头像图片
                sprite.spriteFrame = null; // 暂时清空
            }
        }

        // 更新手牌数量
        const cardCountLabel = playerNode.getChildByName('CardCountLabel');
        if (cardCountLabel) {
            const label = cardCountLabel.getComponent(Label);
            if (label) {
                label.string = `${player.cardCount}张`;
            }
        }

        // 更新当前玩家指示
        const currentIndicator = playerNode.getChildByName('CurrentIndicator');
        if (currentIndicator) {
            currentIndicator.active = player.isCurrentTurn;
        }
    }

    /**
     * 更新游戏状态
     */
    private updateGameState(): void {
        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        // 更新状态标签
        if (this.statusLabel) {
            this.statusLabel.string = gameData.getGameStatusDescription();
        }

        // 更新当前玩家标签
        if (this.currentPlayerLabel) {
            this.currentPlayerLabel.string = `当前玩家: ${gameData.currentPlayer}`;
        }

        // 更新控制按钮
        this.updateControlButtons();
    }

    /**
     * 更新控制按钮
     */
    private updateControlButtons(): void {
        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        const canPlay = gameData.isMyTurn && gameData.selectedCards.length > 0;
        const canPass = gameData.isMyTurn;

        this.playCardsButton.interactable = canPlay;
        this.passButton.interactable = canPass;

        // 更新出牌按钮文本
        const playLabel = this.playCardsButton.getComponentInChildren(Label);
        if (playLabel) {
            playLabel.string = `出牌 (${gameData.selectedCards.length})`;
        }
    }

    /**
     * 游戏开始回调
     */
    private onGameStarted(data: any): void {
        console.log('🎮 游戏开始:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData) {
            gameData.gameStarted = true;
            gameData.gamePhase = 'grab_landlord';
        }

        this.updateGameState();
        this.showStatus('游戏开始！', true);
    }

    /**
     * 发牌回调
     */
    private onCardsDealt(data: any): void {
        console.log('🃏 发牌:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData) {
            gameData.setPlayerCards(data.cards || []);
            this.updatePlayerHand(data.cards || []);
        }
    }

    /**
     * 游戏状态更新回调
     */
    private onGameStateUpdated(data: any): void {
        console.log('🎮 游戏状态更新:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData) {
            gameData.currentPlayer = data.currentPlayer;
            gameData.isMyTurn = data.currentPlayer === gameData.userId;
        }

        this.updateGameState();
    }

    /**
     * 出牌回调
     */
    private onCardsPlayed(data: any): void {
        console.log('🃏 出牌:', data);

        // 更新最后出的牌
        const gameData = GameManager.instance?.gameData;
        if (gameData) {
            gameData.setLastPlayedCards(data.cards || [], data.playerId);
        }

        // 播放出牌动画
        this.playCardsAnimation(data.cards || [], data.playerId);
    }

    /**
     * 游戏结束回调
     */
    private onGameEnded(data: any): void {
        console.log('🎮 游戏结束:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData) {
            gameData.setGameEnded(data.winner);
        }

        this.showStatus(`游戏结束！${data.winner} 获胜！`, true);
        this.updateGameState();
    }

    /**
     * 玩家加入回调
     */
    private onPlayerJoined(data: any): void {
        console.log('👤 玩家加入:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData && gameData.currentRoom) {
            gameData.updateRoom(data.room);
            this.updateRoomInfo(data.room);
        }
    }

    /**
     * 玩家离开回调
     */
    private onPlayerLeft(data: any): void {
        console.log('👤 玩家离开:', data);

        const gameData = GameManager.instance?.gameData;
        if (gameData && gameData.currentRoom) {
            gameData.updateRoom(data.room);
            this.updateRoomInfo(data.room);
        }
    }

    /**
     * 更新手牌显示
     */
    private updatePlayerHand(cards: string[]): void {
        // 清除现有手牌
        this.clearPlayerHand();

        // 创建新手牌
        cards.forEach((card, index) => {
            this.createCard(card, index);
        });
    }

    /**
     * 清除手牌
     */
    private clearPlayerHand(): void {
        this.myCards.forEach(card => {
            if (card && card.isValid) {
                card.destroy();
            }
        });
        this.myCards = [];
    }

    /**
     * 创建扑克牌
     */
    private createCard(cardString: string, index: number): void {
        const cardNode = new Node(`Card_${index}`);
        const sprite = cardNode.addComponent(Sprite);
        const button = cardNode.addComponent(Button);

        // 设置卡片图片（这里需要根据cardString设置对应的图片）
        sprite.spriteFrame = this.getCardSprite(cardString);

        // 设置卡片大小和位置
        cardNode.setScale(0.8, 0.8, 1);
        cardNode.setPosition(index * 60, 0, 0);

        // 设置点击事件
        button.node.on('click', () => this.selectCard(cardString), this);

        // 添加到手牌区域
        this.playerHand.addChild(cardNode);
        this.myCards.push(cardNode);
    }

    /**
     * 获取卡片精灵
     */
    private getCardSprite(cardString: string): SpriteFrame | null {
        // 这里需要根据cardString返回对应的SpriteFrame
        // 暂时返回null，实际项目中需要实现卡片图片映射
        return null;
    }

    /**
     * 选择卡片
     */
    private selectCard(cardString: string): void {
        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        if (gameData.selectedCards.includes(cardString)) {
            gameData.removeSelectedCard(cardString);
        } else {
            gameData.addSelectedCard(cardString);
        }

        this.updateSelectedCards();
        this.updateControlButtons();
    }

    /**
     * 更新选中卡片显示
     */
    private updateSelectedCards(): void {
        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        this.myCards.forEach((cardNode, index) => {
            const cardString = gameData.playerHand[index];
            if (cardString) {
                const isSelected = gameData.selectedCards.includes(cardString);
                const targetY = isSelected ? 20 : 0;
                
                // 使用Cocos Creator 3.x的tween动画
                tween(cardNode)
                    .to(0.2, { position: new Vec3(cardNode.position.x, targetY, 0) })
                    .start();
            }
        });
    }

    /**
     * 出牌按钮点击
     */
    private onPlayCardsClicked(): void {
        const gameData = GameManager.instance?.gameData;
        if (!gameData || gameData.selectedCards.length === 0) return;

        console.log('🃏 出牌:', gameData.selectedCards);

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('play_cards', {
                roomId: gameData.currentRoom?.id,
                cards: gameData.selectedCards
            });
        }

        gameData.clearSelectedCards();
        this.updateSelectedCards();
        this.updateControlButtons();
    }

    /**
     * 不出按钮点击
     */
    private onPassClicked(): void {
        console.log('⏭️ 不出');

        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('pass_turn', {
                roomId: gameData.currentRoom?.id
            });
        }
    }

    /**
     * 离开房间按钮点击
     */
    private onLeaveRoomClicked(): void {
        console.log('🚪 离开房间');

        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('leave_room', {
                roomId: gameData.currentRoom?.id
            });
        }

        // 跳转回大厅
        GameManager.instance?.switchToLobby();
    }

    /**
     * 播放出牌动画
     */
    private playCardsAnimation(cards: string[], playerId: string): void {
        console.log('🎬 播放出牌动画:', cards, playerId);
        
        // 创建出牌动画效果
        const gameData = GameManager.instance?.gameData;
        if (!gameData) return;

        // 找到出牌玩家的位置
        const playerPosition = this.getPlayerPosition(playerId);
        if (!playerPosition) return;

        // 为每张牌创建飞出动画
        cards.forEach((card, index) => {
            const cardNode = this.createCardNode(card);
            if (cardNode) {
                // 设置初始位置
                cardNode.setPosition(playerPosition.x, playerPosition.y, 0);
                this.gameTable.addChild(cardNode);

                // 播放飞出动画
                tween(cardNode)
                    .to(0.5, { 
                        position: new Vec3(0, 0, 0),
                        scale: new Vec3(0.8, 0.8, 1)
                    })
                    .delay(1.0)
                    .to(0.3, { 
                        scale: new Vec3(0, 0, 1),
                        opacity: 0
                    })
                    .call(() => {
                        if (cardNode && cardNode.isValid) {
                            cardNode.destroy();
                        }
                    })
                    .start();
            }
        });
    }

    /**
     * 获取玩家位置
     */
    private getPlayerPosition(playerId: string): Vec3 | null {
        const gameData = GameManager.instance?.gameData;
        if (!gameData || !gameData.currentRoom) return null;

        const player = gameData.currentRoom.players.find(p => p.id === playerId);
        if (!player) return null;

        // 根据玩家位置返回对应的坐标
        switch (player.position) {
            case 'top':
                return new Vec3(0, 200, 0);
            case 'left':
                return new Vec3(-300, 0, 0);
            case 'right':
                return new Vec3(300, 0, 0);
            case 'bottom':
                return new Vec3(0, -200, 0);
            default:
                return new Vec3(0, 0, 0);
        }
    }

    /**
     * 创建卡片节点
     */
    private createCardNode(cardString: string): Node | null {
        const cardNode = new Node(`Card_${cardString}`);
        const sprite = cardNode.addComponent(Sprite);
        
        // 设置卡片图片
        const cardManager = GameManager.instance?.node.getComponent('CardManager');
        if (cardManager) {
            const cardSprite = cardManager.getCardSprite(cardString);
            if (cardSprite) {
                sprite.spriteFrame = cardSprite;
            }
        }

        // 设置卡片大小
        cardNode.setScale(0.6, 0.6, 1);
        
        return cardNode;
    }

    /**
     * 显示状态信息
     */
    private showStatus(message: string, isSuccess: boolean = true): void {
        if (this.statusLabel) {
            this.statusLabel.string = message;
            this.statusLabel.color = isSuccess ? 
                { r: 0, g: 255, b: 0, a: 255 } : 
                { r: 255, g: 0, b: 0, a: 255 };
        }
    }

    onDestroy() {
        // 移除事件监听
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.off('game_started', this.onGameStarted, this);
            networkManager.off('cards_dealt', this.onCardsDealt, this);
            networkManager.off('game_state_updated', this.onGameStateUpdated, this);
            networkManager.off('cards_played', this.onCardsPlayed, this);
            networkManager.off('game_ended', this.onGameEnded, this);
            networkManager.off('player_joined', this.onPlayerJoined, this);
            networkManager.off('player_left', this.onPlayerLeft, this);
        }
    }
}
