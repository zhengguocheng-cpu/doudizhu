import { _decorator, Component, Node, EditBox, Button, Label, Sprite, SpriteFrame, tween, Vec3, sys } from 'cc';
import { GameManager } from '../GameManager';
import { UserInfo } from '../Data/GameData';

const { ccclass, property } = _decorator;

/**
 * 登录界面控制器
 */
@ccclass('LoginController')
export class LoginController extends Component {
    @property(EditBox)
    public userNameInput: EditBox = null!;

    @property(Button)
    public loginButton: Button = null!;

    @property(Label)
    public statusLabel: Label = null!;

    @property(Node)
    public avatarContainer: Node = null!;

    @property(SpriteFrame)
    public avatarSprites: SpriteFrame[] = [];

    private selectedAvatar: string = '👤';
    private avatarOptions: string[] = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🎮', '🦸', '🦸‍♀️', '🎭'];

    onLoad() {
        this.initUI();
        this.setupEventListeners();
    }

    /**
     * 初始化UI
     */
    private initUI(): void {
        console.log('🔐 登录界面初始化');

        // 设置默认用户名
        this.userNameInput.string = '';

        // 初始化头像选择
        this.initAvatarSelection();

        // 设置按钮状态
        this.updateLoginButton();
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 用户名输入监听
        this.userNameInput.node.on('text-changed', this.onUserNameChanged, this);

        // 登录按钮监听
        this.loginButton.node.on('click', this.onLoginClicked, this);

        // 网络事件监听
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.on('authenticated', this.onAuthenticated, this);
            networkManager.on('auth_error', this.onAuthError, this);
            networkManager.on('connected', this.onConnected, this);
            networkManager.on('disconnected', this.onDisconnected, this);
        }
    }

    /**
     * 初始化头像选择
     */
    private initAvatarSelection(): void {
        if (!this.avatarContainer) return;

        // 创建头像选择按钮
        this.avatarOptions.forEach((avatar, index) => {
            const avatarNode = new Node(`Avatar_${index}`);
            const sprite = avatarNode.addComponent(Sprite);
            const button = avatarNode.addComponent(Button);
            const label = avatarNode.addComponent(Label);

            // 设置头像显示
            label.string = avatar;
            label.fontSize = 40;

            // 设置按钮大小和位置
            avatarNode.setScale(0.8, 0.8, 1);
            avatarNode.setPosition(
                (index % 5 - 2) * 80,
                Math.floor(index / 5) * -80,
                0
            );

            // 设置按钮事件
            button.node.on('click', () => this.selectAvatar(avatar), this);

            this.avatarContainer.addChild(avatarNode);
        });

        // 默认选择第一个头像
        this.selectAvatar(this.avatarOptions[0]);
    }

    /**
     * 选择头像
     */
    private selectAvatar(avatar: string): void {
        this.selectedAvatar = avatar;
        console.log('👤 选择头像:', avatar);

        // 更新头像选择状态
        this.avatarContainer.children.forEach((child, index) => {
            const isSelected = this.avatarOptions[index] === avatar;
            
            // 使用Cocos Creator 3.x的tween动画
            tween(child)
                .to(0.2, { scale: new Vec3(isSelected ? 1.0 : 0.8, isSelected ? 1.0 : 0.8, 1) })
                .start();
        });
    }

    /**
     * 用户名输入变化
     */
    private onUserNameChanged(): void {
        this.updateLoginButton();
    }

    /**
     * 更新登录按钮状态
     */
    private updateLoginButton(): void {
        const hasUserName = this.userNameInput.string.trim().length > 0;
        this.loginButton.interactable = hasUserName;
        
        if (hasUserName) {
            this.statusLabel.string = '点击登录进入游戏';
        } else {
            this.statusLabel.string = '请输入玩家昵称';
        }
    }

    /**
     * 登录按钮点击
     */
    private onLoginClicked(): void {
        const userName = this.userNameInput.string.trim();
        
        if (!userName) {
            this.showStatus('请输入玩家昵称', false);
            return;
        }

        if (userName.length > 10) {
            this.showStatus('昵称不能超过10个字符', false);
            return;
        }

        this.performLogin(userName, this.selectedAvatar);
    }

    /**
     * 执行登录
     */
    private performLogin(userName: string, avatar: string): void {
        console.log('🔐 开始登录:', { userName, avatar });

        this.showStatus('正在登录...', true);
        this.loginButton.interactable = false;

        // 发送认证请求
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.send('authenticate', {
                userName,
                avatar,
                userId: Date.now().toString() // 临时生成用户ID
            });
        } else {
            this.showStatus('网络连接失败', false);
            this.loginButton.interactable = true;
        }
    }

    /**
     * 认证成功回调
     */
    private onAuthenticated(data: any): void {
        console.log('✅ 认证成功:', data);

        // 保存用户信息
        const userInfo: UserInfo = {
            userId: data.userId || Date.now().toString(),
            userName: this.userNameInput.string.trim(),
            avatar: this.selectedAvatar,
            diamondCount: data.diamondCount || 1000,
            totalScore: data.totalScore || 0,
            winCount: data.winCount || 0,
            loseCount: data.loseCount || 0,
            isOnline: true
        };

        // 更新游戏数据
        GameManager.instance?.gameData.userInfo = userInfo;

        this.showStatus('登录成功！', true);

        // 播放成功动画
        this.playSuccessAnimation();

        // 延迟跳转到大厅
        this.scheduleOnce(() => {
            GameManager.instance?.switchToLobby();
        }, 1.0);
    }

    /**
     * 认证失败回调
     */
    private onAuthError(error: any): void {
        console.error('❌ 认证失败:', error);
        this.showStatus('登录失败: ' + (error.message || '未知错误'), false);
        this.loginButton.interactable = true;
    }

    /**
     * 连接成功回调
     */
    private onConnected(): void {
        console.log('🌐 网络连接成功');
        this.showStatus('网络连接成功', true);
    }

    /**
     * 连接断开回调
     */
    private onDisconnected(): void {
        console.log('❌ 网络连接断开');
        this.showStatus('网络连接断开，请检查网络', false);
        this.loginButton.interactable = true;
    }

    /**
     * 播放成功动画
     */
    private playSuccessAnimation(): void {
        // 播放按钮成功动画
        tween(this.loginButton.node)
            .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1) })
            .start();

        // 播放状态标签动画
        tween(this.statusLabel.node)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1.0, 1.0, 1) })
            .start();
    }

    /**
     * 显示状态信息
     */
    private showStatus(message: string, isSuccess: boolean = true): void {
        this.statusLabel.string = message;
        this.statusLabel.color = isSuccess ? 
            { r: 0, g: 255, b: 0, a: 255 } : 
            { r: 255, g: 0, b: 0, a: 255 };

        // 添加状态显示动画
        tween(this.statusLabel.node)
            .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1) })
            .start();
    }

    onDestroy() {
        // 移除事件监听
        const networkManager = GameManager.instance?.networkManager;
        if (networkManager) {
            networkManager.off('authenticated', this.onAuthenticated, this);
            networkManager.off('auth_error', this.onAuthError, this);
            networkManager.off('connected', this.onConnected, this);
            networkManager.off('disconnected', this.onDisconnected, this);
        }
    }
}
