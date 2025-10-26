export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/lobby/index',
    'pages/room/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1976d2',
    navigationBarTitleText: '斗地主游戏',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f5f5'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#1976d2',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/lobby/index',
        text: '大厅',
        iconPath: 'assets/icons/lobby.png',
        selectedIconPath: 'assets/icons/lobby-active.png'
      },
      {
        pagePath: 'pages/room/index',
        text: '游戏',
        iconPath: 'assets/icons/game.png',
        selectedIconPath: 'assets/icons/game-active.png'
      }
    ]
  },
  networkTimeout: {
    request: 10000,
    downloadFile: 10000
  },
  debug: true,
  permission: {
    'scope.userInfo': {
      desc: '用于获取用户信息，提供更好的游戏体验'
    }
  }
})
