"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerValidator = void 0;
class PlayerValidator {
    static validatePlayerExists(player) {
        return player !== undefined;
    }
    static validatePlayerInRoom(room, playerId) {
        const player = room.players.find(p => p.id === playerId);
        if (!this.validatePlayerExists(player)) {
            return { valid: false, error: '玩家不在房间中' };
        }
        return { valid: true };
    }
    static validatePlayerCanReady(room, playerId) {
        const playerValidation = this.validatePlayerInRoom(room, playerId);
        if (!playerValidation.valid) {
            return playerValidation;
        }
        if (room.status !== 'waiting') {
            return { valid: false, error: '游戏已开始，不能改变准备状态' };
        }
        const player = room.players.find(p => p.id === playerId);
        if (player && player.cards && player.cards.length > 0) {
            return { valid: false, error: '游戏进行中，不能改变准备状态' };
        }
        return { valid: true };
    }
    static validatePlayerCanLeave(room, playerId) {
        const playerValidation = this.validatePlayerInRoom(room, playerId);
        if (!playerValidation.valid) {
            return playerValidation;
        }
        if (room.status === 'playing' && room.landlord?.id === playerId) {
            return { valid: false, error: '地主不能离开游戏进行中' };
        }
        if (room.status === 'playing') {
            return { valid: true };
        }
        return { valid: true };
    }
    static validatePlayerCanPlay(room, playerId) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏未开始或已结束' };
        }
        const playerValidation = this.validatePlayerInRoom(room, playerId);
        if (!playerValidation.valid) {
            return playerValidation;
        }
        if (room.currentPlayerIndex !== -1) {
            const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
            if (currentPlayerIndex !== room.currentPlayerIndex) {
                return { valid: false, error: '还没轮到你出牌' };
            }
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player || !player.cards || player.cards.length === 0) {
            return { valid: false, error: '没有手牌' };
        }
        return { valid: true };
    }
    static validatePlayerCanGrabLandlord(room, playerId) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏状态不正确' };
        }
        if (room.landlord) {
            return { valid: false, error: '已经确定地主' };
        }
        const playerValidation = this.validatePlayerInRoom(room, playerId);
        if (!playerValidation.valid) {
            return playerValidation;
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player || !player.cards || player.cards.length === 0) {
            return { valid: false, error: '没有手牌' };
        }
        return { valid: true };
    }
    static validatePlayerCanPass(room, playerId) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏未开始或已结束' };
        }
        const playerValidation = this.validatePlayerInRoom(room, playerId);
        if (!playerValidation.valid) {
            return playerValidation;
        }
        if (room.currentPlayerIndex !== -1) {
            const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
            if (currentPlayerIndex !== room.currentPlayerIndex) {
                return { valid: false, error: '还没轮到你出牌' };
            }
        }
        return { valid: true };
    }
    static validatePlayerName(name) {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: '玩家名称不能为空' };
        }
        if (name.length > 20) {
            return { valid: false, error: '玩家名称不能超过20个字符' };
        }
        if (name.trim().length !== name.length) {
            return { valid: false, error: '玩家名称不能以空格开头或结尾' };
        }
        const invalidChars = /[<>"/\\|?*]/;
        if (invalidChars.test(name)) {
            return { valid: false, error: '玩家名称包含不允许的字符' };
        }
        return { valid: true };
    }
    static validatePlayerCards(playerCards, playedCards) {
        if (!playerCards || !playedCards) {
            return { valid: false, error: '玩家手牌或出牌信息不完整' };
        }
        const cardCounts = {};
        for (const card of playedCards) {
            cardCounts[card] = (cardCounts[card] || 0) + 1;
            if (cardCounts[card] > 1) {
                return { valid: false, error: '不能出重复的牌' };
            }
        }
        for (const card of playedCards) {
            if (!playerCards.includes(card)) {
                return { valid: false, error: '玩家没有这张牌' };
            }
        }
        return { valid: true };
    }
    static isPlayerReady(player) {
        return player.ready === true;
    }
    static isPlayerLandlord(room, playerId) {
        return room.landlord?.id === playerId;
    }
    static isPlayerCurrentTurn(room, playerId) {
        if (room.currentPlayerIndex === -1)
            return false;
        return room.players[room.currentPlayerIndex]?.id === playerId;
    }
    static getPlayerPosition(room, playerId) {
        return room.players.findIndex(p => p.id === playerId);
    }
    static getPlayerStatusDescription(player, isCurrentTurn = false) {
        if (player.ready) {
            if (isCurrentTurn) {
                return '已准备 (轮到你)';
            }
            return '已准备';
        }
        else {
            if (isCurrentTurn) {
                return '未准备 (轮到你)';
            }
            return '未准备';
        }
    }
}
exports.PlayerValidator = PlayerValidator;
//# sourceMappingURL=playerValidator.js.map