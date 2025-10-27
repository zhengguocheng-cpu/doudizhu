import { _decorator, Component, Node, Canvas, UITransform, Widget } from 'cc';
import { GameManager } from '../GameManager';

const { ccclass, property } = _decorator;

/**
 * UI管理器
 * 负责管理所有UI界面的显示和隐藏
 */
@ccclass('UIManager')
export class UIManager extends Component {
    @property(Canvas)
    public canvas: Canvas = null!;

    @property(Node)
    public loadingPanel: Node = null!;

    @property(Node)
    public messagePanel: Node = null!;

    @property(Node)
    public confirmDialog: Node = null!;

    private currentScene: string = '';
    private uiLayers: { [key: string]: Node } = {};

    onLoad() {
        this.initUI();
    }

    /**
     * 初始化UI管理器
     */
    public init(): void {
        console.log('🎨 UI管理器初始化');

        // 设置Canvas适配
        this.setupCanvas();

        // 初始化UI层级
        this.initUILayers();

        // 隐藏所有面板
        this.hideAllPanels();
    }

    /**
     * 设置Canvas适配
     */
    private setupCanvas(): void {
        if (!this.canvas) return;

        // 设置Canvas适配模式
        const canvasTransform = this.canvas.getComponent(UITransform);
        if (canvasTransform) {
            // 设置设计分辨率
            canvasTransform.setContentSize(1920, 1080);
        }

        // 设置Canvas的Widget组件
        const widget = this.canvas.getComponent(Widget);
        if (widget) {
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.top = 0;
            widget.bottom = 0;
            widget.left = 0;
            widget.right = 0;
        }
    }

    /**
     * 初始化UI层级
     */
    private initUILayers(): void {
        // 这里可以定义不同的UI层级
        this.uiLayers = {
            'background': null,
            'game': null,
            'ui': null,
            'popup': null,
            'loading': null
        };
    }

    /**
     * 隐藏所有面板
     */
    private hideAllPanels(): void {
        if (this.loadingPanel) {
            this.loadingPanel.active = false;
        }
        if (this.messagePanel) {
            this.messagePanel.active = false;
        }
        if (this.confirmDialog) {
            this.confirmDialog.active = false;
        }
    }

    /**
     * 显示加载面板
     */
    public showLoading(message: string = '加载中...'): void {
        if (this.loadingPanel) {
            this.loadingPanel.active = true;
            // 这里可以设置加载文本
            const messageLabel = this.loadingPanel.getChildByName('MessageLabel');
            if (messageLabel) {
                const label = messageLabel.getComponent('Label');
                if (label) {
                    label.string = message;
                }
            }
        }
    }

    /**
     * 隐藏加载面板
     */
    public hideLoading(): void {
        if (this.loadingPanel) {
            this.loadingPanel.active = false;
        }
    }

    /**
     * 显示消息面板
     */
    public showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        if (this.messagePanel) {
            this.messagePanel.active = true;
            
            // 设置消息文本
            const messageLabel = this.messagePanel.getChildByName('MessageLabel');
            if (messageLabel) {
                const label = messageLabel.getComponent('Label');
                if (label) {
                    label.string = message;
                    
                    // 根据类型设置颜色
                    switch (type) {
                        case 'success':
                            label.color = { r: 0, g: 255, b: 0, a: 255 };
                            break;
                        case 'warning':
                            label.color = { r: 255, g: 165, b: 0, a: 255 };
                            break;
                        case 'error':
                            label.color = { r: 255, g: 0, b: 0, a: 255 };
                            break;
                        default:
                            label.color = { r: 255, g: 255, b: 255, a: 255 };
                            break;
                    }
                }
            }

            // 自动隐藏消息
            this.scheduleOnce(() => {
                this.hideMessage();
            }, 3.0);
        }
    }

    /**
     * 隐藏消息面板
     */
    public hideMessage(): void {
        if (this.messagePanel) {
            this.messagePanel.active = false;
        }
    }

    /**
     * 显示确认对话框
     */
    public showConfirmDialog(
        title: string, 
        message: string, 
        onConfirm: () => void, 
        onCancel?: () => void
    ): void {
        if (this.confirmDialog) {
            this.confirmDialog.active = true;
            
            // 设置标题
            const titleLabel = this.confirmDialog.getChildByName('TitleLabel');
            if (titleLabel) {
                const label = titleLabel.getComponent('Label');
                if (label) {
                    label.string = title;
                }
            }

            // 设置消息
            const messageLabel = this.confirmDialog.getChildByName('MessageLabel');
            if (messageLabel) {
                const label = messageLabel.getComponent('Label');
                if (label) {
                    label.string = message;
                }
            }

            // 设置确认按钮
            const confirmButton = this.confirmDialog.getChildByName('ConfirmButton');
            if (confirmButton) {
                const button = confirmButton.getComponent('Button');
                if (button) {
                    button.node.off('click');
                    button.node.on('click', () => {
                        this.hideConfirmDialog();
                        onConfirm();
                    });
                }
            }

            // 设置取消按钮
            const cancelButton = this.confirmDialog.getChildByName('CancelButton');
            if (cancelButton) {
                const button = cancelButton.getComponent('Button');
                if (button) {
                    button.node.off('click');
                    button.node.on('click', () => {
                        this.hideConfirmDialog();
                        if (onCancel) {
                            onCancel();
                        }
                    });
                }
            }
        }
    }

    /**
     * 隐藏确认对话框
     */
    public hideConfirmDialog(): void {
        if (this.confirmDialog) {
            this.confirmDialog.active = false;
        }
    }

    /**
     * 设置当前场景
     */
    public setCurrentScene(sceneName: string): void {
        this.currentScene = sceneName;
        console.log('🎬 当前场景:', sceneName);
    }

    /**
     * 获取当前场景
     */
    public getCurrentScene(): string {
        return this.currentScene;
    }

    /**
     * 显示Toast消息
     */
    public showToast(message: string, duration: number = 2.0): void {
        // 这里可以实现Toast消息显示
        console.log('🍞 Toast:', message);
        this.showMessage(message, 'info');
    }

    /**
     * 显示网络错误
     */
    public showNetworkError(): void {
        this.showMessage('网络连接失败，请检查网络设置', 'error');
    }

    /**
     * 显示服务器错误
     */
    public showServerError(message: string = '服务器错误'): void {
        this.showMessage(message, 'error');
    }

    /**
     * 显示成功消息
     */
    public showSuccess(message: string): void {
        this.showMessage(message, 'success');
    }

    /**
     * 显示警告消息
     */
    public showWarning(message: string): void {
        this.showMessage(message, 'warning');
    }

    /**
     * 显示信息消息
     */
    public showInfo(message: string): void {
        this.showMessage(message, 'info');
    }

    /**
     * 更新UI适配
     */
    public updateUIAdaptation(): void {
        // 这里可以根据屏幕尺寸更新UI适配
        console.log('📱 更新UI适配');
    }

    onDestroy() {
        // 清理资源
        this.hideAllPanels();
    }
}

