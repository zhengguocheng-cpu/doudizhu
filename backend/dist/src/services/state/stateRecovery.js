"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateRecoveryService = void 0;
class StateRecoveryService {
    constructor() {
        this.userStates = new Map();
    }
    saveUserState(userId, state) {
        const existingState = this.userStates.get(userId) || {
            userId,
            userName: '',
            isInRoom: false,
            lastUpdated: new Date()
        };
        const updatedState = {
            ...existingState,
            ...state,
            lastUpdated: new Date()
        };
        this.userStates.set(userId, updatedState);
    }
    restoreUserState(userId) {
        return this.userStates.get(userId) || null;
    }
    updateUserRoomState(userId, roomId, user) {
        this.saveUserState(userId, {
            userName: user.name,
            roomId,
            isInRoom: true,
            roomState: {
                ready: user.ready,
                cards: user.cards,
                cardCount: user.cardCount || 0,
                isLandlord: false
            }
        });
    }
    removeUserRoomState(userId) {
        const state = this.userStates.get(userId);
        if (state) {
            this.saveUserState(userId, {
                roomId: undefined,
                isInRoom: false,
                roomState: undefined
            });
        }
    }
    setUserAsLandlord(userId, cards) {
        const state = this.userStates.get(userId);
        if (state && state.roomState) {
            state.roomState.isLandlord = true;
            state.roomState.cards = cards;
            state.roomState.cardCount = cards.length;
            state.lastUpdated = new Date();
            this.userStates.set(userId, state);
        }
    }
    updateUserCards(userId, cards) {
        const state = this.userStates.get(userId);
        if (state && state.roomState) {
            state.roomState.cards = cards;
            state.roomState.cardCount = cards.length;
            state.lastUpdated = new Date();
            this.userStates.set(userId, state);
        }
    }
    getUsersNeedingRecovery() {
        return Array.from(this.userStates.values()).filter(state => state.isInRoom && state.roomId);
    }
    cleanupExpiredStates(maxAgeMinutes = 30) {
        const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
        let cleanedCount = 0;
        for (const [userId, state] of this.userStates.entries()) {
            if (state.lastUpdated < cutoffTime) {
                this.userStates.delete(userId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    removeUserState(userId) {
        return this.userStates.delete(userId);
    }
    getStateStats() {
        const states = Array.from(this.userStates.values());
        return {
            total: states.length,
            inRooms: states.filter(s => s.isInRoom).length,
            waitingRecovery: states.filter(s => s.isInRoom && s.roomId).length
        };
    }
}
exports.StateRecoveryService = StateRecoveryService;
//# sourceMappingURL=stateRecovery.js.map