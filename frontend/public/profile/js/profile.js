/**
 * 个人中心页面逻辑
 */

class ProfilePage {
  constructor() {
    this.userId = null;
    this.userName = null;
    this.playerAvatar = null;
    this.roomId = null;
    this.init();
  }

  /**
   * 获取用户信息
   * 优先从URL参数获取
   */
  getUserInfo() {
    // 优先从URL参数获取（支持查看其他玩家的个人中心）
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('userId');
    const userNameFromUrl = urlParams.get('userName');
    const playerAvatarFromUrl = urlParams.get('playerAvatar');
    const roomIdFromUrl = urlParams.get('roomId');
    console.log('📋 从URL参数获取userId:', userIdFromUrl);
    console.log('📋 从URL参数获取userName:', userNameFromUrl);
    console.log('📋 从URL参数获取playerAvatar:', playerAvatarFromUrl);
    if (userIdFromUrl) {
      // 同时获取用户名和头像
      this.userId = decodeURIComponent(userIdFromUrl);
      console.log('[decodeURIComponent]📋 从URL参数获取userId:', this.userId);
    }

    if (userNameFromUrl) {
      this.userName = decodeURIComponent(userNameFromUrl);
      console.log('[decodeURIComponent]📋 从URL参数获取userName:', this.userName);
    }

    if (playerAvatarFromUrl) {
      this.playerAvatar = decodeURIComponent(playerAvatarFromUrl);
      console.log('[decodeURIComponent]📋 从URL参数获取playerAvatar:', this.playerAvatar);
    }

    if (roomIdFromUrl) {
      this.roomId = decodeURIComponent(roomIdFromUrl);
      console.log('[decodeURIComponent]📋 从URL参数获取roomId:', this.roomId);
    }

    if (!this.userId && !this.userName && !this.playerAvatar) {
      // 都没有，提示登录
      alert('无用户信息，请先登录');
      window.location.href = '/';
    }

  }

  /**
   * 初始化页面
   */
  async init() {

    this.getUserInfo();

    if (!this.userId) return;

    // 显示用户ID
    document.getElementById('userId').textContent = `ID: ${this.userId}`;

    // 加载数据
    await Promise.all([
      this.loadPlayerScore(),
      this.loadPlayerRank(),
      this.loadAchievements(),
      this.loadGameHistory()
    ]);

    // 绑定按钮事件
    this.bindEvents();
  }

  /**
   * 绑定按钮事件
   */
  bindEvents() {
    document.getElementById('backToLobbyBtn').addEventListener('click', this.handleBackToLobby.bind(this));
    document.getElementById('leaderboardBtn').addEventListener('click', this.handleLeaderboard.bind(this));
  }

 /**
   * 返回大厅
   */
  handleBackToLobby() {
    console.log('🏠 返回大厅');

    // 先通知后端离开房间
    const roomId = this.roomId;
    if (roomId) {
      try {
        //this.showStatus('正在连接服务器...', 'success');
        const socketManager = window.GlobalSocketManager.getInstance();
        console.log('connect:', this.userId, this.userName, this.playerAvatar)
        socketManager.connect(this.userId, this.userName, 'settlement');
        console.log('✅ Socket连接已建立，准备跳转到大厅');

        //alert('Socket连接已建立，准备跳转到大厅');
        console.log('📤 发送离开房间请求:', roomId);
        console.log('socket信息:', socketManager.socket)
        socketManager.socket.emit('leave_game', {
          roomId: roomId,
          userId: this.userId
        });
        //alert('离开房间请求已发送');

      } catch (error) {
        //alert('离开房间失败', error);
        console.error('离开房间失败:', error);
      }
    }

    // 清除结算数据
    localStorage.removeItem('lastGameSettlement');

    // 延迟跳转，确保离开房间请求发送成功
    setTimeout(() => {
      //alert('user name:'+this.userName);
      this.redirectToLobby(this.userName, this.playerAvatar);
    }, 1000);
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

    // window.location.href = `/lobby/index.html?${params.toString()}`;
    // this.socketManager.disconnect();
    const lobbyUrl = `/lobby/index.html?${params.toString()}`;

    const goLobby = () => { window.location.href = lobbyUrl; };

    const socket = this.socketManager?.socket;
    if (socket?.connected) {
      socket.once('disconnect', goLobby);
      this.socketManager.disconnect();
      setTimeout(goLobby, 200); // 防止断开失败或过久未回调
    } else {
      goLobby();
    }
  }


