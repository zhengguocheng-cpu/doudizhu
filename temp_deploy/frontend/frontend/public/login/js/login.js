/**
 * 登录页面控制器
 * 处理用户登录逻辑和页面跳转
 */
class LoginController {
    constructor() {
        this.initializeElements();
        this.bindEvents();

        this.socketManager = window.GlobalSocketManager.getInstance();
        this.setupSocketListeners();
    }
     
    /**
     * 初始化DOM元素
     */
    initializeElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            playerNameInput: document.getElementById('playerName'),
            playerAvatarSelect: document.getElementById('playerAvatar'),
            loginStatus: document.getElementById('loginStatus')
        };
    }

    /**
     * 绑定事件处理
     */
    bindEvents() {
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 用户名输入不需要额外处理
    }

    /**
     * 设置Socket事件监听（极简版）
     */
    setupSocketListeners() {
        // Socket事件监听在GlobalSocketManager中统一处理
        // 这里不需要额外的监听器
    }

    /**
     * 处理登录提交（极简版 - 一次性认证）
     */
    async handleLogin() {
        const playerName = this.elements.playerNameInput.value.trim();
        const playerAvatar = this.elements.playerAvatarSelect.value;

        console.log('🔄 开始登录流程:', {
            playerName: playerName,
            playerAvatar: playerAvatar
        });

        // 表单验证
        if (!this.validateForm(playerName)) {
            console.log('❌ 表单验证失败');
            return;
        }

        try {
            this.showStatus('正在连接服务器...', 'success');
            this.setFormEnabled(false);

            // 连接Socket并传递用户名进行认证
            this.socketManager = window.GlobalSocketManager.getInstance();
            this.socketManager.connect(playerName, playerName);

            console.log('✅ Socket连接已建立，准备跳转到大厅');

            // 等待连接建立后跳转
            setTimeout(() => {
                this.redirectToLobby(playerName, playerAvatar);
            }, 800);

        } catch (error) {
            console.error('❌ 登录过程出错:', error);
            this.showStatus('登录过程出错，请重试', 'error');
            this.setFormEnabled(true);
        }
    }

    /**
     * 等待认证完成 - 注释掉
     */
    async waitForAuthentication() {
        // 注释掉等待认证方法
        // return new Promise((resolve, reject) => {
        //     const checkAuth = () => {
        //         if (this.socketManager.authenticated && this.socketManager.userName) {
        //             console.log('✅ 认证状态确认:', {
        //                 authenticated: this.socketManager.authenticated,
        //                 userName: this.socketManager.userName
        //             });
        //             resolve();
        //         } else {
        //             console.log('⏳ 等待认证完成...');
        //             setTimeout(checkAuth, 100);
        //         }
        //     };
        //     checkAuth();
        // });
    }

    /**
     * 等待Socket连接建立 - 注释掉
     */
    async waitForConnection() {
        // 注释掉等待连接方法
        // return new Promise((resolve, reject) => {
        //     const checkConnection = () => {
        //         if (this.socketManager.socket && this.socketManager.isConnected) {
        //             console.log('✅ Socket连接已建立');
        //             resolve();
        //         } else {
        //             console.log('⏳ 等待Socket连接...');
        //             setTimeout(checkConnection, 100);
        //         }
        //     };
        //     checkConnection();
        // });
    }

    /**
     * 表单验证
     */
    validateForm(playerName) {
        if (!playerName) {
            this.showStatus('请输入玩家昵称', 'error');
            return false;
        }

        if (playerName.length < 2 || playerName.length > 20) {
            this.showStatus('玩家昵称长度应在2-20个字符之间', 'error');
            return false;
        }

        // 检查特殊字符
        const invalidChars = /[<>\"'&]/;
        if (invalidChars.test(playerName)) {
            this.showStatus('昵称不能包含特殊字符', 'error');
            return false;
        }

        return true;
    }

    /**
     * 认证成功处理 - 注释掉
     */
    onAuthenticationSuccess(data) {
        // 注释掉认证成功处理
        // console.log('🔐 认证成功处理开始:', data);

        // // 直接保存到全局变量
        // window.userAuth = {
        //     userId: data.userName,
        //     userName: data.userName,
        //     sessionId: data.sessionId,
        //     authenticated: true,
        //     timestamp: Date.now()
        // };

        // console.log('📦 保存到全局变量:', window.userAuth);

        // // 同时更新GlobalSocketManager状态
        // this.socketManager.setAuthenticated(data);

        // // 恢复表单状态
        // this.setFormEnabled(true);

        // // 显示成功消息
        // this.showStatus('登录成功！正在进入大厅...', 'success');

        // console.log('✅ 登录流程完成，准备跳转到大厅');

        // // 延迟跳转到大厅
        // setTimeout(() => {
        //     const playerName = this.elements.playerNameInput.value.trim();
        //     const playerAvatar = this.elements.playerAvatarSelect.value;
        //     console.log('🔄 跳转到大厅，参数:', {
        //         playerName: playerName,
        //         playerAvatar: playerAvatar
        //     });
        //     this.redirectToLobby(playerName, playerAvatar);
        // }, 1000);
    }

    /**
     * 认证失败处理
     */
    onAuthenticationError(error) {
        console.error('登录失败:', error);
        this.showStatus(error.message || '登录失败', 'error');
        this.setFormEnabled(true);
    }

    /**
     * 显示状态消息
     */
    showStatus(message, type) {
        if (this.elements.loginStatus) {
            this.elements.loginStatus.textContent = message;
            this.elements.loginStatus.className = `login-status ${type}`;
            this.elements.loginStatus.style.display = 'block';

            // 自动隐藏状态消息（除成功消息外）
            if (type !== 'success') {
                setTimeout(() => {
                    this.elements.loginStatus.style.display = 'none';
                }, 3000);
            }
        }
    }

    /**
     * 设置表单可用状态
     */
    setFormEnabled(enabled) {
        const submitBtn = this.elements.loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = !enabled;
            submitBtn.textContent = enabled ? '进入游戏大厅' : '连接中...';
        }

        if (this.elements.playerNameInput) {
            this.elements.playerNameInput.disabled = !enabled;
        }
        if (this.elements.playerAvatarSelect) {
            this.elements.playerAvatarSelect.disabled = !enabled;
        }
    }

    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(connected) {
        console.log('连接状态更新:', connected ? '已连接' : '未连接');
    }

    /**
     * 跳转到大厅页面（简化版）
     */
    redirectToLobby(playerName, playerAvatar) {
        // 传递登录信息到大厅页面
        const params = new URLSearchParams({
            playerName: encodeURIComponent(playerName),
            playerAvatar: encodeURIComponent(playerAvatar),
            loginTime: Date.now()
        });

        console.log('🔄 准备跳转到大厅页面，参数:', params.toString());
        console.log('🏠 页面跳转地址:', `/lobby/index.html?${params.toString()}`);

        window.location.href = `/lobby/index.html?${params.toString()}`;
    }
}

// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('🚨 全局JavaScript错误:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未处理的Promise错误:', {
        reason: event.reason,
        promise: event.promise
    });
});

// 页面加载完成后初始化
window.addEventListener('load', () => {
    console.log('登录页面加载完成');
    console.log('📋 URL参数:', window.location.search);
    console.log('🌐 当前完整URL:', window.location.href);

    try {
        new LoginController();
    } catch (error) {
        console.error('❌ LoginController初始化失败:', error);
    }
});

// 导出到全局以便调试
window.LoginController = LoginController;