import { Player } from '../../types';
export interface UserState {
    userId: string;
    userName: string;
    roomId?: string;
    isInRoom: boolean;
    roomState?: {
        ready: boolean;
        cards?: string[];
        cardCount: number;
        isLandlord?: boolean;
    };
    lastUpdated: Date;
}
export declare class StateRecoveryService {
    private userStates;
    saveUserState(userId: string, state: Partial<UserState>): void;
    restoreUserState(userId: string): UserState | null;
    updateUserRoomState(userId: string, roomId: string, user: Player): void;
    removeUserRoomState(userId: string): void;
    setUserAsLandlord(userId: string, cards: string[]): void;
    updateUserCards(userId: string, cards: string[]): void;
    getUsersNeedingRecovery(): UserState[];
    cleanupExpiredStates(maxAgeMinutes?: number): number;
    removeUserState(userId: string): boolean;
    getStateStats(): {
        total: number;
        inRooms: number;
        waitingRecovery: number;
    };
}
//# sourceMappingURL=stateRecovery.d.ts.map