import { _decorator, sys } from 'cc';

const { ccclass } = _decorator;

/**
 * 平台工具类
 * 提供平台相关的工具方法
 */
@ccclass('PlatformUtils')
export class PlatformUtils {
    /**
     * 获取平台类型
     */
    public static getPlatform(): string {
        if (sys.isNative) {
            if (sys.os === sys.OS.ANDROID) {
                return 'android';
            } else if (sys.os === sys.OS.IOS) {
                return 'ios';
            }
        } else if (sys.isBrowser) {
            return 'web';
        } else if (sys.isWeChatGame) {
            return 'wechat';
        }
        return 'unknown';
    }

    /**
     * 是否为移动端
     */
    public static isMobile(): boolean {
        return sys.isMobile;
    }

    /**
     * 是否为微信小游戏
     */
    public static isWeChatGame(): boolean {
        return sys.isWeChatGame;
    }

    /**
     * 是否为Web平台
     */
    public static isWeb(): boolean {
        return sys.isBrowser;
    }

    /**
     * 是否为原生平台
     */
    public static isNative(): boolean {
        return sys.isNative;
    }

    /**
     * 获取设备信息
     */
    public static getDeviceInfo(): any {
        return {
            platform: this.getPlatform(),
            isMobile: this.isMobile(),
            isWeChatGame: this.isWeChatGame(),
            isWeb: this.isWeb(),
            isNative: this.isNative(),
            language: sys.language,
            browserType: sys.browserType,
            browserVersion: sys.browserVersion,
            os: sys.os,
            osVersion: sys.osVersion,
            pixelRatio: sys.pixelRatio,
            screenSize: sys.windowSize
        };
    }

    /**
     * 获取屏幕适配信息
     */
    public static getScreenInfo(): any {
        const screenSize = sys.windowSize;
        const pixelRatio = sys.pixelRatio;
        
        return {
            width: screenSize.width,
            height: screenSize.height,
            pixelRatio: pixelRatio,
            isLandscape: screenSize.width > screenSize.height,
            isPortrait: screenSize.height > screenSize.width,
            aspectRatio: screenSize.width / screenSize.height
        };
    }

    /**
     * 检查是否支持音频
     */
    public static isAudioSupported(): boolean {
        return sys.audioSupport;
    }

    /**
     * 检查是否支持WebGL
     */
    public static isWebGLSupported(): boolean {
        return sys.capabilities.webgl;
    }

    /**
     * 检查是否支持WebGL2
     */
    public static isWebGL2Supported(): boolean {
        return sys.capabilities.webgl2;
    }

    /**
     * 获取网络状态
     */
    public static getNetworkType(): string {
        if (sys.isWeChatGame) {
            // 微信小游戏网络状态
            return 'wifi'; // 默认返回wifi，实际项目中需要调用微信API
        } else if (sys.isNative) {
            // 原生平台网络状态
            return 'wifi'; // 默认返回wifi，实际项目中需要调用原生API
        } else {
            // Web平台网络状态
            return navigator.onLine ? 'online' : 'offline';
        }
    }

    /**
     * 检查网络连接
     */
    public static isOnline(): boolean {
        if (sys.isWeChatGame || sys.isNative) {
            return true; // 移动端默认在线
        } else {
            return navigator.onLine;
        }
    }

    /**
     * 获取用户代理信息
     */
    public static getUserAgent(): string {
        if (sys.isWeChatGame) {
            return 'WeChatGame';
        } else if (sys.isNative) {
            return `Native-${sys.os}`;
        } else {
            return navigator.userAgent;
        }
    }

    /**
     * 获取设备唯一标识
     */
    public static getDeviceId(): string {
        // 这里应该根据平台获取设备唯一标识
        // 实际项目中需要调用相应的平台API
        return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取应用版本
     */
    public static getAppVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取引擎版本
     */
    public static getEngineVersion(): string {
        return sys.version;
    }

    /**
     * 检查是否支持触摸
     */
    public static isTouchSupported(): boolean {
        return sys.capabilities.touch;
    }

    /**
     * 检查是否支持键盘
     */
    public static isKeyboardSupported(): boolean {
        return sys.capabilities.keyboard;
    }

    /**
     * 检查是否支持鼠标
     */
    public static isMouseSupported(): boolean {
        return sys.capabilities.mouse;
    }

    /**
     * 获取推荐的设计分辨率
     */
    public static getRecommendedResolution(): { width: number; height: number } {
        const screenInfo = this.getScreenInfo();
        
        if (this.isMobile()) {
            // 移动端推荐分辨率
            if (screenInfo.isLandscape) {
                return { width: 1920, height: 1080 };
            } else {
                return { width: 1080, height: 1920 };
            }
        } else {
            // PC端推荐分辨率
            return { width: 1920, height: 1080 };
        }
    }

    /**
     * 获取适配策略
     */
    public static getAdaptationStrategy(): 'FIT_WIDTH' | 'FIT_HEIGHT' | 'SHOW_ALL' | 'NO_BORDER' {
        const screenInfo = this.getScreenInfo();
        
        if (this.isMobile()) {
            // 移动端使用FIT_HEIGHT
            return 'FIT_HEIGHT';
        } else {
            // PC端使用FIT_WIDTH
            return 'FIT_WIDTH';
        }
    }
}


