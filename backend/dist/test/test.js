"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
const rooms = new Map();
const gameRooms = new Map();
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
const socketToRoom = new Map();
const socketToPlayer = new Map();
app.use(express_1.default.json());
app.use(express_1.default.static(__dirname + '/../../frontend/public'));
app.use('/lobby/*', (req, res) => {
    res.sendFile(__dirname + '/../../frontend/public/lobby/index.html');
});
app.use('/room/*', (req, res) => {
    res.sendFile(__dirname + '/../../frontend/public/room/index.html');
});
app.get('/', function (req, res) {
    res.redirect('/lobby/');
});
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
app.get('/.well-known/*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: (error instanceof Error) ? error.message : '未知错误'
        });
    }
});
app.get('/api/games/rooms', (req, res) => {
    try {
        const roomsArray = Array.from(rooms.values());
        return res.status(200).json({
            success: true,
            data: roomsArray,
            message: '房间列表获取成功'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: (error instanceof Error) ? error.message : '未知错误'
        });
    }
});
app.post('/api/games/rooms/:roomId/join', (req, res) => {
    try {
        console.log('加入房间请求', req.body);
        const { roomId } = req.params;
        const { playerName, socketId } = req.body;
        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                error: '房间不存在'
            });
        }
        if (room.players.length >= room.maxPlayers) {
            return res.status(400).json({
                success: false,
                error: '房间已满'
            });
        }
        const player = {
            id: socketId || Date.now().toString(),
            name: playerName,
            joinedAt: new Date(),
            ready: false
        };
        room.players.push(player);
        return res.status(200).json({
            success: true,
            data: room,
            message: '加入房间成功'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: (error instanceof Error) ? error.message : '未知错误'
        });
    }
});
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
        const player = room.players.find((p) => p.id === playerId);
        if (!player) {
            return res.status(404).json({
                success: false,
                error: '玩家不在房间中'
            });
        }
        player.ready = true;
        console.log('玩家', player.name, '准备成功');
        const allReady = room.players.every((p) => p.ready);
        console.log('所有玩家准备状态:', room.players.map((p) => p.ready));
        return res.json({
            success: true,
            data: { player, allReady },
            message: '玩家准备成功'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: (error instanceof Error) ? error.message : '未知错误'
        });
    }
});
app.get('/test.html', function (req, res) {
    res.redirect('/lobby/');
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: '接口不存在',
        path: req.originalUrl
    });
});
io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.id}`);
    socket.on('join_game', (data) => {
        const { roomId, playerName } = data;
        if (!gameRooms.has(roomId)) {
            gameRooms.set(roomId, {
                id: roomId,
                players: [],
                readyPlayers: [],
                gameStarted: false
            });
        }
        const gameRoom = gameRooms.get(roomId);
        if (gameRoom && !gameRoom.players.find((p) => p.id === socket.id)) {
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
        socket.join(`room_${roomId}`);
        console.log(`用户 ${playerName} 加入房间 ${roomId}`);
        socket.to(`room_${roomId}`).emit('player_joined', {
            playerId: socket.id,
            playerName: playerName,
            roomId: roomId
        });
        io.to(`room_${roomId}`).emit('room_state_updated', {
            roomId: roomId,
            players: gameRoom.players,
            readyPlayers: gameRoom.readyPlayers
        });
    });
    socket.on('leave_game', (data) => {
        const { roomId, playerName } = data;
        removePlayerFromGameRoom(socket.id, roomId, playerName);
        socket.to(`room_${roomId}`).emit('player_left', {
            playerId: socket.id,
            playerName: playerName,
            roomId: roomId
        });
    });
    socket.on('player_ready', (data) => {
        console.log('玩家准备:', data);
        if (gameRooms.has(data.roomId)) {
            const room = gameRooms.get(data.roomId);
            if (room && !room.readyPlayers.includes(socket.id)) {
                room.readyPlayers.push(socket.id);
                if (room.readyPlayers.length === room.players.length && room.players.length >= 3) {
                    startGame(data.roomId);
                }
            }
        }
        socket.to(`room_${data.roomId}`).emit('player_ready', { playerId: socket.id });
    });
    socket.on('play_cards', (data) => {
        console.log('玩家出牌:', data);
        socket.to(`room_${data.roomId}`).emit('cards_played', {
            playerId: socket.id,
            cards: data.cards
        });
    });
    socket.on('pass_turn', (data) => {
        console.log('玩家跳过回合:', data);
        socket.to(`room_${data.roomId}`).emit('player_passed', {
            playerId: socket.id
        });
    });
    socket.on('disconnect', () => {
        console.log(`用户断开连接: ${socket.id}`);
        const playerInfo = socketToPlayer.get(socket.id);
        if (playerInfo) {
            const { roomId, playerName } = playerInfo;
            for (const [roomId, room] of gameRooms.entries()) {
                room.players = room.players.filter((p) => p.id !== socket.id);
                room.readyPlayers = room.readyPlayers.filter((id) => id !== socket.id);
                if (room.players.length === 0) {
                    gameRooms.delete(roomId);
                }
            }
            socketToRoom.delete(socket.id);
            socketToPlayer.delete(socket.id);
            socket.to(`room_${roomId}`).emit('player_left', {
                playerId: socket.id,
                playerName: playerName,
                roomId: roomId
            });
        }
    });
    socket.on('room_chat', (data) => {
        const { roomId, playerName, message } = data;
        console.log(`用户 ${playerName} 在房间 ${roomId} 发送聊天消息: ${message}`);
        socket.to(`room_${roomId}`).emit('room_chat', {
            playerId: socket.id,
            playerName: playerName,
            message: message,
            roomId: roomId
        });
    });
});
function startGame(roomId) {
    if (!gameRooms.has(roomId))
        return;
    const room = gameRooms.get(roomId);
    if (!room || room.gameStarted)
        return;
    room.gameStarted = true;
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const cardsPerPlayer = 17;
    const remainingCards = 3;
    for (let i = 0; i < room.players.length; i++) {
        const player = room.players[i];
        const startIndex = i * cardsPerPlayer;
        const endIndex = startIndex + cardsPerPlayer;
        player.cards = shuffledDeck.slice(startIndex, endIndex);
        player.cardCount = cardsPerPlayer;
    }
    room.bottomCards = shuffledDeck.slice(-remainingCards);
    room.players.forEach((player) => {
        io.to(player.id).emit('cards_dealt', {
            playerId: player.id,
            cards: player.cards
        });
    });
    io.to(`room_${roomId}`).emit('game_state_updated', {
        gameState: {
            currentPlayer: room.players[0].id,
            bottomCards: room.bottomCards,
            players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                cardCount: p.cardCount
            }))
        }
    });
    console.log(`游戏开始，房间 ${roomId} 发牌完成`);
}
function createDeck() {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(suit + rank);
        }
    }
    deck.push('🃏');
    deck.push('🂠');
    return deck;
}
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function removePlayerFromGameRoom(socketId, roomId, playerName) {
    if (gameRooms.has(roomId)) {
        const room = gameRooms.get(roomId);
        if (room) {
            room.players = room.players.filter((p) => p.id !== socketId);
            room.readyPlayers = room.readyPlayers.filter((id) => id !== socketId);
            if (room.players.length === 0) {
                gameRooms.delete(roomId);
            }
            else {
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
//# sourceMappingURL=test.js.map