/**
 * 排行榜页面逻辑
 */

class LeaderboardPage {
  constructor() {
    this.currentType = 'score'; // 当前排行榜类型：score 或 winRate
    this.leaderboardData = [];
    this.myRank = null;
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
    console.log('📋 从URL参数获取roomId:', roomIdFromUrl);
    if (userIdFromUrl) {
      // 同时获取用户名和头像
      this.userId = decodeURIComponent(userIdFromUrl);
    }
    
    if(userNameFromUrl) {
      this.userName = decodeURIComponent(userNameFromUrl);
    }
    
    if(playerAvatarFromUrl) {
      this.playerAvatar = decodeURIComponent(playerAvatarFromUrl);
    }

    if(roomIdFromUrl) {
      this.roomId = decodeURIComponent(roomIdFromUrl);
    }

    if(!this.userId && !this.userName && !this.playerAvatar){
    // 都没有，提示登录
    alert('无用户信息，请先登录');
    window.location.href = '/';
  }
    
  }

  /**
   * 初始化页面
   */
  init() {
    console.log('🏆 排行榜页面初始化');

    this.getUserInfo();    

    // 绑定事件
    this.bindEvents();

    // 加载排行榜数据
    this.loadLeaderboard('score');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 返回按钮
    // const backBtn = document.getElementById('backBtn');
    // if (backBtn) {
    //   backBtn.addEventListener('click', () => {
    //     window.location.href = '/lobby/index.html';
    //   });
    // }
    document.getElementById('backToLobbyBtn').addEventListener('click', this.handleBackToLobby.bind(this));


    // 排行榜类型切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.switchTab(type);
      });
    });
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

  /**
   * 切换排行榜类型
   */
  switchTab(type) {
    if (this.currentType === type) return;

    this.currentType = type;

    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.type === type) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 加载数据
    this.loadLeaderboard(type);
  }

  /**
   * 加载排行榜数据
   */
  async loadLeaderboard(type) {
    console.log(`📊 加载${type === 'score' ? '积分' : '胜率'}排行榜`);

    try {
      // 显示加载状态
      this.showLoading();

      // 从API获取数据
      const response = await fetch(`/api/score/leaderboard/${type}`);
      
      if (!response.ok) {
        throw new Error('获取排行榜失败');
      }

      const data = await response.json();
      
      if (data.success) {
        this.leaderboardData = data.data || [];
        this.displayLeaderboard();
        
        // 加载我的排名
        this.loadMyRank(type);
      } else {
        throw new Error(data.message || '获取排行榜失败');
      }

    } catch (error) {
      console.error('加载排行榜失败:', error);
      this.showError('加载排行榜失败，请稍后重试');
    }
  }

  /**
   * 加载我的排名
   */
  async loadMyRank(type) {
    try {
      const userId = this.userId;
      if (!userId) {
        console.warn('未找到用户ID');
        return;
      }

      const response = await fetch(`/api/score/${userId}/rank/${type}`);
      
      if (!response.ok) {
        throw new Error('获取我的排名失败');
      }

      const data = await response.json();
      
      if (data.success) {
        this.myRank = data.data;
        this.displayMyRank();
      }

    } catch (error) {
      console.error('加载我的排名失败:', error);
    }
  }

  /**
   * 显示排行榜
   */
  displayLeaderboard() {
    const listContainer = document.getElementById('leaderboardList');
    
    if (!this.leaderboardData || this.leaderboardData.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="icon">📊</div>
          <p>暂无排行榜数据</p>
        </div>
      `;
      return;
    }

    // 获取当前用户ID
    const currentUserId = this.userId;

    // 生成排行榜列表
    const html = this.leaderboardData.map((player, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      
      // 判断是否是当前用户
      const isMyRank = currentUserId && (player.userId === currentUserId || player.username === currentUserId);
      const myRankClass = isMyRank ? 'my-rank' : '';
      
      return `
        <div class="leaderboard-item ${myRankClass}">
          <div class="rank ${rankClass}">${rankIcon}</div>
          <div class="player-info">
            <div class="player-avatar">👤</div>
            <div class="player-name">${player.username || player.userId}</div>
          </div>
          <div class="score">${player.totalScore || 0}</div>
          <div class="games">${player.gamesPlayed || 0}</div>
          <div class="winrate">${this.formatWinRate(player.winRate)}</div>
        </div>
      `;
    }).join('');

    listContainer.innerHTML = html;
  }

  /**
   * 显示我的排名（已废弃，现在直接在列表中高亮显示）
   */
  displayMyRank() {
    // 不再需要单独显示我的排名，已在列表中高亮
    console.log('我的排名已在列表中高亮显示');
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    const listContainer = document.getElementById('leaderboardList');
    listContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    `;
  }

  /**
   * 显示错误
   */
  showError(message) {
    const listContainer = document.getElementById('leaderboardList');
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * 格式化胜率
   */
  formatWinRate(winRate) {
    if (winRate === undefined || winRate === null) {
      return '0%';
    }
    return `${(winRate * 100).toFixed(1)}%`;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new LeaderboardPage();
});
