import { _decorator, Component } from 'cc';
import { CardManager } from './CardManager';

const { ccclass, property } = _decorator;

/**
 * 游戏逻辑管理器
 * 负责处理斗地主的游戏规则和逻辑
 */
@ccclass('GameLogic')
export class GameLogic extends Component {
    @property(CardManager)
    public cardManager: CardManager = null!;

    // 游戏状态
    private gamePhase: 'waiting' | 'grab_landlord' | 'playing' | 'finished' = 'waiting';
    private currentPlayer: string = '';
    private landlord: string = '';
    private lastPlayedCards: string[] = [];
    private lastPlayer: string = '';
    private bottomCards: string[] = [];
    private playerCards: { [key: string]: string[] } = {};

    onLoad() {
        this.initGameLogic();
    }

    /**
     * 初始化游戏逻辑
     */
    private initGameLogic(): void {
        console.log('🎮 游戏逻辑初始化');
    }

    /**
     * 开始游戏
     */
    public startGame(players: string[]): void {
        console.log('🎮 开始游戏:', players);

        this.gamePhase = 'grab_landlord';
        this.currentPlayer = players[0];
        this.playerCards = {};

        // 发牌
        this.dealCards(players);

        // 开始抢地主阶段
        this.startGrabLandlordPhase();
    }

    /**
     * 发牌
     */
    private dealCards(players: string[]): void {
        // 创建一副完整的牌
        const allCards = this.createDeck();
        
        // 洗牌
        const shuffledCards = this.shuffleCards(allCards);

        // 发牌给玩家
        const playerCount = players.length;
        const cardsPerPlayer = 17;
        
        for (let i = 0; i < playerCount; i++) {
            const startIndex = i * cardsPerPlayer;
            const endIndex = startIndex + cardsPerPlayer;
            this.playerCards[players[i]] = shuffledCards.slice(startIndex, endIndex);
        }

        // 剩余3张作为底牌
        this.bottomCards = shuffledCards.slice(playerCount * cardsPerPlayer);

        console.log('🃏 发牌完成:', {
            players: this.playerCards,
            bottomCards: this.bottomCards
        });
    }

    /**
     * 创建一副完整的牌
     */
    private createDeck(): string[] {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck: string[] = [];

        // 添加普通牌
        suits.forEach(suit => {
            ranks.forEach(rank => {
                deck.push(`${suit}${rank}`);
            });
        });

        // 添加大小王
        deck.push('小王', '大王');

        return deck;
    }

