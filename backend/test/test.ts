import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Player, GamePlayer, Room, GameState } from '../src/types';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server);

// 房间数据存储
const rooms = new Map<string, Room>();

// 游戏房间状态存储
const gameRooms = new Map<string, GameState>();

// 创建6个默认空房间
for (let i = 1; i <= 6; i++) {
  const roomId = `A${String(i).padStart(2, '0')}`;
  const room = {
    id: roomId,
    name: `房间${roomId}`,
    maxPlayers: 3,
    players: [],
    status: 'waiting',
    createdAt: new Date()
  };
  rooms.set(roomId, room);
}

// 跟踪用户和房间的关系
const socketToRoom = new Map<string, string>(); // socket.id -> roomId
const socketToPlayer = new Map<string, { roomId: string, playerId: string, playerName: string }>(); // socket.id -> player info

// 添加JSON解析中间件，用于处理POST请求
app.use(express.json());

// 静态文件服务 - 放在所有路由之前
app.use(express.static(__dirname + '/../../frontend/public'));

// SPA路由支持 - 处理前端路由
app.use('/lobby/*', (req, res) => {
  res.sendFile(__dirname + '/../../frontend/public/lobby/index.html');
});

// Room页面路由支持
app.use('/room/*', (req, res) => {
  res.sendFile(__dirname + '/../../frontend/public/room/index.html');
});

// 根路径重定向到lobby页面
app.get('/', function(req, res) {
  res.redirect('/lobby/');
});

// 处理Chrome DevTools特殊请求，避免CSP错误
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 处理其他可能的DevTools请求
app.get('/.well-known/*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 创建游戏房间
app.post('/api/games/rooms', (req, res) => {
  try {
    const { name, maxPlayers = 3 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: '房间名称不能为空'
      });
    }

    const roomId = Date.now().toString();
    const room = {
      id: roomId,
      name,
      maxPlayers,
      players: [],
      status: 'waiting',
      createdAt: new Date()
    };

    rooms.set(roomId, room);

    return res.status(201).json({
      success: true,
      data: room,
      message: '房间创建成功'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error instanceof Error) ? error.message : '未知错误'
    });
  }
});

// 获取房间列表
app.get('/api/games/rooms', (req, res) => {
  try {
    const roomsArray = Array.from(rooms.values());
    return res.status(200).json({
      success: true,
      data: roomsArray,
      message: '房间列表获取成功'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error instanceof Error) ? error.message : '未知错误'
    });
  }
});

// 加入房间
app.post('/api/games/rooms/:roomId/join', (req, res) => {
  try {
    console.log('加入房间请求', req.body);
    const { roomId } = req.params; // 从URL参数获取roomId
    const { playerName, socketId } = req.body; // 从请求体获取playerName和socketId


    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: '房间不存在'
      });
    }

    //console.log('房间', room);
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        success: false,
        error: '房间已满'
      });
    }

    // 使用客户端传入的socketId作为玩家ID
    const player = {
      id: socketId || Date.now().toString(), // 优先使用socketId，回退到时间戳
      name: playerName,
      joinedAt: new Date(),
      ready: false
    };

    room.players.push(player);
    //console.log('玩家', playerName, '加入房间', room);

    return res.status(200).json({
      success: true,
      data: room,
      message: '加入房间成功'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error instanceof Error) ? error.message : '未知错误'
    });
  }
});

// 玩家准备
app.post('/api/games/rooms/:roomId/ready', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    console.log('玩家准备请求', req.body);
    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: '玩家ID不能为空'
      });
    }

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: '房间不存在'
      });
    }

    // 查找玩家
    const player = room.players.find((p: any) => p.id === playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: '玩家不在房间中'
      });
    }

    // 标记玩家为准备状态
    player.ready = true;
    console.log('玩家', player.name, '准备成功');
    // 检查是否所有玩家都准备好了
    const allReady = room.players.every((p: Player) => p.ready);
    console.log('所有玩家准备状态:', room.players.map((p: Player) => p.ready));
    return res.json({
      success: true,
      data: { player, allReady },
      message: '玩家准备成功'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error instanceof Error) ? error.message : '未知错误'
    });
  }
});

app.get('/test.html', function(req, res) {
  res.redirect('/lobby/');
});

// 通用404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '接口不存在',
    path: req.originalUrl
  });
});

