/**
 * 消息管理器 - 处理消息日志的格式化和分类
 */
class MessageManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
    }

    /**
     * 添加信息消息
     */
    addInfo(message) {
        this.uiManager.addMessage(message, 'info');
    }

    /**
     * 添加成功消息
     */
    addSuccess(message) {
        this.uiManager.addMessage(message, 'success');
    }

    /**
     * 添加警告消息
     */
    addWarning(message) {
        this.uiManager.addMessage(message, 'warning');
    }

    /**
     * 添加错误消息
     */
    addError(message) {
        this.uiManager.addMessage(message, 'error');
    }

    /**
     * 添加连接状态消息
     */
    addConnectionStatus(message, connected = true) {
        const type = connected ? 'success' : 'error';
        this.uiManager.addMessage(message, type);
    }

    /**
     * 添加游戏事件消息
     */
    addGameEvent(message) {
        this.uiManager.addMessage(message, 'info');
    }

    /**
     * 清空消息日志
     */
    clearMessages() {
        if (this.uiManager.elements.messageLog) {
            this.uiManager.elements.messageLog.innerHTML = '';
        }
    }
}

// 导出到全局
window.MessageManager = MessageManager;
