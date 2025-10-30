/**
 * 游戏结算页面逻辑
 */

class SettlementPage {
  constructor() {
    this.settlementData = null;
    this.init();
  }

  /**
   * 初始化页面
   */
  init() {
    console.log('🎊 结算页面初始化');

    // 从URL参数或localStorage获取结算数据
    this.loadSettlementData();

    // 绑定按钮事件
    this.bindEvents();

    // 显示结算信息
    if (this.settlementData) {
      this.displaySettlement(this.settlementData);
    } else {
      this.showError('未找到结算数据');
    }
  }

  /**
   * 加载结算数据
   */
  loadSettlementData() {
    // 尝试从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');

    if (dataParam) {
      try {
        this.settlementData = JSON.parse(decodeURIComponent(dataParam));
        console.log('📊 从URL加载结算数据:', this.settlementData);
        return;
      } catch (error) {
        console.error('解析URL数据失败:', error);
      }
    }

    // 尝试从localStorage获取
    const storedData = localStorage.getItem('lastGameSettlement');
    if (storedData) {
      try {
        this.settlementData = JSON.parse(storedData);
        console.log('📊 从localStorage加载结算数据:', this.settlementData);
        return;
      } catch (error) {
        console.error('解析localStorage数据失败:', error);
      }
    }

    // 如果都没有，使用测试数据（开发用）
    if (!this.settlementData) {
      console.warn('⚠️ 未找到结算数据，使用测试数据');
      this.settlementData = this.getTestData();
    }
  }

  /**
   * 显示结算信息
   */
  displaySettlement(data) {
    console.log('🎊 显示结算信息:', data);

    // 设置标题
    const title = document.getElementById('settlementTitle');
    const subtitle = document.getElementById('settlementSubtitle');
    if (title) {
      title.textContent = data.landlordWin ? '地主获胜！' : '农民获胜！';
    }
    if (subtitle) {
      subtitle.textContent = data.landlordWin ? '地主大获全胜' : '农民团结一致';
    }

    // 设置获胜者信息
    this.displayWinner(data);

    // 设置得分详情
    this.displayScore(data);

    // 设置玩家得分列表
    this.displayPlayers(data);

    // 显示成就（如果有）
    this.displayAchievements(data);
  }

  /**
   * 显示获胜者信息
   */
  displayWinner(data) {
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerName = document.getElementById('winnerName');
    const winnerRole = document.getElementById('winnerRole');

    if (winnerAvatar) {
      winnerAvatar.textContent = '👑';
    }

    if (winnerName) {
      winnerName.textContent = data.winnerName || '未知玩家';
    }

    if (winnerRole) {
      const roleText = data.winnerRole === 'landlord' ? '地主' : '农民';
      winnerRole.textContent = roleText;
    }
  }

  /**
   * 显示得分详情
   */
  displayScore(data) {
    const score = data.score;
    if (!score) return;

    const baseScore = score.baseScore || 1;
    const multiplier = score.playerScores?.[0]?.multipliers?.total || 1;
    const totalScore = baseScore * multiplier;

    // 格式化倍数说明
    const multiplierDesc = [];
    const multipliers = score.playerScores?.[0]?.multipliers;
    if (multipliers) {
      if (multipliers.bomb > 1) {
        const bombCount = Math.log2(multipliers.bomb);
        multiplierDesc.push(`炸弹×${bombCount}`);
      }
      if (multipliers.rocket > 1) {
        const rocketCount = Math.log(multipliers.rocket) / Math.log(4);
        multiplierDesc.push(`王炸×${rocketCount}`);
      }
      if (multipliers.spring > 1) {
        multiplierDesc.push('春天');
      }
      if (multipliers.antiSpring > 1) {
        multiplierDesc.push('反春');
      }
    }

    // 更新DOM
    const baseScoreEl = document.getElementById('baseScore');
    const multiplierEl = document.getElementById('multiplier');
    const totalScoreEl = document.getElementById('totalScore');

    if (baseScoreEl) {
      baseScoreEl.textContent = baseScore;
    }

    if (multiplierEl) {
      let text = `×${multiplier}`;
      if (multiplierDesc.length > 0) {
        text += ` (${multiplierDesc.join(', ')})`;
      }
      multiplierEl.textContent = text;
    }

    if (totalScoreEl) {
      const currentUserId = localStorage.getItem('userId');
      const isWinner = data.winnerId === currentUserId;
      const sign = isWinner ? '+' : '-';
      totalScoreEl.textContent = `${sign}${totalScore}`;
      totalScoreEl.style.color = sign === '+' ? '#27ae60' : '#e74c3c';
    }
  }

