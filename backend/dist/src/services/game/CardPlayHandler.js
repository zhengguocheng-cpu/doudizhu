"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardPlayHandler = void 0;
const CardPlayValidator_1 = require("./CardPlayValidator");
const roomService_1 = require("../room/roomService");
const ScoreCalculator_1 = require("./ScoreCalculator");
class CardPlayHandler {
    constructor(io) {
        this.io = io;
    }
    handlePlayCards(roomId, userId, cards) {
        console.log(`🎴 玩家 ${userId} 尝试出牌:`, cards);
        try {
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                console.error(`❌ 房间 ${roomId} 不存在`);
                return;
            }
            if (!room.gameState) {
                console.error(`❌ 房间 ${roomId} 游戏未开始`);
                return;
            }
            if (room.gameState.currentPlayerId !== userId) {
                console.error(`❌ 不是玩家 ${userId} 的回合`);
                this.io.to(this.findSocketIdByUserId(userId)).emit('play_cards_failed', {
                    error: '还没轮到你出牌'
                });
                return;
            }
            const player = room.players.find((p) => p.id === userId);
            if (!player) {
                console.error(`❌ 玩家 ${userId} 不在房间中`);
                return;
            }
            const validation = CardPlayValidator_1.CardPlayValidator.validate(player.cards, cards, room.gameState.lastPattern, room.gameState.isNewRound);
            if (!validation.valid) {
                console.error(`❌ 出牌验证失败: ${validation.error}`);
                this.io.to(this.findSocketIdByUserId(userId)).emit('play_cards_failed', {
                    error: validation.error
                });
                return;
            }
            for (const card of cards) {
                const index = player.cards.indexOf(card);
                if (index > -1) {
                    player.cards.splice(index, 1);
                }
            }
            player.cardCount = player.cards.length;
            room.gameState.lastPlayedCards = validation.pattern;
            room.gameState.lastPlayerId = userId;
            if (!room.gameState.playHistory) {
                room.gameState.playHistory = [];
            }
            room.gameState.playHistory.push({
                playerId: userId,
                playerName: player.name,
                cards: cards,
                cardType: validation.pattern,
                timestamp: new Date()
            });
            room.gameState.passCount = 0;
            room.gameState.isNewRound = false;
            console.log(`✅ 玩家 ${userId} 出牌成功:`, cards);
            console.log(`   牌型: ${validation.pattern?.type}, 剩余: ${player.cardCount}张`);
            this.io.to(`room_${roomId}`).emit('cards_played', {
                playerId: userId,
                playerName: player.name,
                cards: cards,
                cardType: validation.pattern,
                remainingCards: player.cardCount
            });
            if (this.checkGameOver(roomId, userId)) {
                return;
            }
            this.nextPlayer(roomId);
        }
        catch (error) {
            console.error('出牌处理错误:', error);
        }
    }
    handlePass(roomId, userId) {
        console.log(`🚫 玩家 ${userId} 选择不出`);
        try {
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                console.error(`❌ 房间 ${roomId} 不存在`);
                return;
            }
            if (!room.gameState) {
                console.error(`❌ 房间 ${roomId} 游戏未开始`);
                return;
            }
            if (room.gameState.currentPlayerId !== userId) {
                console.error(`❌ 不是玩家 ${userId} 的回合`);
                return;
            }
            if (room.gameState.isNewRound) {
                this.io.to(this.findSocketIdByUserId(userId)).emit('play_cards_failed', {
                    error: '新一轮必须出牌'
                });
                return;
            }
            const player = room.players.find((p) => p.id === userId);
            if (!player) {
                console.error(`❌ 玩家 ${userId} 不在房间中`);
                return;
            }
            room.gameState.passCount++;
            console.log(`✅ 玩家 ${userId} 不出，连续不出: ${room.gameState.passCount}`);
            this.io.to(`room_${roomId}`).emit('player_passed', {
                playerId: userId,
                playerName: player.name
            });
            if (room.gameState.passCount >= 2) {
                console.log(`🔄 连续2人不出，开始新一轮，由 ${room.gameState.lastPlayerId} 先出`);
                this.startNewRound(roomId, room.gameState.lastPlayerId);
            }
            else {
                this.nextPlayer(roomId);
            }
        }
        catch (error) {
            console.error('不出处理错误:', error);
        }
    }
    checkGameOver(roomId, winnerId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room)
            return false;
        const winner = room.players.find((p) => p.id === winnerId);
        if (!winner || winner.cardCount > 0) {
            return false;
        }
        console.log(`🎊 游戏结束！获胜者: ${winner.name}`);
        const landlordWin = winner.role === 'landlord';
        const gameScore = ScoreCalculator_1.ScoreCalculator.calculateGameScore(room.players, winner.id, room.gameState?.playHistory || []);
        console.log('💰 游戏得分:', gameScore);
        this.io.to(`room_${roomId}`).emit('game_over', {
            winnerId: winner.id,
            winnerName: winner.name,
            winnerRole: winner.role,
            landlordWin: landlordWin,
            score: gameScore
        });
        room.status = 'waiting';
        room.gameState = null;
        room.players.forEach((p) => {
            p.ready = false;
            p.role = null;
            p.cards = [];
            p.cardCount = 0;
        });
        console.log(`🔄 房间${roomId}已重置，可以开始新一局`);
        return true;
    }
    nextPlayer(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room || !room.gameState)
            return;
        const currentIndex = room.players.findIndex((p) => p.id === room.gameState.currentPlayerId);
        if (currentIndex === -1) {
            console.error('❌ 找不到当前玩家');
            return;
        }
        const nextIndex = (currentIndex + 1) % room.players.length;
        const nextPlayer = room.players[nextIndex];
        room.gameState.currentPlayerId = nextPlayer.id;
        console.log(`➡️ 轮到下一个玩家: ${nextPlayer.name}`);
        this.io.to(`room_${roomId}`).emit('turn_to_play', {
            playerId: nextPlayer.id,
            playerName: nextPlayer.name,
            isFirstPlay: room.gameState.isNewRound,
            lastPattern: room.gameState.lastPattern
        });
    }
    startNewRound(roomId, startPlayerId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room || !room.gameState)
            return;
        room.gameState.currentPlayerId = startPlayerId;
        room.gameState.lastPattern = null;
        room.gameState.passCount = 0;
        room.gameState.isNewRound = true;
        const startPlayer = room.players.find((p) => p.id === startPlayerId);
        console.log(`🔄 新一轮开始，由 ${startPlayer?.name} 先出`);
        this.io.to(`room_${roomId}`).emit('new_round_started', {
            startPlayerId: startPlayerId,
            startPlayerName: startPlayer?.name || startPlayerId
        });
        this.io.to(`room_${roomId}`).emit('turn_to_play', {
            playerId: startPlayerId,
            playerName: startPlayer?.name || startPlayerId,
            isFirstPlay: true,
            lastPattern: null
        });
    }
    findSocketIdByUserId(userId) {
        const sockets = Array.from(this.io.sockets.sockets.values());
        for (const socket of sockets) {
            const authData = socket.handshake?.auth;
            if (authData?.userId === userId || authData?.userName === userId) {
                return socket.id;
            }
        }
        return '';
    }
}
exports.CardPlayHandler = CardPlayHandler;
//# sourceMappingURL=CardPlayHandler.js.map