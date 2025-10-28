import { _decorator, Component, Node, Label, Button, ScrollView, Layout, Prefab, instantiate } from 'cc';
import { GameManager } from '../GameManager';
import { Room } from '../Data/GameData';

const { ccclass, property } = _decorator;

/**
 * 大厅界面控制器
 */
@ccclass('LobbyController')
export class LobbyController extends Component {
    @property(Label)
    public userNameLabel: Label = null!;

    @property(Label)
    public userScoreLabel: Label = null!;

    @property(Button)
    public refreshButton: Button = null!;

    @property(Button)
    public createRoomButton: Button = null!;

    @property(Button)
    public quickStartButton: Button = null!;

    @property(ScrollView)
    public roomScrollView: ScrollView = null!;

    @property(Node)
    public roomListContent: Node = null!;

    @property(Prefab)
    public roomItemPrefab: Prefab = null!;

    @property(Label)
    public statusLabel: Label = null!;

    private rooms: Room[] = [];
    private roomItems: Node[] = [];

    onLoad() {
        this.initUI();
        this.setupEventListeners();
        this.loadRooms();
    }

    /**
     * 初始化UI
     */
    private initUI(): void {
        console.log('🏠 大厅界面初始化');

        // 更新用户信息显示
        this.updateUserInfo();

        // 初始化房间列表
        this.initRoomList();
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 按钮事件
        this.refreshButton.node.on('click', this.onRefreshClicked, this);
        this.createRoomButton.node.on('click', this.onCreateRoomClicked, this);
        this.quickStartButton.node.on('click', this.onQuickStartClicked, this);

        // 网络事件监听
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.on('rooms_updated', this.onRoomsUpdated, this);
            networkManager.on('room_joined', this.onRoomJoined, this);
            networkManager.on('connected', this.onConnected, this);
            networkManager.on('disconnected', this.onDisconnected, this);
        }
    }

    /**
     * 更新用户信息显示
     */
    private updateUserInfo(): void {
        const gameData = GameManager.instance?.gameData;
        if (gameData && gameData.userInfo) {
            this.userNameLabel.string = gameData.userInfo.userName;
            this.userScoreLabel.string = `积分: ${gameData.userInfo.totalScore}`;
        }
    }

    /**
     * 初始化房间列表
     */
    private initRoomList(): void {
        if (!this.roomListContent) return;

        // 设置布局
        const layout = this.roomListContent.getComponent(Layout);
        if (layout) {
            layout.type = Layout.Type.VERTICAL;
            layout.spacingY = 10;
            layout.paddingTop = 10;
            layout.paddingBottom = 10;
        }
    }

    /**
     * 加载房间列表
     */
    private loadRooms(): void {
        console.log('🏠 加载房间列表');

        this.showStatus('正在加载房间...', true);

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('get_rooms');
        } else {
            this.showStatus('网络连接失败', false);
        }
    }

    /**
     * 刷新房间列表
     */
    private onRefreshClicked(): void {
        console.log('🔄 刷新房间列表');
        this.loadRooms();
    }

    /**
     * 创建房间
     */
    private onCreateRoomClicked(): void {
        console.log('➕ 创建房间');

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('create_room', {
                name: '我的房间',
                maxPlayers: 3,
                baseScore: 1
            });
        }
    }

    /**
     * 快速开始
     */
    private onQuickStartClicked(): void {
        console.log('🚀 快速开始');

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('quick_join', {
                userName: GameManager.instance?.gameData.userName || '玩家'
            });
        }
    }

    /**
     * 房间列表更新回调
     */
    private onRoomsUpdated(data: any): void {
        console.log('🏠 房间列表更新:', data);

        this.rooms = data.rooms || [];
        this.updateRoomList();
        this.showStatus(`找到 ${this.rooms.length} 个房间`, true);
    }

    /**
     * 加入房间成功回调
     */
    private onRoomJoined(data: any): void {
        console.log('✅ 加入房间成功:', data);

        // 更新游戏数据
        GameManager.instance?.gameData.updateRoom(data.room);

        // 跳转到游戏场景
        GameManager.instance?.switchToGame();
    }

    /**
     * 连接成功回调
     */
    private onConnected(): void {
        console.log('🌐 网络连接成功');
        this.loadRooms();
    }

    /**
     * 连接断开回调
     */
    private onDisconnected(): void {
        console.log('❌ 网络连接断开');
        this.showStatus('网络连接断开', false);
    }

    /**
     * 更新房间列表显示
     */
    private updateRoomList(): void {
        if (!this.roomListContent || !this.roomItemPrefab) return;

        // 清除现有房间项
        this.clearRoomItems();

        // 创建房间项
        this.rooms.forEach((room, index) => {
            this.createRoomItem(room, index);
        });

        // 如果没有房间，显示空状态
        if (this.rooms.length === 0) {
            this.showEmptyState();
        }
    }

    /**
     * 清除房间项
     */
    private clearRoomItems(): void {
        this.roomItems.forEach(item => {
            if (item && item.isValid) {
                item.destroy();
            }
        });
        this.roomItems = [];
    }

    /**
     * 创建房间项
     */
    private createRoomItem(room: Room, index: number): void {
        const roomItem = instantiate(this.roomItemPrefab);
        roomItem.setParent(this.roomListContent);

        // 设置房间信息
        this.setupRoomItem(roomItem, room, index);

        this.roomItems.push(roomItem);
    }

    /**
     * 设置房间项
     */
    private setupRoomItem(roomItem: Node, room: Room, index: number): void {
        // 获取房间项组件
        const roomItemController = roomItem.getComponent('RoomItemController');
        if (roomItemController) {
            roomItemController.setup(room, () => this.joinRoom(room.id));
        } else {
            // 如果没有专门的控制器，直接设置基本信息
            this.setupBasicRoomItem(roomItem, room);
        }
    }

    /**
     * 设置基础房间项（当没有专门控制器时）
     */
    private setupBasicRoomItem(roomItem: Node, room: Room): void {
        // 查找房间名称标签
        const nameLabel = roomItem.getChildByName('NameLabel');
        if (nameLabel) {
            const label = nameLabel.getComponent(Label);
            if (label) {
                label.string = room.name || `房间 ${room.id}`;
            }
        }

        // 查找玩家数量标签
        const playerCountLabel = roomItem.getChildByName('PlayerCountLabel');
        if (playerCountLabel) {
            const label = playerCountLabel.getComponent(Label);
            if (label) {
                label.string = `${room.players.length}/${room.maxPlayers}`;
            }
        }

        // 查找状态标签
        const statusLabel = roomItem.getChildByName('StatusLabel');
        if (statusLabel) {
            const label = statusLabel.getComponent(Label);
            if (label) {
                label.string = this.getRoomStatusText(room);
            }
        }

        // 设置加入按钮
        const joinButton = roomItem.getChildByName('JoinButton');
        if (joinButton) {
            const button = joinButton.getComponent(Button);
            if (button) {
                button.node.on('click', () => this.joinRoom(room.id), this);
                button.interactable = this.canJoinRoom(room);
            }
        }
    }

    /**
     * 获取房间状态文本
     */
    private getRoomStatusText(room: Room): string {
        if (room.gameStarted) {
            return '游戏中';
        }
        if (room.players.length >= room.maxPlayers) {
            return '已满员';
        }
        return '等待中';
    }

    /**
     * 检查是否可以加入房间
     */
    private canJoinRoom(room: Room): boolean {
        return !room.gameStarted && room.players.length < room.maxPlayers;
    }

    /**
     * 加入房间
     */
    private joinRoom(roomId: string): void {
        console.log('🚪 加入房间:', roomId);

        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('join_room', {
                roomId,
                userName: GameManager.instance?.gameData.userName || '玩家'
            });
        }
    }

    /**
     * 显示空状态
     */
    private showEmptyState(): void {
        // 这里可以显示一个空状态的提示
        console.log('📭 没有找到房间');
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
            networkManager.off('rooms_updated', this.onRoomsUpdated, this);
            networkManager.off('room_joined', this.onRoomJoined, this);
            networkManager.off('connected', this.onConnected, this);
            networkManager.off('disconnected', this.onDisconnected, this);
        }
    }
}


