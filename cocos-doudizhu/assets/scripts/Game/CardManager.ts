import { _decorator, Component, Node, Sprite, SpriteFrame, Prefab, instantiate } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 扑克牌管理器
 * 负责管理扑克牌的创建、显示和动画
 */
@ccclass('CardManager')
export class CardManager extends Component {
    @property(Prefab)
    public cardPrefab: Prefab = null!;

    @property(SpriteFrame)
    public cardBackSprite: SpriteFrame = null!;

    @property([SpriteFrame])
    public cardSprites: SpriteFrame[] = [];

    // 卡片映射表
    private cardSpriteMap: Map<string, SpriteFrame> = new Map();
    private cardValueMap: Map<string, number> = new Map();

    onLoad() {
        this.initCardMaps();
    }

    /**
     * 初始化卡片映射
     */
    private initCardMaps(): void {
        // 初始化卡片精灵映射
        this.initCardSpriteMap();
        
        // 初始化卡片数值映射
        this.initCardValueMap();
    }

    /**
     * 初始化卡片精灵映射
     */
    private initCardSpriteMap(): void {
        // 这里需要根据实际的卡片图片资源来设置映射
        // 示例映射关系
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        suits.forEach((suit, suitIndex) => {
            ranks.forEach((rank, rankIndex) => {
                const cardString = `${suit}${rank}`;
                const spriteIndex = suitIndex * 13 + rankIndex;
                if (spriteIndex < this.cardSprites.length) {
                    this.cardSpriteMap.set(cardString, this.cardSprites[spriteIndex]);
                }
            });
        });

        // 大小王
        if (this.cardSprites.length >= 53) {
            this.cardSpriteMap.set('小王', this.cardSprites[52]);
            this.cardSpriteMap.set('大王', this.cardSprites[53]);
        }
    }

    /**
     * 初始化卡片数值映射
     */
    private initCardValueMap(): void {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        suits.forEach(suit => {
            ranks.forEach((rank, index) => {
                const cardString = `${suit}${rank}`;
                // A=1, 2-10=2-10, J=11, Q=12, K=13
                this.cardValueMap.set(cardString, index + 1);
            });
        });

        // 大小王
        this.cardValueMap.set('小王', 14);
        this.cardValueMap.set('大王', 15);
    }

    /**
     * 创建扑克牌
     */
    public createCard(cardString: string, parent: Node): Node | null {
        if (!this.cardPrefab) {
            console.error('卡片预制体未设置');
            return null;
        }

        const cardNode = instantiate(this.cardPrefab);
        cardNode.setParent(parent);

        // 设置卡片信息
        this.setupCard(cardNode, cardString);

        return cardNode;
    }

    /**
     * 设置卡片
     */
    public setupCard(cardNode: Node, cardString: string): void {
        // 获取卡片精灵组件
        const sprite = cardNode.getComponent(Sprite);
        if (!sprite) return;

        // 设置卡片图片
        const cardSprite = this.getCardSprite(cardString);
        if (cardSprite) {
            sprite.spriteFrame = cardSprite;
        } else {
            // 如果没有找到对应的图片，使用背面
            sprite.spriteFrame = this.cardBackSprite;
        }

        // 设置卡片数据
        const cardData = cardNode.getComponent('CardData');
        if (cardData) {
            cardData.cardString = cardString;
            cardData.cardValue = this.getCardValue(cardString);
            cardData.isRed = this.isRedCard(cardString);
        }
    }

    /**
     * 获取卡片精灵
     */
    public getCardSprite(cardString: string): SpriteFrame | null {
        return this.cardSpriteMap.get(cardString) || null;
    }

    /**
     * 获取卡片数值
     */
    public getCardValue(cardString: string): number {
        return this.cardValueMap.get(cardString) || 0;
    }

    /**
     * 判断是否为红牌
     */
    public isRedCard(cardString: string): boolean {
        return cardString.includes('♥') || cardString.includes('♦');
    }

    /**
     * 判断是否为黑牌
     */
    public isBlackCard(cardString: string): boolean {
        return cardString.includes('♠') || cardString.includes('♣');
    }

    /**
     * 获取卡片花色
     */
    public getCardSuit(cardString: string): string {
        if (cardString.includes('♠')) return '♠';
        if (cardString.includes('♥')) return '♥';
        if (cardString.includes('♦')) return '♦';
        if (cardString.includes('♣')) return '♣';
        return '';
    }

    /**
     * 获取卡片点数
     */
    public getCardRank(cardString: string): string {
        const suit = this.getCardSuit(cardString);
        return cardString.replace(suit, '');
    }

    /**
     * 比较两张牌的大小
     */
    public compareCards(card1: string, card2: string): number {
        const value1 = this.getCardValue(card1);
        const value2 = this.getCardValue(card2);
        return value1 - value2;
    }

    /**
     * 排序卡片
     */
    public sortCards(cards: string[]): string[] {
        return cards.sort((a, b) => this.compareCards(a, b));
    }

