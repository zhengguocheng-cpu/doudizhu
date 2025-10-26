import { _decorator, Component, Node, AudioClip, AudioSource, sys } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 音频管理器
 * 负责管理游戏中的所有音效和背景音乐
 */
@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioClip)
    public backgroundMusic: AudioClip = null!;

    @property(AudioClip)
    public cardClickSound: AudioClip = null!;

    @property(AudioClip)
    public cardPlaySound: AudioClip = null!;

    @property(AudioClip)
    public winSound: AudioClip = null!;

    @property(AudioClip)
    public loseSound: AudioClip = null!;

    @property(AudioClip)
    public buttonClickSound: AudioClip = null!;

    @property(AudioClip)
    public notificationSound: AudioClip = null!;

    private audioSource: AudioSource = null!;
    private musicVolume: number = 0.5;
    private soundVolume: number = 0.7;
    private isMusicEnabled: boolean = true;
    private isSoundEnabled: boolean = true;

    onLoad() {
        this.initAudio();
    }

    /**
     * 初始化音频管理器
     */
    public init(): void {
        console.log('🎵 音频管理器初始化');
        this.initAudio();
    }

    /**
     * 初始化音频
     */
    private initAudio(): void {
        // 获取或添加AudioSource组件
        this.audioSource = this.getComponent(AudioSource);
        if (!this.audioSource) {
            this.audioSource = this.addComponent(AudioSource);
        }

        // 设置默认音量
        this.audioSource.volume = this.musicVolume;

        // 从本地存储加载设置
        this.loadAudioSettings();
    }

    /**
     * 播放背景音乐
     */
    public playBackgroundMusic(): void {
        if (!this.isMusicEnabled || !this.backgroundMusic) return;

        this.audioSource.clip = this.backgroundMusic;
        this.audioSource.loop = true;
        this.audioSource.volume = this.musicVolume;
        this.audioSource.play();
    }

    /**
     * 停止背景音乐
     */
    public stopBackgroundMusic(): void {
        if (this.audioSource.isPlaying) {
            this.audioSource.stop();
        }
    }

    /**
     * 暂停背景音乐
     */
    public pauseBackgroundMusic(): void {
        if (this.audioSource.isPlaying) {
            this.audioSource.pause();
        }
    }

    /**
     * 恢复背景音乐
     */
    public resumeBackgroundMusic(): void {
        if (!this.audioSource.isPlaying && this.isMusicEnabled) {
            this.audioSource.play();
        }
    }

    /**
     * 播放卡片点击音效
     */
    public playCardClickSound(): void {
        this.playSound(this.cardClickSound);
    }

    /**
     * 播放出牌音效
     */
    public playCardPlaySound(): void {
        this.playSound(this.cardPlaySound);
    }

    /**
     * 播放胜利音效
     */
    public playWinSound(): void {
        this.playSound(this.winSound);
    }

    /**
     * 播放失败音效
     */
    public playLoseSound(): void {
        this.playSound(this.loseSound);
    }

    /**
     * 播放按钮点击音效
     */
    public playButtonClickSound(): void {
        this.playSound(this.buttonClickSound);
    }

    /**
     * 播放通知音效
     */
    public playNotificationSound(): void {
        this.playSound(this.notificationSound);
    }

    /**
     * 播放音效
     */
    private playSound(clip: AudioClip | null): void {
        if (!this.isSoundEnabled || !clip) return;

        // 检查平台支持
        if (!sys.audioSupport) {
            console.warn('当前平台不支持音频播放');
            return;
        }

        // 创建临时AudioSource播放音效
        const tempAudioSource = this.node.addComponent(AudioSource);
        tempAudioSource.clip = clip;
        tempAudioSource.volume = this.soundVolume;
        tempAudioSource.loop = false;
        
        // 播放音效
        tempAudioSource.play();

        // 播放完成后销毁临时AudioSource
        this.scheduleOnce(() => {
            if (tempAudioSource && tempAudioSource.isValid) {
                tempAudioSource.destroy();
            }
        }, clip.getDuration());
    }

    /**
     * 设置音乐音量
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.audioSource.volume = this.musicVolume;
        this.saveAudioSettings();
    }

    /**
     * 设置音效音量
     */
    public setSoundVolume(volume: number): void {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
    }

    /**
     * 设置音乐开关
     */
    public setMusicEnabled(enabled: boolean): void {
        this.isMusicEnabled = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        this.saveAudioSettings();
    }

    /**
     * 设置音效开关
     */
    public setSoundEnabled(enabled: boolean): void {
        this.isSoundEnabled = enabled;
        this.saveAudioSettings();
    }

    /**
     * 获取音乐音量
     */
    public getMusicVolume(): number {
        return this.musicVolume;
    }

    /**
     * 获取音效音量
     */
    public getSoundVolume(): number {
        return this.soundVolume;
    }

    /**
     * 获取音乐开关状态
     */
    public getMusicEnabled(): boolean {
        return this.isMusicEnabled;
    }

    /**
     * 获取音效开关状态
     */
    public getSoundEnabled(): boolean {
        return this.isSoundEnabled;
    }

    /**
     * 保存音频设置
     */
    private saveAudioSettings(): void {
        const settings = {
            musicVolume: this.musicVolume,
            soundVolume: this.soundVolume,
            isMusicEnabled: this.isMusicEnabled,
            isSoundEnabled: this.isSoundEnabled
        };

        try {
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('保存音频设置失败:', error);
        }
    }

    /**
     * 加载音频设置
     */
    private loadAudioSettings(): void {
        try {
            const settingsStr = localStorage.getItem('audioSettings');
            if (settingsStr) {
                const settings = JSON.parse(settingsStr);
                this.musicVolume = settings.musicVolume || 0.5;
                this.soundVolume = settings.soundVolume || 0.7;
                this.isMusicEnabled = settings.isMusicEnabled !== false;
                this.isSoundEnabled = settings.isSoundEnabled !== false;
            }
        } catch (error) {
            console.warn('加载音频设置失败:', error);
        }
    }

    /**
     * 播放游戏开始音效
     */
    public playGameStartSound(): void {
        this.playSound(this.notificationSound);
    }

    /**
     * 播放游戏结束音效
     */
    public playGameEndSound(isWin: boolean): void {
        if (isWin) {
            this.playWinSound();
        } else {
            this.playLoseSound();
        }
    }

    /**
     * 播放房间加入音效
     */
    public playRoomJoinSound(): void {
        this.playSound(this.notificationSound);
    }

    /**
     * 播放房间离开音效
     */
    public playRoomLeaveSound(): void {
        this.playSound(this.buttonClickSound);
    }

    /**
     * 播放聊天消息音效
     */
    public playChatMessageSound(): void {
        this.playSound(this.notificationSound);
    }

    /**
     * 播放系统通知音效
     */
    public playSystemNotificationSound(): void {
        this.playSound(this.notificationSound);
    }

    onDestroy() {
        // 停止所有音频
        this.stopBackgroundMusic();
    }
}
