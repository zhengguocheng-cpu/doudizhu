/**
 * 排行榜页面逻辑
 */

class LeaderboardPage {
  constructor() {
    this.currentType = 'score'; // 当前排行榜类型：score 或 winRate
    this.leaderboardData = [];
    this.myRank = null;
    this.init();
  }

  /**
   * 初始化页面
   */
  init() {
    console.log('🏆 排行榜页面初始化');

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
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = '/lobby/index.html';
      });
    }

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
      const userId = localStorage.getItem('userId');
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

    // 生成排行榜列表
    const html = this.leaderboardData.map((player, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      
      return `
        <div class="leaderboard-item">
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
   * 显示我的排名
   */
  displayMyRank() {
    const container = document.getElementById('myRankContainer');
    const card = document.getElementById('myRankCard');

    if (!this.myRank) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const rank = this.myRank.rank || '-';
    const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

    card.innerHTML = `
      <div class="leaderboard-item">
        <div class="rank ${rankClass}">${rankIcon}</div>
        <div class="player-info">
          <div class="player-avatar">👤</div>
          <div class="player-name">${this.myRank.username || this.myRank.userId}</div>
        </div>
        <div class="score">${this.myRank.totalScore || 0}</div>
        <div class="games">${this.myRank.gamesPlayed || 0}</div>
        <div class="winrate">${this.formatWinRate(this.myRank.winRate)}</div>
      </div>
    `;
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