    /**
     * 洗牌
     */
    private shuffleCards(cards: string[]): string[] {
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 开始抢地主阶段
     */
    private startGrabLandlordPhase(): void {
        console.log('👑 开始抢地主阶段');
        this.gamePhase = 'grab_landlord';
        this.currentPlayer = this.getNextPlayer(this.currentPlayer);
    }

    /**
     * 抢地主
     */
    public grabLandlord(playerId: string, isGrab: boolean): { success: boolean; error?: string } {
        if (this.gamePhase !== 'grab_landlord') {
            return { success: false, error: '当前不是抢地主阶段' };
        }

        if (this.currentPlayer !== playerId) {
            return { success: false, error: '不是当前玩家的回合' };
        }

        if (isGrab) {
            // 抢地主成功
            this.landlord = playerId;
            this.gamePhase = 'playing';
            
            // 将底牌给地主
            this.playerCards[playerId] = [...this.playerCards[playerId], ...this.bottomCards];
            this.bottomCards = [];

            console.log('👑 抢地主成功:', playerId);
            return { success: true };
        } else {
            // 不抢地主，轮到下一个玩家
            this.currentPlayer = this.getNextPlayer(playerId);
            
            // 检查是否所有人都放弃了
            if (this.currentPlayer === this.getFirstPlayer()) {
                // 重新开始抢地主
                this.startGrabLandlordPhase();
            }
            
            return { success: true };
        }
    }

    /**
     * 出牌
     */
    public playCards(playerId: string, cards: string[]): { success: boolean; error?: string; nextPlayer?: string } {
        if (this.gamePhase !== 'playing') {
            return { success: false, error: '当前不是游戏阶段' };
        }

        if (this.currentPlayer !== playerId) {
            return { success: false, error: '不是当前玩家的回合' };
        }

        // 验证玩家是否有这些牌
        if (!this.hasCards(playerId, cards)) {
            return { success: false, error: '没有这些牌' };
        }

        // 验证牌型
        const validation = this.cardManager.validateCardType(cards);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // 验证是否可以出牌（比较与上一手牌的大小）
        if (this.lastPlayedCards.length > 0) {
            const comparison = this.cardManager.compareCardTypes(cards, this.lastPlayedCards);
            if (comparison <= 0) {
                return { success: false, error: '牌型不够大' };
            }
        }

        // 出牌成功
        this.removeCards(playerId, cards);
        this.lastPlayedCards = cards;
        this.lastPlayer = playerId;

        // 检查是否获胜
        if (this.playerCards[playerId].length === 0) {
            this.gamePhase = 'finished';
            return { success: true, nextPlayer: null };
        }

        // 轮到下一个玩家
        this.currentPlayer = this.getNextPlayer(playerId);
        return { success: true, nextPlayer: this.currentPlayer };
    }

    /**
     * 不出
     */
    public passTurn(playerId: string): { success: boolean; error?: string; nextPlayer?: string } {
        if (this.gamePhase !== 'playing') {
            return { success: false, error: '当前不是游戏阶段' };
        }

        if (this.currentPlayer !== playerId) {
            return { success: false, error: '不是当前玩家的回合' };
        }

        // 不出，轮到下一个玩家
        this.currentPlayer = this.getNextPlayer(playerId);
        return { success: true, nextPlayer: this.currentPlayer };
    }

    /**
     * 检查玩家是否有指定的牌
     */
    private hasCards(playerId: string, cards: string[]): boolean {
        const playerHand = this.playerCards[playerId] || [];
        const handCopy = [...playerHand];

        for (const card of cards) {
            const index = handCopy.indexOf(card);
            if (index === -1) {
                return false;
            }
            handCopy.splice(index, 1);
        }

        return true;
    }

    /**
     * 从玩家手牌中移除指定的牌
     */
    private removeCards(playerId: string, cards: string[]): void {
        const playerHand = this.playerCards[playerId] || [];
        
        for (const card of cards) {
            const index = playerHand.indexOf(card);
            if (index !== -1) {
                playerHand.splice(index, 1);
            }
        }
    }

    /**
     * 获取下一个玩家
     */
    private getNextPlayer(currentPlayer: string): string {
        const players = Object.keys(this.playerCards);
        const currentIndex = players.indexOf(currentPlayer);
        const nextIndex = (currentIndex + 1) % players.length;
        return players[nextIndex];
    }

    /**
     * 获取第一个玩家
     */
    private getFirstPlayer(): string {
        return Object.keys(this.playerCards)[0];
    }

    /**
     * 获取游戏状态
     */
    public getGameState(): any {
        return {
            gamePhase: this.gamePhase,
            currentPlayer: this.currentPlayer,
            landlord: this.landlord,
            lastPlayedCards: this.lastPlayedCards,
            lastPlayer: this.lastPlayer,
            bottomCards: this.bottomCards,
            playerCards: this.playerCards
        };
    }

    /**
     * 获取玩家手牌
     */
    public getPlayerCards(playerId: string): string[] {
        return this.playerCards[playerId] || [];
    }

    /**
     * 获取当前玩家
     */
    public getCurrentPlayer(): string {
        return this.currentPlayer;
    }

    /**
     * 获取地主
     */
    public getLandlord(): string {
        return this.landlord;
    }

    /**
     * 获取游戏阶段
     */
    public getGamePhase(): string {
        return this.gamePhase;
    }

    /**
     * 获取最后出的牌
     */
    public getLastPlayedCards(): string[] {
        return this.lastPlayedCards;
    }

    /**
     * 获取最后出牌的玩家
     */
    public getLastPlayer(): string {
        return this.lastPlayer;
    }

    /**
     * 检查游戏是否结束
     */
    public isGameFinished(): boolean {
        return this.gamePhase === 'finished';
    }

    /**
     * 获取获胜者
     */
    public getWinner(): string | null {
        if (!this.isGameFinished()) {
            return null;
        }

        // 找到手牌为空的玩家
        for (const [playerId, cards] of Object.entries(this.playerCards)) {
            if (cards.length === 0) {
                return playerId;
            }
        }

        return null;
    }

    /**
     * 重置游戏
     */
    public resetGame(): void {
        this.gamePhase = 'waiting';
        this.currentPlayer = '';
        this.landlord = '';
        this.lastPlayedCards = [];
        this.lastPlayer = '';
        this.bottomCards = [];
        this.playerCards = {};
    }
}



