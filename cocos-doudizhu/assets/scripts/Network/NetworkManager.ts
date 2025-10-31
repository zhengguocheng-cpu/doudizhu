import { _decorator, Component, Node } from 'cc';
import { io, Socket } from 'socket.io-client';
import { GameData } from '../Data/GameData';

const { ccclass, property } = _decorator;

/**
 * 网络管理器
 * 负责与后端服务器的通信
 */
@ccclass('NetworkManager')
export class NetworkManager extends Component {
    private socket: Socket | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 2000;
    private serverUrl: string = 'http://localhost:3000';

    // 事件回调映射
    private eventCallbacks: Map<string, Function[]> = new Map();

    onLoad() {
        this.init();
    }

    /**
     * 初始化网络管理器
     */
    public init(): void {
        console.log('🌐 网络管理器初始化');
        this.connect();
    }

    /**
     * 连接到服务器
     */
    public connect(): void {
        if (this.socket && this.isConnected) {
            console.log('🌐 已连接到服务器');
            return;
        }

        console.log('🌐 正在连接服务器...', this.serverUrl);

        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // 连接成功
        this.socket.on('connect', () => {
            console.log('✅ 服务器连接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        // 连接断开
        this.socket.on('disconnect', (reason) => {
            console.log('❌ 服务器连接断开:', reason);
            this.isConnected = false;
            this.emit('disconnected', reason);
            this.handleReconnect();
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
            console.error('❌ 连接错误:', error);
            this.emit('connect_error', error);
        });

        // 监听游戏事件
        this.setupGameEventListeners();
    }

    /**
     * 设置游戏事件监听器
     */
    private setupGameEventListeners(): void {
        if (!this.socket) return;

        // 认证相关事件
        this.socket.on('authenticated', (data) => {
            console.log('🔐 认证成功:', data);
            this.emit('authenticated', data);
        });

        this.socket.on('auth_error', (error) => {
            console.error('🔐 认证失败:', error);
            this.emit('auth_error', error);
        });

        // 房间相关事件
        this.socket.on('rooms_updated', (data) => {
            console.log('🏠 房间列表更新:', data);
            this.emit('rooms_updated', data);
        });

        this.socket.on('room_joined', (data) => {
            console.log('🏠 加入房间成功:', data);
            this.emit('room_joined', data);
        });

        this.socket.on('room_left', (data) => {
            console.log('🏠 离开房间:', data);
            this.emit('room_left', data);
        });

        this.socket.on('player_joined', (data) => {
            console.log('👤 玩家加入:', data);
            this.emit('player_joined', data);
        });

        this.socket.on('player_left', (data) => {
            console.log('👤 玩家离开:', data);
            this.emit('player_left', data);
        });

        // 游戏相关事件
        this.socket.on('game_started', (data) => {
            console.log('🎮 游戏开始:', data);
            this.emit('game_started', data);
        });

        this.socket.on('cards_dealt', (data) => {
            console.log('🃏 发牌:', data);
            this.emit('cards_dealt', data);
        });

        this.socket.on('game_state_updated', (data) => {
            console.log('🎮 游戏状态更新:', data);
            this.emit('game_state_updated', data);
        });

        this.socket.on('cards_played', (data) => {
            console.log('🃏 出牌:', data);
            this.emit('cards_played', data);
        });

        this.socket.on('game_ended', (data) => {
            console.log('🎮 游戏结束:', data);
            this.emit('game_ended', data);
        });

        // 聊天相关事件
        this.socket.on('message_received', (data) => {
            console.log('💬 收到消息:', data);
            this.emit('message_received', data);
        });

        // 错误处理
        this.socket.on('error', (error) => {
            console.error('❌ 服务器错误:', error);
            this.emit('error', error);
        });
    }

    /**
     * 处理重连
     */
    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ 重连次数超限，停止重连');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempts}次重连...`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * 发送消息到服务器
     */
    public send(event: string, data: any = {}): void {
        if (!this.socket || !this.isConnected) {
            console.warn('❌ 未连接到服务器，无法发送消息');
            return;
        }

        console.log('📤 发送消息:', event, data);
        this.socket.emit(event, data);
    }

    /**
     * 发送请求并等待响应
     */
    public request(event: string, data: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) {
                reject(new Error('未连接到服务器'));
                return;
            }

            const requestId = this.generateRequestId();
            const timeout = setTimeout(() => {
                reject(new Error('请求超时'));
            }, 10000);

            // 监听响应
            const responseHandler = (response: any) => {
                if (response.requestId === requestId) {
                    clearTimeout(timeout);
                    this.socket?.off('response', responseHandler);
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            };

            this.socket.on('response', responseHandler);
            this.socket.emit(event, { ...data, requestId });
        });
    }

    /**
     * 监听事件
     */
    public on(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)!.push(callback);
    }

    /**
     * 移除事件监听
     */
    public off(event: string, callback?: Function): void {
        if (!this.eventCallbacks.has(event)) return;

        if (callback) {
            const callbacks = this.eventCallbacks.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        } else {
            this.eventCallbacks.delete(event);
        }
    }

    /**
     * 触发事件
     */
    private emit(event: string, data?: any): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 生成请求ID
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        console.log('🌐 已断开服务器连接');
    }

    /**
     * 获取连接状态
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 设置服务器地址
     */
    public setServerUrl(url: string): void {
        this.serverUrl = url;
    }

    onDestroy() {
        this.disconnect();
    }
}



