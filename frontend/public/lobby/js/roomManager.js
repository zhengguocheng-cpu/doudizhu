/**
 * 房间管理器 - 处理房间相关的所有操作
 */
class RoomManager {
    constructor(socketManager, uiManager) {
        this.socketManager = socketManager;
        this.uiManager = uiManager;
        this.currentPlayer = null;
        this.playerAvatar = '👑';
    }

    /**
     * 设置当前玩家信息
     */
    setCurrentPlayer(playerName, playerAvatar = '👑') {
        this.currentPlayer = playerName;
        this.playerAvatar = playerAvatar;
    }

    /**
     * 获取房间列表（使用Socket方式）
     */
    async loadRoomList() {
        try {
            console.log('开始获取房间列表（Socket方式）...');

            // 使用Promise包装Socket事件
            const rooms = await this.getRoomsListViaSocket();
            console.log('Socket获取房间列表成功', rooms);

            this.uiManager.displayRoomList(rooms);
            return rooms;

        } catch (error) {
            console.error('Socket获取房间列表失败:', error);
            this.uiManager.addError(`获取房间列表失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 通过Socket获取房间列表
     */
    async getRoomsListViaSocket() {
        return new Promise((resolve, reject) => {
            // 发送请求
            this.socketManager.socket.emit('get_rooms_list');

            // 监听一次性响应
            const timeout = setTimeout(() => {
                this.socketManager.socket.off('rooms_list');
                reject(new Error('获取房间列表超时'));
            }, 5000);

            this.socketManager.socket.once('rooms_list', (data) => {
                clearTimeout(timeout);
                this.socketManager.socket.off('rooms_list');

                if (data.success) {
                    resolve(data.rooms);
                } else {
                    reject(new Error(data.error || '获取房间列表失败'));
                }
            });
        });
    }

    /**
     * 设置房间更新监听
     */
    setupRoomsUpdateListener() {
        this.socketManager.socket.on('rooms_updated', (data) => {
            console.log('收到房间更新:', data.eventType, data.roomId);

            // 更新房间列表UI
            this.uiManager.displayRoomList(data.rooms);

            // 根据不同事件类型显示相应消息（只显示大厅相关的）
            switch(data.eventType) {
                case 'player_joined':
                    // 玩家进入消息已在专门的player_joined事件中处理
                    break;
                case 'player_left':
                    // 玩家离开消息已在专门的player_left事件中处理
                    break;
                case 'game_started':
                    // 大厅页面不需要显示游戏开始消息
                    break;
                case 'game_ended':
                    // 大厅页面不需要显示游戏结束消息
                    break;
                default:
                    // 其他房间状态变化不需要特殊处理，只更新UI即可
                    break;
            }
        });
    }

    /**
     * 加入房间（简化版）
     */
    async joinRoom(roomId) {
        console.log('开始加入房间:', roomId);

        if (!this.currentPlayer) {
            console.error('未设置玩家信息');
            this.uiManager.addError('请先登录');
            return false;
        }

        try {
            // 使用全局Socket管理器发送加入游戏事件
            const joinSuccess = this.socketManager.joinGame({
                roomId: roomId,
                userId: this.currentPlayer,    // 用户名作为userId
                playerName: this.currentPlayer
            });

            if (joinSuccess) {
                console.log('房间加入成功');
                return true;
            } else {
                console.error('Socket连接错误');
                this.uiManager.addError('加入房间失败：连接错误');
                return false;
            }
        } catch (error) {
            console.error('加入房间错误:', error);
            this.uiManager.addError(`加入房间失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 处理房间事件
     */
    onRoomJoined(data) {
        this.uiManager.addSuccess(`成功加入房间 "${data.room?.name || '未知'}"`);
    }

    onRoomLeft(data) {
        this.uiManager.addInfo(`离开房间 "${data.room?.name || '未知'}"`);
    }

    onPlayerJoined(data) {
        this.uiManager.addInfo(`玩家 ${data.playerName} 加入了房间`);
    }

    onPlayerLeft(data) {
        this.uiManager.addInfo(`玩家 ${data.playerName} 离开了房间`);
    }
}

// 导出到全局
window.RoomManager = RoomManager;
