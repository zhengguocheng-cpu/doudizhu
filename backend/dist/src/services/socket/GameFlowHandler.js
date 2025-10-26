"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameFlowHandler = exports.GameFlowHandler = void 0;
const roomService_1 = require("../room/roomService");
const CardPlayHandler_1 = require("../game/CardPlayHandler");
class GameFlowHandler {
    constructor() {
        this.cardPlayHandler = null;
    }
    static getInstance() {
        if (!GameFlowHandler.instance) {
            GameFlowHandler.instance = new GameFlowHandler();
        }
        return GameFlowHandler.instance;
    }
    initialize(io) {
        this.io = io;
        this.cardPlayHandler = new CardPlayHandler_1.CardPlayHandler(io);
        console.log('GameFlowHandler initialized with CardPlayHandler');
    }
    getCardPlayHandler() {
        return this.cardPlayHandler;
    }
    startGame(roomId) {
        try {
            console.log(`🎮 开始游戏: 房间${roomId}`);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                console.error(`房间${roomId}不存在`);
                return;
            }
            if (!room.players || room.players.length !== 3) {
                console.error(`房间${roomId}玩家数量不足: ${room.players?.length}`);
                return;
            }
            room.status = 'playing';
            const dealResult = this.dealCards(room);
            this.io.to(`room_${roomId}`).emit('game_started', {
                roomId: roomId,
                players: room.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    ready: p.ready
                })),
                timestamp: new Date()
            });
            room.players.forEach((player, index) => {
                const socketId = this.findSocketIdByUserId(player.id);
                if (socketId) {
                    this.io.to(socketId).emit('deal_cards', {
                        cards: dealResult.playerCards[index],
                        cardCount: dealResult.playerCards[index].length,
                        bottomCards: dealResult.bottomCards,
                        bottomCardCount: dealResult.bottomCards.length
                    });
                    console.log(`发牌给玩家${player.name}: ${dealResult.playerCards[index].length}张`);
                }
            });
            console.log(`✅ 游戏开始成功: 房间${roomId}`);
            setTimeout(() => {
                this.startBidding(roomId);
            }, 2000);
        }
        catch (error) {
            console.error('开始游戏失败:', error);
        }
    }
    startBidding(roomId) {
        try {
            console.log(`🎲 开始抢地主: 房间${roomId}`);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                console.error(`房间${roomId}不存在`);
                return;
            }
            const firstBidderIndex = Math.floor(Math.random() * 3);
            const firstBidderId = room.players[firstBidderIndex].id;
            room.biddingState = {
                currentBidderId: firstBidderId,
                bids: [],
                landlordId: null,
                biddingOrder: [
                    room.players[firstBidderIndex].id,
                    room.players[(firstBidderIndex + 1) % 3].id,
                    room.players[(firstBidderIndex + 2) % 3].id
                ]
            };
            this.io.to(`room_${roomId}`).emit('bidding_start', {
                roomId: roomId,
                firstBidderId: firstBidderId,
                firstBidderName: room.players[firstBidderIndex].name,
                bottomCards: room.bottomCards,
                bottomCardCount: room.bottomCards.length
            });
            console.log(`🎲 抢地主开始: 第一个玩家=${firstBidderId}`);
        }
        catch (error) {
            console.error('开始抢地主失败:', error);
        }
    }
    handleBidLandlord(roomId, userId, bid) {
        try {
            console.log(`🎲 玩家${userId}抢地主: ${bid ? '抢' : '不抢'}`);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room || !room.biddingState) {
                console.error(`房间${roomId}不存在或未开始抢地主`);
                return;
            }
            if (room.biddingState.currentBidderId !== userId) {
                console.error(`不是玩家${userId}的回合`);
                return;
            }
            room.biddingState.bids.push({ userId, bid });
            if (bid) {
                room.biddingState.landlordId = userId;
            }
            const currentPlayer = room.players.find((p) => p.id === userId);
            const currentIndex = room.biddingState.biddingOrder.indexOf(userId);
            const nextIndex = (currentIndex + 1) % 3;
            const nextBidderId = room.biddingState.biddingOrder[nextIndex];
            this.io.to(`room_${roomId}`).emit('bid_result', {
                userId: userId,
                userName: currentPlayer?.name || userId,
                bid: bid,
                nextBidderId: room.biddingState.bids.length < 3 ? nextBidderId : null
            });
            if (room.biddingState.bids.length === 3) {
                this.determineLandlord(roomId);
            }
            else {
                room.biddingState.currentBidderId = nextBidderId;
            }
        }
        catch (error) {
            console.error('处理抢地主失败:', error);
        }
    }
    determineLandlord(roomId) {
        try {
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room || !room.biddingState) {
                console.error(`房间${roomId}不存在或未开始抢地主`);
                return;
            }
            const landlordId = room.biddingState.landlordId;
            if (!landlordId) {
                console.log(`❌ 没有人抢地主，重新发牌`);
                this.io.to(`room_${roomId}`).emit('no_landlord', {
                    message: '没有人抢地主，重新发牌'
                });
                setTimeout(() => {
                    this.startGame(roomId);
                }, 2000);
                return;
            }
            const landlord = room.players.find((p) => p.id === landlordId);
            if (!landlord) {
                console.error(`找不到地主玩家${landlordId}`);
                return;
            }
            if (!landlord.cards) {
                landlord.cards = [];
            }
            landlord.cards = landlord.cards.concat(room.bottomCards);
            this.sortCards(landlord.cards);
            room.players.forEach((p) => {
                p.role = p.id === landlordId ? 'landlord' : 'farmer';
            });
            room.gameState = {
                landlordId: landlordId,
                currentPlayerId: landlordId,
                lastPlayedCards: null,
                lastPlayerId: null
            };
            console.log(`👑 确定地主: ${landlord.name}`);
            this.io.to(`room_${roomId}`).emit('landlord_determined', {
                landlordId: landlordId,
                landlordName: landlord.name,
                bottomCards: room.bottomCards,
                roles: room.players.reduce((acc, p) => {
                    acc[p.id] = p.role;
                    return acc;
                }, {})
            });
            const landlordSocketId = this.findSocketIdByUserId(landlordId);
            if (landlordSocketId) {
                this.io.to(landlordSocketId).emit('landlord_cards_update', {
                    cards: landlord.cards,
                    cardCount: landlord.cards.length
                });
            }
            setTimeout(() => {
                this.io.to(`room_${roomId}`).emit('turn_to_play', {
                    playerId: landlordId,
                    playerName: landlord.name,
                    isFirst: true
                });
            }, 2000);
        }
        catch (error) {
            console.error('确定地主失败:', error);
        }
    }
    dealCards(room) {
        const suits = ['♠', '♥', '♣', '♦'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(`${suit}${rank}`);
            }
        }
        deck.push('🃏小王');
        deck.push('🃏大王');
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        console.log(`🎴 洗牌完成，共${deck.length}张牌`);
        const playerCards = [[], [], []];
        for (let i = 0; i < 51; i++) {
            const playerIndex = i % 3;
            playerCards[playerIndex].push(deck[i]);
        }
        const bottomCards = deck.slice(51, 54);
        playerCards.forEach(cards => {
            this.sortCards(cards);
        });
        console.log(`🎴 发牌完成: Player1=${playerCards[0].length}张, Player2=${playerCards[1].length}张, Player3=${playerCards[2].length}张, 底牌=${bottomCards.length}张`);
        room.players[0].cards = playerCards[0];
        room.players[1].cards = playerCards[1];
        room.players[2].cards = playerCards[2];
        room.bottomCards = bottomCards;
        return { playerCards, bottomCards };
    }
    sortCards(cards) {
        const rankOrder = {
            '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8,
            'J': 9, 'Q': 10, 'K': 11, 'A': 12, '2': 13, '🃏小王': 14, '🃏大王': 15
        };
        cards.sort((a, b) => {
            const rankA = a.includes('🃏') ? a : a.slice(1);
            const rankB = b.includes('🃏') ? b : b.slice(1);
            return (rankOrder[rankA] || 0) - (rankOrder[rankB] || 0);
        });
    }
    findSocketIdByUserId(userId) {
        if (!this.io)
            return null;
        const sockets = this.io.sockets.sockets;
        for (const [socketId, socket] of sockets) {
            const authSocket = socket;
            if (authSocket.handshake?.auth?.userId === userId ||
                authSocket.handshake?.auth?.userName === userId) {
                return socketId;
            }
        }
        return null;
    }
}
exports.GameFlowHandler = GameFlowHandler;
exports.gameFlowHandler = GameFlowHandler.getInstance();
//# sourceMappingURL=GameFlowHandler.js.map