  // /**
  //  * 返回大厅
  //  */
  // handleBackToLobby() {
  //   console.log('🏠 返回大厅');
  //   // window.location.href = '/lobby';

  //   // 传递登录信息到大厅页面
  //   const params = new URLSearchParams({
  //     playerName: encodeURIComponent(this.userName),
  //     playerAvatar: encodeURIComponent(this.playerAvatar),
  //     loginTime: Date.now()
  //   });

  //   console.log('🔄 准备跳转到大厅页面，参数:', params.toString());
  //   console.log('🏠 页面跳转地址:', `/lobby/index.html?${params.toString()}`);

  //   // window.location.href = `/lobby/index.html?${params.toString()}`;
  //   // this.socketManager.disconnect();
  //   const lobbyUrl = `/lobby/index.html?${params.toString()}`;

  //   const goLobby = () => { window.location.href = lobbyUrl; };

  //   const socket = this.socketManager?.socket;
  //   if (socket?.connected) {
  //     socket.once('disconnect', goLobby);
  //     this.socketManager.disconnect();
  //     setTimeout(goLobby, 200); // 防止断开失败或过久未回调
  //   } else {
  //     goLobby();
  //   }
  // }

  /**查看排行榜 */
  handleLeaderboard() {
    console.log('🚀 查看排行榜');
    // window.location.href = '/leaderboard';

    // 传递登录信息到排行榜页面
    const params = new URLSearchParams({
      userId: encodeURIComponent(this.userId),
      userName: encodeURIComponent(this.userName),
      playerAvatar: encodeURIComponent(this.playerAvatar),
      roomId: encodeURIComponent(this.roomId)
    });

    console.log('🔄 准备跳转到排行榜页面，参数:', params.toString());
    console.log('🏠 页面跳转地址:', `/leaderboard/index.html?${params.toString()}`);

    // window.location.href = `/lobby/index.html?${params.toString()}`;
    // this.socketManager.disconnect();
    const lobbyUrl = `/leaderboard/index.html?${params.toString()}`;

    const goLeaderboard = () => { window.location.href = lobbyUrl; };

    const socket = this.socketManager?.socket;
    if (socket?.connected) {
      socket.once('disconnect', goLeaderboard);
      this.socketManager.disconnect();
      setTimeout(goLeaderboard, 200); // 防止断开失败或过久未回调
    } else {
      goLeaderboard();
    }

  }

  /**
   * 加载玩家积分
   */
  async loadPlayerScore() {
    try {
      const response = await fetch(`/api/score/${this.userId}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;

        // 更新玩家名称和头像
        // 优先使用URL参数，其次使用API返回，最后使用localStorage
        const userName = this.userNameFromUrl || data.username || localStorage.getItem('userName') || this.userId;
        const avatar = this.playerAvatarFromUrl || localStorage.getItem('playerAvatar') || '👤';

        document.getElementById('playerName').textContent = decodeURIComponent(userName);
        document.getElementById('playerAvatar').textContent = decodeURIComponent(avatar);

        // 更新统计数据
        document.getElementById('totalScore').textContent = data.totalScore.toLocaleString();
        document.getElementById('gamesPlayed').textContent = data.gamesPlayed;
        document.getElementById('winRate').textContent = data.winRate.toFixed(1) + '%';
        document.getElementById('currentStreak').textContent = data.currentStreak;

        // 添加动画效果
        this.animateNumbers();
      } else {
        console.error('加载积分失败:', result.message);
        this.showEmptyState('stats');
      }
    } catch (error) {
      console.error('加载积分失败:', error);
      this.showEmptyState('stats');
    }
  }

  /**
   * 加载玩家排名
   */
  async loadPlayerRank() {
    try {
      // 加载积分排名
      const scoreRankResponse = await fetch(`/api/score/${this.userId}/rank/score`);
      const scoreRankResult = await scoreRankResponse.json();

      if (scoreRankResult.success && scoreRankResult.data.rank) {
        document.getElementById('scoreRank').textContent = `#${scoreRankResult.data.rank}`;
      } else {
        document.getElementById('scoreRank').textContent = '未上榜';
      }

      // 加载胜率排名
      const winRateRankResponse = await fetch(`/api/score/${this.userId}/rank/winRate`);
      const winRateRankResult = await winRateRankResponse.json();

      if (winRateRankResult.success && winRateRankResult.data.rank) {
        document.getElementById('winRateRank').textContent = `#${winRateRankResult.data.rank}`;
      } else {
        document.getElementById('winRateRank').textContent = '未上榜';
      }
    } catch (error) {
      console.error('加载排名失败:', error);
    }
  }