    /**
     * 验证牌型
     */
    public validateCardType(cards: string[]): { valid: boolean; type: string; error?: string } {
        if (!cards || cards.length === 0) {
            return { valid: false, type: 'none', error: '没有选择牌' };
        }

        const sortedCards = this.sortCards([...cards]);
        const length = sortedCards.length;

        // 单牌
        if (length === 1) {
            return { valid: true, type: 'single' };
        }

        // 对子
        if (length === 2) {
            if (this.getCardValue(sortedCards[0]) === this.getCardValue(sortedCards[1])) {
                return { valid: true, type: 'pair' };
            }
            return { valid: false, type: 'pair', error: '不是对子' };
        }

        // 三张
        if (length === 3) {
            if (this.getCardValue(sortedCards[0]) === this.getCardValue(sortedCards[1]) &&
                this.getCardValue(sortedCards[1]) === this.getCardValue(sortedCards[2])) {
                return { valid: true, type: 'triple' };
            }
            return { valid: false, type: 'triple', error: '不是三张' };
        }

        // 三带一
        if (length === 4) {
            const values = sortedCards.map(card => this.getCardValue(card));
            const counts = this.getCardCounts(values);
            const tripleValue = this.findTripleValue(counts);
            if (tripleValue !== -1) {
                return { valid: true, type: 'triple_with_single' };
            }
            return { valid: false, type: 'triple_with_single', error: '不是三带一' };
        }

        // 三带二
        if (length === 5) {
            const values = sortedCards.map(card => this.getCardValue(card));
            const counts = this.getCardCounts(values);
            const tripleValue = this.findTripleValue(counts);
            const pairValue = this.findPairValue(counts);
            if (tripleValue !== -1 && pairValue !== -1) {
                return { valid: true, type: 'triple_with_pair' };
            }
            return { valid: false, type: 'triple_with_pair', error: '不是三带二' };
        }

        // 顺子
        if (length >= 5) {
            if (this.isStraight(sortedCards)) {
                return { valid: true, type: 'straight' };
            }
        }

        // 同花顺
        if (length >= 5) {
            if (this.isFlush(sortedCards) && this.isStraight(sortedCards)) {
                return { valid: true, type: 'straight_flush' };
            }
        }

        // 四带一
        if (length === 5) {
            const values = sortedCards.map(card => this.getCardValue(card));
            const counts = this.getCardCounts(values);
            const fourValue = this.findFourValue(counts);
            if (fourValue !== -1) {
                return { valid: true, type: 'four_with_single' };
            }
        }

        // 四带二
        if (length === 6) {
            const values = sortedCards.map(card => this.getCardValue(card));
            const counts = this.getCardCounts(values);
            const fourValue = this.findFourValue(counts);
            if (fourValue !== -1) {
                return { valid: true, type: 'four_with_pair' };
            }
        }

        // 炸弹
        if (length === 4) {
            const values = sortedCards.map(card => this.getCardValue(card));
            const counts = this.getCardCounts(values);
            const fourValue = this.findFourValue(counts);
            if (fourValue !== -1) {
                return { valid: true, type: 'bomb' };
            }
        }

        // 王炸
        if (length === 2 && sortedCards.includes('小王') && sortedCards.includes('大王')) {
            return { valid: true, type: 'joker_bomb' };
        }

        return { valid: false, type: 'invalid', error: '不是有效的牌型' };
    }

    /**
     * 获取牌值计数
     */
    private getCardCounts(values: number[]): Map<number, number> {
        const counts = new Map<number, number>();
        values.forEach(value => {
            counts.set(value, (counts.get(value) || 0) + 1);
        });
        return counts;
    }

    /**
     * 查找三张牌的值
     */
    private findTripleValue(counts: Map<number, number>): number {
        for (const [value, count] of counts) {
            if (count === 3) {
                return value;
            }
        }
        return -1;
    }

    /**
     * 查找对子的值
     */
    private findPairValue(counts: Map<number, number>): number {
        for (const [value, count] of counts) {
            if (count === 2) {
                return value;
            }
        }
        return -1;
    }

    /**
     * 查找四张牌的值
     */
    private findFourValue(counts: Map<number, number>): number {
        for (const [value, count] of counts) {
            if (count === 4) {
                return value;
            }
        }
        return -1;
    }

    /**
     * 判断是否为顺子
     */
    private isStraight(cards: string[]): boolean {
        const values = cards.map(card => this.getCardValue(card));
        const sortedValues = values.sort((a, b) => a - b);
        
        for (let i = 1; i < sortedValues.length; i++) {
            if (sortedValues[i] - sortedValues[i - 1] !== 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断是否为同花
     */
    private isFlush(cards: string[]): boolean {
        const suit = this.getCardSuit(cards[0]);
        return cards.every(card => this.getCardSuit(card) === suit);
    }

    /**
     * 比较牌型大小
     */
    public compareCardTypes(cards1: string[], cards2: string[]): number {
        const type1 = this.validateCardType(cards1);
        const type2 = this.validateCardType(cards2);

        if (!type1.valid || !type2.valid) {
            return 0;
        }

        // 王炸最大
        if (type1.type === 'joker_bomb') return 1;
        if (type2.type === 'joker_bomb') return -1;

        // 炸弹
        if (type1.type === 'bomb' && type2.type !== 'bomb') return 1;
        if (type2.type === 'bomb' && type1.type !== 'bomb') return -1;

        // 同类型比较
        if (type1.type === type2.type) {
            return this.compareSameTypeCards(cards1, cards2, type1.type);
        }

        return 0;
    }

    /**
     * 比较同类型牌的大小
     */
    private compareSameTypeCards(cards1: string[], cards2: string[], type: string): number {
        // 这里需要根据具体牌型实现比较逻辑
        // 简化实现，实际项目中需要完善
        const value1 = this.getCardValue(cards1[0]);
        const value2 = this.getCardValue(cards2[0]);
        return value1 - value2;
    }
}