// Socket.IO连接处理
io.on('connection', (socket: any) => {
  console.log(`用户连接: ${socket.id}`);

  // 处理用户加入游戏房间
  socket.on('join_game', (data: any) => {
    const { roomId, playerName } = data;

    // 初始化游戏房间状态
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        id: roomId,
        players: [],
        readyPlayers: [],
        gameStarted: false
      });
    }

    const gameRoom = gameRooms.get(roomId);
    if (gameRoom && !gameRoom.players.find((p: GamePlayer) => p.id === socket.id)) {
      gameRoom.players.push({
        id: socket.id,
        name: playerName,
        ready: false
      });
    }

    socketToRoom.set(socket.id, roomId);
    socketToPlayer.set(socket.id, {
      roomId: roomId,
      playerId: socket.id,
      playerName: playerName
    });

    // 加入房间
    socket.join(`room_${roomId}`);

    console.log(`用户 ${playerName} 加入房间 ${roomId}`);

    // 广播给同一房间的其他玩家（除了自己）
    socket.to(`room_${roomId}`).emit('player_joined', {
      playerId: socket.id,
      playerName: playerName,
      roomId: roomId
    });

    // 广播房间状态更新给所有玩家（包括新加入的玩家）
    io.to(`room_${roomId}`).emit('room_state_updated', {
      roomId: roomId,
      players: gameRoom!.players,
      readyPlayers: gameRoom!.readyPlayers
    });
  });

  // 处理用户离开游戏房间
  socket.on('leave_game', (data: any) => {
    const { roomId, playerName } = data;
    removePlayerFromGameRoom(socket.id, roomId, playerName);

    // 广播给同一房间的其他玩家
    socket.to(`room_${roomId}`).emit('player_left', {
      playerId: socket.id,
      playerName: playerName,
      roomId: roomId
    });
  });

  // 处理玩家准备
  socket.on('player_ready', (data: any) => {
    console.log('玩家准备:', data);

    if (gameRooms.has(data.roomId)) {
      const room = gameRooms.get(data.roomId);
      if (room && !room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);

        // 检查是否所有玩家都准备好了
        if (room.readyPlayers.length === room.players.length && room.players.length >= 3) {
          startGame(data.roomId);
        }
      }
    }

    socket.to(`room_${data.roomId}`).emit('player_ready', { playerId: socket.id });
  });

  // 处理出牌
  socket.on('play_cards', (data: any) => {
    console.log('玩家出牌:', data);
    socket.to(`room_${data.roomId}`).emit('cards_played', {
      playerId: socket.id,
      cards: data.cards
    });
  });

  // 处理不出牌
  socket.on('pass_turn', (data: any) => {
    console.log('玩家跳过回合:', data);
    socket.to(`room_${data.roomId}`).emit('player_passed', {
      playerId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`用户断开连接: ${socket.id}`);

    // 获取玩家信息
    const playerInfo = socketToPlayer.get(socket.id);
    if (playerInfo) {
      const { roomId, playerName } = playerInfo;

      // 从所有游戏房间中移除玩家
      for (const [roomId, room] of gameRooms.entries()) {
        room.players = room.players.filter((p: GamePlayer) => p.id !== socket.id);
        room.readyPlayers = room.readyPlayers.filter((id: string) => id !== socket.id);

        if (room.players.length === 0) {
          gameRooms.delete(roomId);
        }
      }

      // 更新映射关系
      socketToRoom.delete(socket.id);
      socketToPlayer.delete(socket.id);

      // 广播给同一房间的其他玩家
      socket.to(`room_${roomId}`).emit('player_left', {
        playerId: socket.id,
        playerName: playerName,
        roomId: roomId
      });
    }
  });

  socket.on('room_chat', (data: any) => {
    const { roomId, playerName, message } = data;
    console.log(`用户 ${playerName} 在房间 ${roomId} 发送聊天消息: ${message}`);

    // 广播给同一房间的其他玩家（除了自己）
    socket.to(`room_${roomId}`).emit('room_chat', {
      playerId: socket.id,
      playerName: playerName,
      message: message,
      roomId: roomId
    });
  });
});

// 开始游戏并发牌
function startGame(roomId: string) {
  if (!gameRooms.has(roomId)) return;

  const room = gameRooms.get(roomId);
  if (!room || room.gameStarted) return;

  room.gameStarted = true;

  // 创建一副牌
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);

  // 斗地主规则：3人游戏，每人17张，剩3张底牌
  const cardsPerPlayer = 17;
  const remainingCards = 3;

  // 发牌给玩家
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    const startIndex = i * cardsPerPlayer;
    const endIndex = startIndex + cardsPerPlayer;
    player.cards = shuffledDeck.slice(startIndex, endIndex);
    player.cardCount = cardsPerPlayer;
  }

  // 底牌
  room.bottomCards = shuffledDeck.slice(-remainingCards);

  // 通知所有玩家游戏开始并发送手牌
  room.players.forEach((player: GamePlayer) => {
    io.to(player.id).emit('cards_dealt', {
      playerId: player.id,
      cards: player.cards
    });
  });

  // 广播游戏状态更新给所有玩家
  io.to(`room_${roomId}`).emit('game_state_updated', {
    gameState: {
      currentPlayer: room.players[0].id, // 第一个玩家先出牌
      bottomCards: room.bottomCards,
      players: room.players.map((p: GamePlayer) => ({
        id: p.id,
        name: p.name,
        cardCount: p.cardCount
      }))
    }
  });

  console.log(`游戏开始，房间 ${roomId} 发牌完成`);
}

// 创建一副牌
function createDeck(): string[] {
  const suits = ['♠', '♥', '♣', '♦'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: string[] = [];

  // 添加普通牌
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(suit + rank);
    }
  }

  // 添加大小王
  deck.push('🃏'); // 小王
  deck.push('🂠'); // 大王

  return deck;
}

// 洗牌算法
function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 辅助函数：从游戏房间中移除玩家
function removePlayerFromGameRoom(socketId: string, roomId: string, playerName: string) {
  // 从游戏房间中移除玩家
  if (gameRooms.has(roomId)) {
    const room = gameRooms.get(roomId);
    if (room) {
      room.players = room.players.filter((p: GamePlayer) => p.id !== socketId);
      room.readyPlayers = room.readyPlayers.filter((id: string) => id !== socketId);

      // 如果房间为空，删除房间
      if (room.players.length === 0) {
        gameRooms.delete(roomId);
      } else {
        // 如果还有玩家，广播房间状态更新
        io.to(`room_${roomId}`).emit('room_state_updated', {
          roomId: roomId,
          players: room.players,
          readyPlayers: room.readyPlayers
        });
      }
    }
  }
}

server.listen(3000, () => {
  console.log('Server is running ...');
  console.log('Server is running on port 3000');
  console.log('Frontend files served from: /lobby/, /room/, /css/');
  console.log('Game API routes added: /api/games/rooms');
  console.log('DevTools CSP issues fixed');
});