  /**
   * 加载成就
   */
  async loadAchievements() {
    try {
      const response = await fetch(`/api/score/${this.userId}/achievements`);
      const result = await response.json();

      if (result.success) {
        const achievements = result.data;
        this.renderAchievements(achievements);
      } else {
        this.showEmptyState('achievements');
      }
    } catch (error) {
      console.error('加载成就失败:', error);
      this.showEmptyState('achievements');
    }
  }

  /**
   * 渲染成就列表
   */
  renderAchievements(achievements) {
    const grid = document.getElementById('achievementsGrid');

    if (achievements.length === 0) {
      grid.innerHTML = '<div class="empty-state">暂无成就</div>';
      return;
    }

    grid.innerHTML = achievements.map(achievement => `
      <div class="achievement-item ${achievement.isUnlocked ? 'unlocked' : 'locked'}"
           title="${achievement.description}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        ${achievement.isUnlocked ?
        `<div class="achievement-desc">已解锁</div>` :
        `<div class="achievement-desc">${achievement.progress || 0}%</div>`
      }
      </div>
    `).join('');
  }

  /**
   * 加载游戏历史
   */
  async loadGameHistory() {
    try {
      const response = await fetch(`/api/score/${this.userId}`);
      const result = await response.json();

      if (result.success && result.data.gameHistory) {
        this.renderGameHistory(result.data.gameHistory);
      } else {
        this.showEmptyState('history');
      }
    } catch (error) {
      console.error('加载游戏历史失败:', error);
      this.showEmptyState('history');
    }
  }

  /**
   * 渲染游戏历史
   */
  renderGameHistory(history) {
    const list = document.getElementById('historyList');

    if (history.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无游戏记录</div>
        </div>
      `;
      return;
    }

    list.innerHTML = history.slice(0, 10).map(game => {
      const time = new Date(game.timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const roleText = game.role === 'landlord' ? '地主' : '农民';
      const resultClass = game.isWinner ? 'win' : 'lose';
      const scoreClass = game.scoreChange > 0 ? 'positive' : 'negative';
      const scoreText = game.scoreChange > 0 ? `+${game.scoreChange}` : game.scoreChange;

      const tags = (game.tags || []).map(tag =>
        `<span class="history-tag">${tag}</span>`
      ).join('');

      return `
        <div class="history-item ${resultClass}">
          <div class="history-info">
            <div class="history-time">${time}</div>
            <div class="history-role">${game.isWinner ? '✅' : '❌'} ${roleText}</div>
            ${tags ? `<div class="history-tags">${tags}</div>` : ''}
          </div>
          <div class="history-score ${scoreClass}">${scoreText}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * 显示空状态
   */
  showEmptyState(section) {
    const elements = {
      'stats': ['totalScore', 'gamesPlayed', 'winRate', 'currentStreak'],
      'achievements': ['achievementsGrid'],
      'history': ['historyList']
    };

    if (elements[section]) {
      elements[section].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = '--';
        }
      });
    }
  }

  /**
   * 数字动画效果
   */
  animateNumbers() {
    const elements = [
      { id: 'totalScore', target: parseInt(document.getElementById('totalScore').textContent.replace(/,/g, '')) },
      { id: 'gamesPlayed', target: parseInt(document.getElementById('gamesPlayed').textContent) },
      { id: 'currentStreak', target: parseInt(document.getElementById('currentStreak').textContent) }
    ];

    elements.forEach(({ id, target }) => {
      if (isNaN(target)) return;

      const element = document.getElementById(id);
      const duration = 1000;
      const steps = 30;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;

        if (step >= steps) {
          current = target;
          clearInterval(timer);
        }

        if (id === 'totalScore') {
          element.textContent = Math.floor(current).toLocaleString();
        } else {
          element.textContent = Math.floor(current);
        }
      }, duration / steps);
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new ProfilePage();
});
