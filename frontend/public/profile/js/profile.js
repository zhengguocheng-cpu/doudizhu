/**
 * 个人中心页面逻辑
 */

class ProfilePage {
  constructor() {
    this.userId = this.getUserId();
    this.init();
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    // 从localStorage获取
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('请先登录');
      window.location.href = '/';
      return null;
    }
    return userId;
  }

  /**
   * 初始化页面
   */
  async init() {
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
        document.getElementById('playerName').textContent = data.username;
        const avatar = localStorage.getItem('playerAvatar') || '👤';
        document.getElementById('playerAvatar').textContent = avatar;

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
