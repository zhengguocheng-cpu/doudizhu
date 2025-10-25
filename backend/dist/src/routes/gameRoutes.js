"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const roomService_1 = require("../services/room/roomService");
const playerService_1 = require("../services/player/playerService");
const gameService_1 = require("../services/game/gameService");
const gameFacade_1 = require("../services/gameFacade");
const userManager_1 = require("../services/user/userManager");
const SocketEventHandler_1 = require("../services/socket/SocketEventHandler");
const router = express_1.default.Router();
router.get('/rooms', (req, res) => {
    try {
        const rooms = roomService_1.roomService.getAllRooms();
        console.log('API返回房间数量:', rooms.length);
        console.log('房间数据:', rooms.map(r => ({ id: r.id, name: r.name, players: r.players.length })));
        const response = {
            success: true,
            data: rooms
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : '获取房间列表失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms', (req, res) => {
    try {
        const { name, maxPlayers } = req.body;
        if (!name) {
            const response = {
                success: false,
                error: '房间名称不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const room = roomService_1.roomService.createRoom(name, maxPlayers);
        const response = {
            success: true,
            data: room,
            message: '房间创建成功'
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '创建房间失败'
        };
        res.status(500).json(response);
    }
});
router.get('/rooms/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            const response = {
                success: false,
                error: '房间不存在'
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: room
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取房间信息失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/join', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerName } = req.body;
        if (!playerName) {
            const response = {
                success: false,
                error: '玩家名称不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const userManager = (0, userManager_1.getUserManager)();
        const user = userManager.getUserById(playerName);
        if (!user) {
            const response = {
                success: false,
                error: '用户不存在，请先登录'
            };
            res.status(404).json(response);
            return;
        }
        const player = roomService_1.roomService.joinRoom(roomId, playerName);
        const response = {
            success: true,
            data: player,
            message: '成功加入房间'
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '加入房间失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/ready', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId } = req.body;
        if (!playerId) {
            const response = {
                success: false,
                error: '玩家ID不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const success = roomService_1.roomService.togglePlayerReady(roomId, playerId);
        const response = {
            success,
            message: success ? '玩家准备成功' : '玩家准备失败'
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '玩家准备失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/validate-play', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId, cards } = req.body;
        if (!playerId || !cards) {
            const response = {
                success: false,
                error: '玩家ID和出牌信息不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            const response = {
                success: false,
                error: '房间不存在'
            };
            res.status(404).json(response);
            return;
        }
        const validation = (0, gameService_1.getGameService)().validateGameOperation(room, 'play_cards', playerId, { cards });
        const isValid = validation.valid;
        const response = {
            success: isValid,
            message: isValid ? '出牌有效' : '出牌无效',
            error: isValid ? undefined : validation.error
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '出牌验证失败'
        };
        res.status(500).json(response);
    }
});
router.get('/rooms/:roomId/players/:playerId/status', (req, res) => {
    try {
        const { roomId, playerId } = req.params;
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            const response = {
                success: false,
                error: '房间不存在'
            };
            res.status(404).json(response);
            return;
        }
        const player = (0, playerService_1.getPlayerService)().getPlayer(room, playerId);
        if (!player) {
            const response = {
                success: false,
                error: '玩家不存在'
            };
            res.status(404).json(response);
            return;
        }
        const status = (0, playerService_1.getPlayerService)().getPlayerStatusDescription(room, playerId);
        const response = {
            success: true,
            data: {
                player,
                status,
                isReady: (0, playerService_1.getPlayerService)().isPlayerReady(room, playerId),
                isLandlord: (0, playerService_1.getPlayerService)().isPlayerLandlord(room, playerId),
                isCurrentTurn: (0, playerService_1.getPlayerService)().isPlayerCurrentTurn(room, playerId)
            }
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取玩家状态失败'
        };
        res.status(500).json(response);
    }
});
router.get('/rooms/:roomId/players', (req, res) => {
    try {
        const { roomId } = req.params;
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            const response = {
                success: false,
                error: '房间不存在'
            };
            res.status(404).json(response);
            return;
        }
        const players = (0, playerService_1.getPlayerService)().getRoomPlayers(room);
        const response = {
            success: true,
            data: players.map((player) => ({
                ...player,
                status: (0, playerService_1.getPlayerService)().getPlayerStatusDescription(room, player.id)
            }))
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取玩家列表失败'
        };
        res.status(500).json(response);
    }
});
router.get('/rooms/:roomId/game-state', (req, res) => {
    try {
        const { roomId } = req.params;
        const gameState = (0, gameService_1.getGameService)().getGameState(roomId);
        if (!gameState.success) {
            const response = {
                success: false,
                error: gameState.error || '获取游戏状态失败'
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: gameState.data
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取游戏状态失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/start', (req, res) => {
    try {
        const { roomId } = req.params;
        const result = (0, gameService_1.getGameService)().startGame(roomId);
        const response = {
            success: result.success,
            message: result.success ? '游戏开始成功' : '游戏开始失败',
            error: result.error
        };
        if (result.success) {
            const room = roomService_1.roomService.getRoom(roomId);
            if (room && room.status === 'finished') {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
                    gameFinished: true
                });
            }
            else {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('game_started', roomId);
            }
            res.status(200).json(response);
        }
        else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        const response = {
            success: false,
            error: '开始游戏失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/grab-landlord', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId, isGrab } = req.body;
        if (!playerId) {
            const response = {
                success: false,
                error: '玩家ID不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const result = (0, gameService_1.getGameService)().handleGrabLandlord(roomId, playerId, isGrab);
        const response = {
            success: result.success,
            message: result.success ? '抢地主成功' : '抢地主失败',
            error: result.error,
            data: result.gameFinished ? { gameFinished: true } : undefined
        };
        if (result.success) {
            const room = roomService_1.roomService.getRoom(roomId);
            if (room && room.status === 'finished') {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
                    playerId: playerId,
                    isGrab: isGrab,
                    gameFinished: true
                });
            }
            else {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('grab_landlord', roomId, {
                    playerId: playerId,
                    isGrab: isGrab
                });
            }
            res.status(200).json(response);
        }
        else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        const response = {
            success: false,
            error: '抢地主失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/play-cards', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId, cards } = req.body;
        if (!playerId || !cards) {
            const response = {
                success: false,
                error: '玩家ID和出牌信息不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const result = (0, gameService_1.getGameService)().handlePlayCards(roomId, playerId, cards);
        const response = {
            success: result.success,
            message: result.success ? '出牌成功' : '出牌失败',
            error: result.error,
            data: result.nextPlayer ? { nextPlayer: result.nextPlayer } : undefined
        };
        if (result.success) {
            const room = roomService_1.roomService.getRoom(roomId);
            if (room && room.status === 'finished') {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
                    playerId: playerId,
                    cards: cards,
                    gameFinished: true
                });
            }
            else {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('play_cards', roomId, {
                    playerId: playerId,
                    cards: cards
                });
            }
            res.status(200).json(response);
        }
        else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        const response = {
            success: false,
            error: '出牌失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/pass-turn', (req, res) => {
    try {
        const { roomId } = req.params;
        const { playerId } = req.body;
        if (!playerId) {
            const response = {
                success: false,
                error: '玩家ID不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const result = (0, gameService_1.getGameService)().handlePassTurn(roomId, playerId);
        const response = {
            success: result.success,
            message: result.success ? '跳过成功' : '跳过失败',
            error: result.error,
            data: result.nextPlayer ? { nextPlayer: result.nextPlayer } : undefined
        };
        if (result.success) {
            SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('pass_turn', roomId, {
                playerId: playerId
            });
            res.status(200).json(response);
        }
        else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        const response = {
            success: false,
            error: '跳过回合失败'
        };
        res.status(500).json(response);
    }
});
router.get('/stats', (req, res) => {
    try {
        const stats = gameFacade_1.gameFacade.getSystemStats();
        const response = {
            success: true,
            data: stats
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取统计信息失败'
        };
        res.status(500).json(response);
    }
});
router.get('/health', (req, res) => {
    try {
        const health = gameFacade_1.gameFacade.healthCheck();
        const response = {
            success: health.healthy,
            data: health,
            message: health.healthy ? '系统运行正常' : '系统存在问题'
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '健康检查失败'
        };
        res.status(500).json(response);
    }
});
router.get('/rooms/:roomId/snapshot', (req, res) => {
    try {
        const { roomId } = req.params;
        const snapshot = gameFacade_1.gameFacade.getGameSnapshot(roomId);
        if (!snapshot.success) {
            const response = {
                success: false,
                error: snapshot.error || '获取游戏快照失败'
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: snapshot.snapshot
        };
        res.json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: '获取游戏快照失败'
        };
        res.status(500).json(response);
    }
});
router.post('/rooms/:roomId/action', (req, res) => {
    try {
        const { roomId } = req.params;
        const { action, playerId, data } = req.body;
        if (!action || !playerId) {
            const response = {
                success: false,
                error: '操作类型和玩家ID不能为空'
            };
            res.status(400).json(response);
            return;
        }
        const result = gameFacade_1.gameFacade.executeGameAction(roomId, action, playerId, data || {});
        const response = {
            success: result.success,
            message: result.success ? '操作执行成功' : '操作执行失败',
            error: result.error,
            data: result.result
        };
        if (result.success) {
            const room = roomService_1.roomService.getRoom(roomId);
            if (room && room.status === 'finished') {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate('game_ended', roomId, {
                    action: action,
                    playerId: playerId,
                    gameFinished: true
                });
            }
            else {
                SocketEventHandler_1.socketEventHandler.broadcastRoomsUpdate(`action_${action}`, roomId, {
                    action: action,
                    playerId: playerId,
                    data: data
                });
            }
            res.status(200).json(response);
        }
        else {
            res.status(400).json(response);
        }
    }
    catch (error) {
        const response = {
            success: false,
            error: '执行操作失败'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=gameRoutes.js.map