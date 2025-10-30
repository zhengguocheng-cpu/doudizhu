/**
 * 🧪 斗地主游戏自动化测试脚本
 * 
 * 使用方法：
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制粘贴此脚本
 * 3. 运行 AutoTest.runAll() 或单独测试
 */

class AutoTest {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  // ============ 工具方法 ============

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async test(name, fn) {
    this.testCount++;
    this.log(`测试 ${this.testCount}: ${name}`, 'test');
    
    try {
      await fn();
      this.passCount++;
      this.results.push({ name, status: 'PASS' });
      this.log(`${name} - 通过`, 'success');
      return true;
    } catch (error) {
      this.failCount++;
      this.results.push({ name, status: 'FAIL', error: error.message });
      this.log(`${name} - 失败: ${error.message}`, 'error');
      return false;
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || '断言失败');
    }
  }

  // ============ 页面检测 ============

  async testPageElements() {
    await this.test('检查页面基本元素', async () => {
      // 检查当前页面
      const url = window.location.href;
      this.log(`当前页面: ${url}`, 'info');

      // 检查 Socket.IO 脚本
      const socketScript = document.querySelector('script[src*="socket.io"]');
      this.assert(socketScript, 'Socket.IO 脚本未加载');

      // 检查全局 Socket 管理器
      this.assert(window.GlobalSocketManager, 'GlobalSocketManager 未定义');
      
      this.log('页面基本元素检查完成', 'success');
    });
  }

  async testSocketConnection() {
    await this.test('检查 Socket 连接', async () => {
      const socketManager = window.GlobalSocketManager?.getInstance();
      this.assert(socketManager, 'Socket 管理器未初始化');

      // 等待连接
      await this.wait(1000);

      const isConnected = socketManager.isConnected;
      this.log(`Socket 连接状态: ${isConnected ? '已连接' : '未连接'}`, 'info');
      this.assert(isConnected, 'Socket 未连接');
    });
  }

  // ============ 登录测试 ============

  async testLogin(userName = '测试玩家A') {
    await this.test('测试登录流程', async () => {
      // 检查是否在登录页面
      if (!window.location.href.includes('/login/')) {
        this.log('不在登录页面，跳过登录测试', 'warning');
        return;
      }

      const nameInput = document.getElementById('playerName');
      const submitBtn = document.querySelector('button[type="submit"]');

      this.assert(nameInput, '用户名输入框不存在');
      this.assert(submitBtn, '提交按钮不存在');

      // 填写用户名
      nameInput.value = userName;
      this.log(`填写用户名: ${userName}`, 'info');

      // 模拟点击
      this.log('请手动点击"进入游戏大厅"按钮', 'warning');
    });
  }

  // ============ 大厅测试 ============

  async testLobby() {
    await this.test('测试大厅页面', async () => {
      // 检查是否在大厅页面
      if (!window.location.href.includes('/lobby/')) {
        throw new Error('不在大厅页面');
      }

      // 检查连接状态
      const connectionStatus = document.getElementById('connectionStatus');
      this.assert(connectionStatus, '连接状态元素不存在');
      
      const statusText = connectionStatus.textContent;
      this.log(`连接状态: ${statusText}`, 'info');
      this.assert(statusText === '已连接', `连接状态错误: ${statusText}`);

      // 检查房间列表
      const roomList = document.getElementById('roomList');
      this.assert(roomList, '房间列表不存在');

      const rooms = roomList.querySelectorAll('.room-item');
      this.log(`房间数量: ${rooms.length}`, 'info');
      this.assert(rooms.length > 0, '没有房间');

      // 检查房间信息
      const firstRoom = rooms[0];
      const roomName = firstRoom.querySelector('h4')?.textContent;
      const joinBtn = firstRoom.querySelector('.join-room-btn');
      
      this.log(`第一个房间: ${roomName}`, 'info');
      this.assert(joinBtn, '加入按钮不存在');
    });
  }

  async testJoinRoom() {
    await this.test('测试加入房间', async () => {
      if (!window.location.href.includes('/lobby/')) {
        throw new Error('不在大厅页面');
      }

      const roomList = document.getElementById('roomList');
      const rooms = roomList.querySelectorAll('.room-item');
      
      // 找到第一个可加入的房间
      let availableRoom = null;
      for (const room of rooms) {
        const btn = room.querySelector('.join-room-btn');
        if (btn && !btn.disabled) {
          availableRoom = room;
          break;
        }
      }

      this.assert(availableRoom, '没有可加入的房间');
      
      const roomName = availableRoom.querySelector('h4')?.textContent;
      this.log(`准备加入房间: ${roomName}`, 'info');
      this.log('请手动点击"加入房间"按钮', 'warning');
    });
  }

  // ============ 房间测试 ============

  async testRoom() {
    await this.test('测试房间页面', async () => {
      if (!window.location.href.includes('/room/')) {
        throw new Error('不在房间页面');
      }

      // 检查房间信息
      const roomName = document.getElementById('roomName');
      this.assert(roomName, '房间名称不存在');
      this.log(`房间名称: ${roomName.textContent}`, 'info');

      // 检查连接状态
      const connectionStatus = document.getElementById('connectionStatus');
      this.assert(connectionStatus, '连接状态不存在');
      
      const statusText = connectionStatus.textContent;
      this.log(`连接状态: ${statusText}`, 'info');

      // 检查玩家列表
      const playerList = document.getElementById('playerList');
      this.assert(playerList, '玩家列表不存在');

      // 检查准备按钮
      const startBtn = document.getElementById('startGameBtn');
      this.assert(startBtn, '准备按钮不存在');
      this.log(`准备按钮文字: ${startBtn.textContent}`, 'info');
    });
  }

  async testReadyButton() {
    await this.test('测试准备按钮', async () => {
      if (!window.location.href.includes('/room/')) {
        throw new Error('不在房间页面');
      }

      const startBtn = document.getElementById('startGameBtn');
      this.assert(startBtn, '准备按钮不存在');
      this.assert(!startBtn.disabled, '准备按钮被禁用');

      this.log('请手动点击"开始游戏"按钮测试防抖', 'warning');
      this.log('快速点击3次，应该只响应1次', 'info');
    });
  }

  // ============ 综合测试 ============

  async runAll() {
    this.log('========================================', 'info');
    this.log('开始自动化测试', 'test');
    this.log('========================================', 'info');

    // 基础测试
    await this.testPageElements();
    await this.testSocketConnection();

    // 根据当前页面运行相应测试
    const url = window.location.href;
    
    if (url.includes('/login/')) {
      await this.testLogin();
    } else if (url.includes('/lobby/')) {
      await this.testLobby();
      await this.testJoinRoom();
    } else if (url.includes('/room/')) {
      await this.testRoom();
      await this.testReadyButton();
    }

    // 输出结果
    this.printResults();
  }

  async runQuickTest() {
    this.log('========================================', 'info');
    this.log('快速测试模式', 'test');
    this.log('========================================', 'info');

    await this.testPageElements();
    await this.testSocketConnection();

    this.printResults();
  }

  printResults() {
    this.log('========================================', 'info');
    this.log('测试结果汇总', 'test');
    this.log('========================================', 'info');
    
    console.table(this.results);
    
    this.log(`总计: ${this.testCount} 个测试`, 'info');
    this.log(`通过: ${this.passCount} 个`, 'success');
    this.log(`失败: ${this.failCount} 个`, 'error');
    
    const passRate = ((this.passCount / this.testCount) * 100).toFixed(1);
    this.log(`通过率: ${passRate}%`, passRate === '100.0' ? 'success' : 'warning');

    if (this.failCount === 0) {
      this.log('🎉 所有测试通过！', 'success');
    } else {
      this.log('⚠️ 有测试失败，请检查', 'warning');
    }
  }

  // ============ 辅助工具 ============

  // 获取当前页面信息
  getPageInfo() {
    const info = {
      url: window.location.href,
      page: window.location.pathname,
      socketConnected: window.GlobalSocketManager?.getInstance()?.isConnected || false,
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('userName')
    };
    
    console.table(info);
    return info;
  }

  // 清除所有数据
  clearAll() {
    localStorage.clear();
    sessionStorage.clear();
    this.log('已清除所有本地数据', 'success');
    this.log('请刷新页面', 'info');
  }

  // 模拟多个用户
  simulateUsers(count = 3) {
    this.log(`准备模拟 ${count} 个用户`, 'info');
    this.log('请打开多个无痕窗口，每个窗口运行:', 'warning');
    
    for (let i = 1; i <= count; i++) {
      console.log(`
窗口 ${i}:
1. 打开 http://localhost:3000
2. 控制台运行: AutoTest.testLogin('测试玩家${String.fromCharCode(64 + i)}')
3. 点击进入游戏
      `);
    }
  }
}

// 创建全局实例
window.AutoTest = new AutoTest();

// 输出使用说明
console.log(`
%c🧪 自动化测试工具已加载！

%c快速开始：
  AutoTest.runAll()          - 运行所有测试
  AutoTest.runQuickTest()    - 快速测试
  AutoTest.getPageInfo()     - 查看页面信息
  AutoTest.clearAll()        - 清除所有数据
  AutoTest.simulateUsers(3)  - 多用户测试指南

%c单项测试：
  AutoTest.testPageElements()    - 测试页面元素
  AutoTest.testSocketConnection() - 测试Socket连接
  AutoTest.testLogin()           - 测试登录
  AutoTest.testLobby()           - 测试大厅
  AutoTest.testRoom()            - 测试房间

%c提示：在任何页面打开控制台运行 AutoTest.runAll()
`, 
'color: #4CAF50; font-size: 16px; font-weight: bold;',
'color: #2196F3; font-size: 14px;',
'color: #FF9800; font-size: 12px;',
'color: #9E9E9E; font-size: 11px;'
);

// 自动运行快速测试
console.log('%c正在运行快速测试...', 'color: #4CAF50; font-weight: bold;');
setTimeout(() => {
  window.AutoTest.runQuickTest();
}, 1000);
