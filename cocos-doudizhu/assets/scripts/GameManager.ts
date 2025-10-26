import { _decorator, Component, Node, director, game, sys } from 'cc';
import { NetworkManager } from './Network/NetworkManager';
import { UIManager } from './UI/UIManager';
import { AudioManager } from './Audio/AudioManager';
import { GameData } from './Data/GameData';
import { PlatformUtils } from './Utils/PlatformUtils';

const { ccclass, property } = _decorator;

/**
 * 游戏主管理器
 * 负责整个游戏的初始化和全局管理
 */
@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    public networkNode: Node = null!;
    
    @property(Node)
    public uiNode: Node = null!;
    
    @property(Node)
    public audioNode: Node = null!;

    private static _instance: GameManager = null!;
    private _networkManager: NetworkManager = null!;
    private _uiManager: UIManager = null!;
    private _audioManager: AudioManager = null!;
    private _gameData: GameData = null!;

    public static get instance(): GameManager {
        return this._instance;
    }

    public get networkManager(): NetworkManager {
        return this._networkManager;
    }

    public get uiManager(): UIManager {
        return this._uiManager;
    }

    public get audioManager(): AudioManager {
        return this._audioManager;
    }

    public get gameData(): GameData {
        return this._gameData;
    }

    onLoad() {
        // 单例模式
        if (GameManager._instance) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;

        // 防止场景切换时销毁
        game.addPersistRootNode(this.node);

        this.initManagers();
        this.initGame();
    }

    /**
     * 初始化所有管理器
     */
    private initManagers(): void {
        // 初始化网络管理器
        if (this.networkNode) {
            this._networkManager = this.networkNode.getComponent(NetworkManager);
            if (!this._networkManager) {
                this._networkManager = this.networkNode.addComponent(NetworkManager);
            }
        }

        // 初始化UI管理器
        if (this.uiNode) {
            this._uiManager = this.uiNode.getComponent(UIManager);
            if (!this._uiManager) {
                this._uiManager = this.uiNode.addComponent(UIManager);
            }
        }

        // 初始化音频管理器
        if (this.audioNode) {
            this._audioManager = this.audioNode.getComponent(AudioManager);
            if (!this._audioManager) {
                this._audioManager = this.audioNode.addComponent(AudioManager);
            }
        }

        // 初始化游戏数据
        this._gameData = new GameData();
    }

    /**
     * 初始化游戏
     */
    private initGame(): void {
        console.log('🎮 斗地主游戏初始化开始');

        // 设置游戏帧率
        game.frameRate = 60;

        // 设置屏幕适配
        this.setupScreenAdaptation();

        // 初始化网络连接
        this._networkManager?.init();

        // 初始化UI系统
        this._uiManager?.init();

        // 初始化音频系统
        this._audioManager?.init();

        // 加载登录场景
        this.loadLoginScene();

        console.log('🎮 斗地主游戏初始化完成');
    }

    /**
     * 设置屏幕适配
     */
    private setupScreenAdaptation(): void {
        // 获取平台信息
        const platform = PlatformUtils.getPlatform();
        const screenInfo = PlatformUtils.getScreenInfo();
        const adaptationStrategy = PlatformUtils.getAdaptationStrategy();

        console.log('📱 平台信息:', PlatformUtils.getDeviceInfo());
        console.log('📐 屏幕信息:', screenInfo);

        // 设置Canvas适配策略
        const canvas = this.node.getComponent('Canvas');
        if (canvas) {
            switch (adaptationStrategy) {
                case 'FIT_HEIGHT':
                    canvas.fitHeight = true;
                    canvas.fitWidth = false;
                    break;
                case 'FIT_WIDTH':
                    canvas.fitHeight = false;
                    canvas.fitWidth = true;
                    break;
                case 'SHOW_ALL':
                    canvas.fitHeight = true;
                    canvas.fitWidth = true;
                    break;
                case 'NO_BORDER':
                    canvas.fitHeight = false;
                    canvas.fitWidth = false;
                    break;
            }
        }

        // 设置设计分辨率
        const recommendedResolution = PlatformUtils.getRecommendedResolution();
        director.root.resize(recommendedResolution.width, recommendedResolution.height);

        // 根据平台进行特殊处理
        if (PlatformUtils.isWeChatGame()) {
            this.setupWeChatGame();
        } else if (PlatformUtils.isNative()) {
            this.setupNative();
        } else if (PlatformUtils.isWeb()) {
            this.setupWeb();
        }
    }

    /**
     * 设置微信小游戏
     */
    private setupWeChatGame(): void {
        console.log('🎮 设置微信小游戏');
        
        // 微信小游戏特殊处理
        if (typeof wx !== 'undefined') {
            // 设置屏幕常亮
            wx.setKeepScreenOn({
                keepScreenOn: true
            });

            // 监听网络状态
            wx.onNetworkStatusChange((res: any) => {
                console.log('🌐 网络状态变化:', res);
                if (!res.isConnected) {
                    this._uiManager?.showNetworkError();
                }
            });
        }
    }

    /**
     * 设置原生平台
     */
    private setupNative(): void {
        console.log('📱 设置原生平台');
        
        // 原生平台特殊处理
        // 这里可以添加原生平台相关的初始化代码
    }

    /**
     * 设置Web平台
     */
    private setupWeb(): void {
        console.log('🌐 设置Web平台');
        
        // Web平台特殊处理
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    }

    /**
     * 处理窗口大小变化
     */
    private handleWindowResize(): void {
        console.log('📐 窗口大小变化');
        this._uiManager?.updateUIAdaptation();
    }

    /**
     * 处理页面隐藏
     */
    private handlePageHidden(): void {
        console.log('👁️ 页面隐藏');
        this._audioManager?.pauseBackgroundMusic();
    }

    /**
     * 处理页面显示
     */
    private handlePageVisible(): void {
        console.log('👁️ 页面显示');
        this._audioManager?.resumeBackgroundMusic();
    }

    /**
     * 加载登录场景
     */
    private loadLoginScene(): void {
        director.loadScene('Login', (error) => {
            if (error) {
                console.error('加载登录场景失败:', error);
            } else {
                console.log('✅ 登录场景加载成功');
            }
        });
    }

    /**
     * 切换到大厅场景
     */
    public switchToLobby(): void {
        director.loadScene('Lobby', (error) => {
            if (error) {
                console.error('加载大厅场景失败:', error);
            } else {
                console.log('✅ 大厅场景加载成功');
            }
        });
    }

    /**
     * 切换到游戏场景
     */
    public switchToGame(): void {
        director.loadScene('Game', (error) => {
            if (error) {
                console.error('加载游戏场景失败:', error);
            } else {
                console.log('✅ 游戏场景加载成功');
            }
        });
    }

    /**
     * 游戏退出
     */
    public exitGame(): void {
        // 断开网络连接
        this._networkManager?.disconnect();

        // 清理资源
        this._gameData?.clear();

        // 退出游戏
        game.end();
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null!;
        }
    }
}