  /**
   * 显示玩家得分列表
   */
  displayPlayers(data) {
    const score = data.score;
    if (!score || !score.playerScores) return;

    score.playerScores.forEach((playerScore, index) => {
      const playerId = `player${index + 1}Score`;
      const playerEl = document.getElementById(playerId);
      if (!playerEl) return;

      const roleText = playerScore.role === 'landlord' ? '地主' : '农民';
      const scoreSign = playerScore.finalScore > 0 ? '+' : '';
      const scoreColor = playerScore.finalScore > 0 ? '#27ae60' : '#e74c3c';

      playerEl.innerHTML = `
        <div class="player-info">
          <span class="player-avatar">👤</span>
          <span class="player-name">${playerScore.playerName || '玩家' + (index + 1)}</span>
          <span class="player-role">${roleText}</span>
        </div>
        <span class="player-score" style="color: ${scoreColor}">${scoreSign}${playerScore.finalScore}</span>
      `;
    });
  }

  /**
   * 显示成就
   */
  displayAchievements(data) {
    if (!data.achievements || Object.keys(data.achievements).length === 0) {
      return;
    }

    const achievementsSection = document.getElementById('achievementsSection');
    const achievementsList = document.getElementById('achievementsList');

    if (!achievementsSection || !achievementsList) return;

    // 显示成就区域
    achievementsSection.style.display = 'block';

    // 清空列表
    achievementsList.innerHTML = '';

    // 添加成就
    Object.entries(data.achievements).forEach(([userId, achievementIds]) => {
      if (!achievementIds || achievementIds.length === 0) return;

      achievementIds.forEach(achievementId => {
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-item';
        achievementEl.innerHTML = `
          <span class="achievement-icon">🏆</span>
          <div class="achievement-info">
            <div class="achievement-name">${this.getAchievementName(achievementId)}</div>
            <div class="achievement-reward">+${this.getAchievementReward(achievementId)}积分</div>
          </div>
        `;
        achievementsList.appendChild(achievementEl);
      });
    });
  }

  /**
   * 获取成就名称
   */
  getAchievementName(achievementId) {
    const names = {
      'first_win': '首胜',
      'win_10': '小有成就',
      'win_50': '游戏高手',
      'win_100': '斗地主大师',
      'streak_3': '三连胜',
      'streak_5': '五连胜',
      'streak_10': '十连胜',
      'score_1000': '千分玩家',
      'score_5000': '五千分大佬',
      'games_100': '百场老将'
    };
    return names[achievementId] || achievementId;
  }

  /**
   * 获取成就奖励
   */
  getAchievementReward(achievementId) {
    const rewards = {
      'first_win': 10,
      'win_10': 50,
      'win_50': 200,
      'win_100': 500,
      'streak_3': 30,
      'streak_5': 100,
      'streak_10': 300,
      'score_1000': 100,
      'score_5000': 500,
      'games_100': 200
    };
    return rewards[achievementId] || 0;
  }

