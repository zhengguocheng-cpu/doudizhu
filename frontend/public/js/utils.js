// frontend/public/js/utils.js
/**
 * 通用工具函数库
 * 包含：错误提示、防抖、节流、操作锁定等
 */

/**
 * 统一的消息提示工具
 */
class MessageToast {
    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 类型: success, error, warning, info
     * @param {number} duration - 显示时长（毫秒）
     */
    static show(message, type = 'info', duration = 3000) {
        // 移除旧的提示
        const oldToast = document.getElementById('message-toast');
        if (oldToast) {
            oldToast.remove();
        }

        // 创建新提示
        const toast = document.createElement('div');
        toast.id = 'message-toast';
        toast.className = `message-toast message-toast-${type}`;
        
        // 图标映射
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // 添加样式（如果还没有）
        if (!document.getElementById('message-toast-style')) {
            const style = document.createElement('style');
            style.id = 'message-toast-style';
            style.textContent = `
                .message-toast {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 14px 28px;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 15px;
                    font-weight: 500;
                    z-index: 9999;
                    animation: toastSlideDown 0.3s ease;
                    max-width: 400px;
                }
                
                @keyframes toastSlideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                .message-toast-success {
                    background: #10b981;
                    color: white;
                }
                
                .message-toast-error {
                    background: #ef4444;
                    color: white;
                }
                
                .message-toast-warning {
                    background: #f59e0b;
                    color: white;
                }
                
                .message-toast-info {
                    background: #3b82f6;
                    color: white;
                }
                
                .toast-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .toast-message {
                    flex: 1;
                    word-break: break-word;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'toastSlideDown 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    static success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    static error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 操作锁定管理器
 * 防止重复点击、重复提交等
 */
class OperationLock {
    constructor() {
        this.locks = new Map();
    }

    /**
     * 尝试获取锁
     * @param {string} key - 锁的键名
     * @param {number} duration - 锁定时长（毫秒）
     * @returns {boolean} 是否成功获取锁
     */
    tryLock(key, duration = 1000) {
        if (this.locks.has(key)) {
            console.log(`⚠️ 操作 "${key}" 正在进行中，请稍后再试`);
            return false;
        }

        this.locks.set(key, true);
        setTimeout(() => {
            this.locks.delete(key);
        }, duration);

        return true;
    }

    /**
     * 释放锁
     * @param {string} key - 锁的键名
     */
    unlock(key) {
        this.locks.delete(key);
    }

    /**
     * 检查是否已锁定
     * @param {string} key - 锁的键名
     * @returns {boolean} 是否已锁定
     */
    isLocked(key) {
        return this.locks.has(key);
    }

    /**
     * 清除所有锁
     */
    clearAll() {
        this.locks.clear();
    }
}

/**
 * 按钮防重复点击
 * @param {HTMLElement} button - 按钮元素
 * @param {Function} callback - 点击回调
 * @param {number} delay - 防抖延迟（毫秒）
 */
function preventDoubleClick(button, callback, delay = 1000) {
    let isProcessing = false;
    
    button.addEventListener('click', async (e) => {
        if (isProcessing) {
            console.log('⚠️ 操作正在处理中，请稍候...');
            MessageToast.warning('操作正在处理中，请稍候...');
            return;
        }

        isProcessing = true;
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';

        try {
            await callback(e);
        } finally {
            setTimeout(() => {
                isProcessing = false;
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }, delay);
        }
    });
}

/**
 * 错误处理包装器
 * @param {Function} func - 要包装的函数
 * @param {string} errorMessage - 错误提示消息
 * @returns {Function} 包装后的函数
 */
function withErrorHandler(func, errorMessage = '操作失败，请重试') {
    return async function(...args) {
        try {
            return await func(...args);
        } catch (error) {
            console.error('❌ 操作错误:', error);
            MessageToast.error(errorMessage);
            throw error;
        }
    };
}

/**
 * 网络请求重试
 * @param {Function} requestFunc - 请求函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} 请求结果
 */
async function retryRequest(requestFunc, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFunc();
        } catch (error) {
            lastError = error;
            console.log(`⚠️ 请求失败，正在重试 (${i + 1}/${maxRetries})...`);
            
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
    
    throw lastError;
}

/**
 * 格式化错误消息
 * @param {Error|string} error - 错误对象或消息
 * @returns {string} 格式化后的错误消息
 */
function formatErrorMessage(error) {
    if (typeof error === 'string') {
        return error;
    }
    
    if (error instanceof Error) {
        return error.message || '未知错误';
    }
    
    return '操作失败，请重试';
}

// 创建全局实例
const globalOperationLock = new OperationLock();

// 导出到全局
window.MessageToast = MessageToast;
window.debounce = debounce;
window.throttle = throttle;
window.OperationLock = OperationLock;
window.globalOperationLock = globalOperationLock;
window.preventDoubleClick = preventDoubleClick;
window.withErrorHandler = withErrorHandler;
window.retryRequest = retryRequest;
window.formatErrorMessage = formatErrorMessage;

console.log('✅ 工具函数库已加载');
