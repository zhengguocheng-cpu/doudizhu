/**
 * 游戏数据管理类
 * 负责管理游戏中的所有数据状态
 */

export interface UserInfo {
    userId: string;
    userName: string;
    avatar: string;
    diamondCount: number;
    totalScore: number;
    winCount: number;
    loseCount: number;
    isOnline: boolean;
}

export interface Player {
    id: string;
    name: string;
    avatar: string;
    cards: string[];
    isReady: boolean;
    isLandlord: boolean;
    isCurrentTurn: boolean;
    cardCount: number;
    position: 'top' | 'left' | 'right' | 'bottom';
}

export interface Room {
    id: string;
    name: string;
    players: Player[];
    maxPlayers: number;
    status: 'waiting' | 'playing' | 'finished';
    gameStarted: boolean;
    currentPlayer: string;
    bottomCards: string[];
    playedCards: string[];
    winner?: string;
    baseScore: number;
    totalMultiplier: number;
}

export interface GameState {
    room: Room | null;
    playerHand: string[];
    selectedCards: string[];
    gameStarted: boolean;
    currentPlayer: string;
    isMyTurn: boolean;
    gamePhase: 'waiting' | 'grab_landlord' | 'playing' | 'finished';
    lastPlayedCards: string[];
    lastPlayer: string;
    bottomCards: string[];
    playedCards: string[];
}

export interface ChatMessage {
    id: string;
    playerName: string;
    message: string;
    timestamp: number;
    type: 'message' | 'system';
}

/**
 * 游戏数据管理类
 */
export class GameData {
    private _userInfo: UserInfo | null = null;
    private _currentRoom: Room | null = null;
    private _gameState: GameState;
    private _rooms: Room[] = [];
    private _chatMessages: ChatMessage[] = [];
    private _isLoggedIn: boolean = false;

    constructor() {
        this._gameState = {
            room: null,
            playerHand: [],
            selectedCards: [],
            gameStarted: false,
            currentPlayer: '',
            isMyTurn: false,
            gamePhase: 'waiting',
            lastPlayedCards: [],
            lastPlayer: '',
            bottomCards: [],
            playedCards: []
        };
    }

    // 用户信息相关
    public get userInfo(): UserInfo | null {
        return this._userInfo;
    }

    public set userInfo(info: UserInfo | null) {
        this._userInfo = info;
        this._isLoggedIn = !!info;
    }

    public get isLoggedIn(): boolean {
        return this._isLoggedIn;
    }

    public get userName(): string {
        return this._userInfo?.userName || '游客';
    }

    public get userAvatar(): string {
        return this._userInfo?.avatar || '👤';
    }

    public get userId(): string {
        return this._userInfo?.userId || '';
    }

    // 房间相关
    public get currentRoom(): Room | null {
        return this._currentRoom;
    }

    public set currentRoom(room: Room | null) {
        this._currentRoom = room;
        this._gameState.room = room;
    }

    public get rooms(): Room[] {
        return this._rooms;
    }

    public set rooms(rooms: Room[]) {
        this._rooms = rooms;
    }

    // 游戏状态相关
    public get gameState(): GameState {
        return this._gameState;
    }

    public get playerHand(): string[] {
        return this._gameState.playerHand;
    }

    public set playerHand(cards: string[]) {
        this._gameState.playerHand = cards;
    }

    public get selectedCards(): string[] {
        return this._gameState.selectedCards;
    }

    public set selectedCards(cards: string[]) {
        this._gameState.selectedCards = cards;
    }

    public get gameStarted(): boolean {
        return this._gameState.gameStarted;
    }

    public set gameStarted(started: boolean) {
        this._gameState.gameStarted = started;
    }

    public get isMyTurn(): boolean {
        return this._gameState.isMyTurn;
    }

    public set isMyTurn(turn: boolean) {
        this._gameState.isMyTurn = turn;
    }

    public get currentPlayer(): string {
        return this._gameState.currentPlayer;
    }

    public set currentPlayer(player: string) {
        this._gameState.currentPlayer = player;
    }

    public get gamePhase(): string {
        return this._gameState.gamePhase;
    }

    public set gamePhase(phase: 'waiting' | 'grab_landlord' | 'playing' | 'finished') {
        this._gameState.gamePhase = phase;
    }

    // 聊天相关
    public get chatMessages(): ChatMessage[] {
        return this._chatMessages;
    }

    public addChatMessage(message: ChatMessage): void {
        this._chatMessages.push(message);
    }

    public clearChatMessages(): void {
        this._chatMessages = [];
    }

    // 游戏操作方法
    public updateRoom(room: Room): void {
        this._currentRoom = room;
        this._gameState.room = room;
        this._gameState.gameStarted = room.gameStarted;
        this._gameState.currentPlayer = room.currentPlayer;
    }

    public updateGameState(state: Partial<GameState>): void {
        Object.assign(this._gameState, state);
    }

    public setPlayerCards(cards: string[]): void {
        this._gameState.playerHand = cards;
    }

    public addSelectedCard(card: string): void {
        if (!this._gameState.selectedCards.includes(card)) {
            this._gameState.selectedCards.push(card);
        }
    }

    public removeSelectedCard(card: string): void {
        const index = this._gameState.selectedCards.indexOf(card);
        if (index > -1) {
            this._gameState.selectedCards.splice(index, 1);
        }
    }

    public clearSelectedCards(): void {
        this._gameState.selectedCards = [];
    }

    public setLastPlayedCards(cards: string[], playerId: string): void {
        this._gameState.lastPlayedCards = cards;
        this._gameState.lastPlayer = playerId;
    }

    public setGameEnded(winner: string): void {
        this._gameState.gamePhase = 'finished';
        this._gameState.gameStarted = false;
        if (this._currentRoom) {
            this._currentRoom.winner = winner;
            this._currentRoom.status = 'finished';
        }
    }

    public resetGame(): void {
        this._gameState = {
            room: this._currentRoom,
            playerHand: [],
            selectedCards: [],
            gameStarted: false,
            currentPlayer: '',
            isMyTurn: false,
            gamePhase: 'waiting',
            lastPlayedCards: [],
            lastPlayer: '',
            bottomCards: [],
            playedCards: []
        };
    }

    // 获取游戏状态描述
    public getGameStatusDescription(): string {
        if (!this._gameState.gameStarted) {
            return '等待开始';
        }

        switch (this._gameState.gamePhase) {
            case 'grab_landlord':
                return '抢地主阶段';
            case 'playing':
                return this._gameState.isMyTurn ? '轮到我出牌' : '等待其他玩家';
            case 'finished':
                return '游戏结束';
            default:
                return '等待中';
        }
    }

    public getRoomStatusDescription(): string {
        if (!this._currentRoom) {
            return '未加入房间';
        }

        if (this._currentRoom.gameStarted) {
            return '游戏中';
        }

        if (this._currentRoom.players.length >= this._currentRoom.maxPlayers) {
            return '房间已满';
        }

        return `等待玩家 (${this._currentRoom.players.length}/${this._currentRoom.maxPlayers})`;
    }

    // 清理数据
    public clear(): void {
        this._userInfo = null;
        this._currentRoom = null;
        this._rooms = [];
        this._chatMessages = [];
        this._isLoggedIn = false;
        this.resetGame();
    }
}