  /**
   * 绑定按钮事件
   */
  bindEvents() {
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToLobbyBtn = document.getElementById('backToLobbyBtn');

    if (viewProfileBtn) {
      viewProfileBtn.addEventListener('click', () => this.viewProfile());
    }

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => this.playAgain());
    }

    if (backToLobbyBtn) {
      backToLobbyBtn.addEventListener('click', () => this.backToLobby());
    }
  }

  /**
   * 查看个人中心
   */
  viewProfile() {
    console.log('👤 跳转到个人中心');
    
    // 从结算数据中获取当前玩家信息
    if (!this.settlementData) {
      console.error('❌ 无法获取结算数据');
      alert('无法获取玩家信息');
      return;
    }
    
    const currentUserId = this.settlementData.currentUserId;
    const currentUserName = this.settlementData.currentUserName || currentUserId;
    const currentUserAvatar = this.settlementData.currentUserAvatar || '👤';
    
    if (!currentUserId) {
      console.error('❌ 无法获取当前玩家ID');
      alert('无法获取玩家信息');
      return;
    }
    
    console.log('👤 跳转参数:', {
      userId: currentUserId,
      userName: currentUserName,
      avatar: currentUserAvatar
    });
    
    // 通过URL参数传递完整的用户信息，确保查看的是当前玩家的个人中心
    const params = new URLSearchParams({
      userId: encodeURIComponent(currentUserId),
      userName: encodeURIComponent(currentUserName),
      playerAvatar: encodeURIComponent(currentUserAvatar)
    });
    
    window.location.href = `/profile?${params.toString()}`;
  }

  /**
   * 再来一局
   */
  playAgain() {
    console.log('🎮 再来一局');
    
    // 获取房间和玩家信息
    const roomId = this.settlementData?.roomId;
    const playerName = this.settlementData?.currentUserName || localStorage.getItem('userName');
    const playerAvatar = this.settlementData?.currentUserAvatar || localStorage.getItem('userAvatar') || '👤';
    
    if (!roomId) {
      console.error('❌ 无法获取房间ID');
      window.location.href = '/lobby/index.html';
      return;
    }
    
    if (!playerName) {
      console.error('❌ 无法获取玩家信息');
      window.location.href = '/lobby/index.html';
      return;
    }
    
    console.log('🎮 再来一局，返回房间:', {
      roomId,
      playerName,
      playerAvatar
    });
    
    // 清除结算数据
    localStorage.removeItem('lastGameSettlement');
    
    // 生成页面跳转令牌
    const pageNavigationToken = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('pageNavigationToken', pageNavigationToken);
    localStorage.setItem('pageNavigationTime', Date.now().toString());
    
    // 返回房间，带上完整的玩家信息
    const params = new URLSearchParams({
      roomId: roomId,
      playerName: encodeURIComponent(playerName),
      playerAvatar: encodeURIComponent(playerAvatar)
    });
    
    window.location.href = `/room/room.html?${params.toString()}`;
  }

  /**
   * 返回大厅
   */
  backToLobby() {
    console.log('🏠 返回大厅');
    
    // 先通知后端离开房间
    const roomId = this.settlementData?.roomId;
    if (roomId) {
      try {
        const socketManager = window.GlobalSocketManager?.getInstance();
        if (socketManager && socketManager.socket) {
          console.log('📤 发送离开房间请求:', roomId);
          socketManager.socket.emit('leave_room', { roomId });
        }
      } catch (error) {
        console.error('离开房间失败:', error);
      }
    }
    
    // 清除结算数据
    localStorage.removeItem('lastGameSettlement');
    
    // 延迟跳转，确保离开房间请求发送成功
    setTimeout(() => {
      window.location.href = '/lobby/index.html';
    }, 100);
  }

  /**
   * 显示错误
   */
  showError(message) {
    const container = document.querySelector('.settlement-container');
    if (container) {
      container.innerHTML = `
        <div class="settlement-card">
          <div class="settlement-header">
            <h1>⚠️ 错误</h1>
          </div>
          <div style="padding: 40px; text-align: center;">
            <p style="font-size: 18px; color: #e74c3c; margin-bottom: 20px;">${message}</p>
            <button onclick="window.location.href='/lobby/index.html'" class="btn btn-primary">
              <span class="btn-icon">🏠</span>
              <span class="btn-text">返回大厅</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * 获取测试数据
   */
  getTestData() {
    return {
      winnerId: 'player1',
      winnerName: '测试玩家',
      winnerRole: 'landlord',
      landlordWin: true,
      roomId: 'test_room',
      score: {
        baseScore: 1,
        bombCount: 1,
        rocketCount: 0,
        isSpring: false,
        isAntiSpring: false,
        playerScores: [
          {
            playerId: 'player1',
            playerName: '测试玩家',
            role: 'landlord',
            finalScore: 4,
            multipliers: {
              base: 1,
              bomb: 2,
              rocket: 1,
              spring: 1,
              antiSpring: 1,
              total: 2
            }
          },
          {
            playerId: 'player2',
            playerName: '玩家2',
            role: 'farmer',
            finalScore: -2,
            multipliers: {
              base: 1,
              bomb: 2,
              rocket: 1,
              spring: 1,
              antiSpring: 1,
              total: 2
            }
          },
          {
            playerId: 'player3',
            playerName: '玩家3',
            role: 'farmer',
            finalScore: -2,
            multipliers: {
              base: 1,
              bomb: 2,
              rocket: 1,
              spring: 1,
              antiSpring: 1,
              total: 2
            }
          }
        ]
      },
      achievements: {
        'player1': ['first_win']
      }
    };
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new SettlementPage();
});
