/**
 * 斗地主牌型检测器
 * 负责识别各种牌型：单牌、对子、三张、顺子、连对、飞机、炸弹、王炸等
 */
class CardTypeDetector {
    /**
     * 牌面值映射（用于排序和比较）
     */
    static RANK_VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
        '小王': 16, '🃏小王': 16,
        '大王': 17, '🃏大王': 17
    };

    /**
     * 牌型常量
     */
    static CARD_TYPES = {
        INVALID: 'INVALID',           // 无效牌型
        SINGLE: 'SINGLE',             // 单牌
        PAIR: 'PAIR',                 // 对子
        TRIPLE: 'TRIPLE',             // 三张
        TRIPLE_PLUS_ONE: 'TRIPLE_PLUS_ONE',       // 三带一
        TRIPLE_PLUS_TWO: 'TRIPLE_PLUS_TWO',       // 三带二
        STRAIGHT: 'STRAIGHT',         // 顺子（5张及以上连续单牌）
        DOUBLE_STRAIGHT: 'DOUBLE_STRAIGHT',       // 连对（3对及以上连续对子）
        PLANE: 'PLANE',               // 飞机（2个及以上连续三张）
        PLANE_PLUS_WINGS: 'PLANE_PLUS_WINGS',     // 飞机带翅膀
        FOUR_PLUS_TWO: 'FOUR_PLUS_TWO',           // 四带二
        BOMB: 'BOMB',                 // 炸弹（4张相同）
        ROCKET: 'ROCKET'              // 王炸（大王+小王）
    };

    /**
     * 检测牌型
     * @param {Array<string>} cards - 卡牌数组
     * @returns {Object|null} 牌型信息 { type, value, cards, description }
     */
    static detect(cards) {
        if (!cards || cards.length === 0) {
            return null;
        }

        // 解析和统计卡牌
        const cardInfo = this.analyzeCards(cards);
        
        // 按优先级检测牌型
        // 1. 王炸（最高优先级）
        if (this.isRocket(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.ROCKET, 100, cards, '王炸');
        }

        // 2. 炸弹
        if (this.isBomb(cardInfo)) {
            const bombValue = cardInfo.groups[4][0];
            return this.buildResult(this.CARD_TYPES.BOMB, bombValue, cards, '炸弹');
        }

        // 3. 单牌
        if (cards.length === 1) {
            return this.buildResult(this.CARD_TYPES.SINGLE, cardInfo.values[0], cards, '单牌');
        }

        // 4. 对子
        if (this.isPair(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.PAIR, cardInfo.groups[2][0], cards, '对子');
        }

        // 5. 三张
        if (this.isTriple(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.TRIPLE, cardInfo.groups[3][0], cards, '三张');
        }

        // 6. 三带一
        if (this.isTriplePlusOne(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.TRIPLE_PLUS_ONE, cardInfo.groups[3][0], cards, '三带一');
        }

        // 7. 三带二
        if (this.isTriplePlusTwo(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.TRIPLE_PLUS_TWO, cardInfo.groups[3][0], cards, '三带二');
        }

        // 8. 顺子
        const straightResult = this.isStraight(cardInfo);
        if (straightResult) {
            return this.buildResult(this.CARD_TYPES.STRAIGHT, straightResult.maxValue, cards, '顺子');
        }

        // 9. 连对
        const doubleStraightResult = this.isDoubleStraight(cardInfo);
        if (doubleStraightResult) {
            return this.buildResult(this.CARD_TYPES.DOUBLE_STRAIGHT, doubleStraightResult.maxValue, cards, '连对');
        }

        // 10. 飞机（不带翅膀）
        const planeResult = this.isPlane(cardInfo);
        if (planeResult) {
            return this.buildResult(this.CARD_TYPES.PLANE, planeResult.maxValue, cards, '飞机');
        }

        // 11. 飞机带翅膀
        const planeWingsResult = this.isPlanePlusWings(cardInfo);
        if (planeWingsResult) {
            return this.buildResult(this.CARD_TYPES.PLANE_PLUS_WINGS, planeWingsResult.maxValue, cards, '飞机带翅膀');
        }

        // 12. 四带二
        if (this.isFourPlusTwo(cardInfo)) {
            return this.buildResult(this.CARD_TYPES.FOUR_PLUS_TWO, cardInfo.groups[4][0], cards, '四带二');
        }

        // 无效牌型
        return null;
    }

    /**
     * 分析卡牌，统计信息
     */
    static analyzeCards(cards) {
        const valueCount = {}; // 每个值的数量
        const values = [];      // 所有值（排序后）

        // 统计每个值的数量
        cards.forEach(card => {
            const value = this.getCardValue(card);
            if (!valueCount[value]) {
                valueCount[value] = 0;
            }
            valueCount[value]++;
        });

        // 提取所有值并排序
        Object.keys(valueCount).forEach(v => {
            values.push(parseInt(v));
        });
        values.sort((a, b) => a - b);

        // 按数量分组：groups[n] = [值1, 值2, ...] 表示有n张的牌
        const groups = { 1: [], 2: [], 3: [], 4: [] };
        Object.keys(valueCount).forEach(v => {
            const count = valueCount[v];
            const value = parseInt(v);
            if (groups[count]) {
                groups[count].push(value);
            }
        });

        // 对每组内的值排序
        Object.keys(groups).forEach(count => {
            groups[count].sort((a, b) => a - b);
        });

        return {
            valueCount,  // { value: count }
            values,      // [value1, value2, ...]
            groups,      // { 1: [...], 2: [...], 3: [...], 4: [...] }
            cardCount: cards.length
        };
    }

    /**
     * 获取卡牌的数值
     */
    static getCardValue(card) {
        // 处理大小王
        if (card.includes('大王')) return this.RANK_VALUES['大王'];
        if (card.includes('小王')) return this.RANK_VALUES['小王'];

        // 提取数字或字母（去掉花色）
        const match = card.match(/[0-9JQKA]+/);
        if (match) {
            const rank = match[0];
            return this.RANK_VALUES[rank] || 0;
        }

        return 0;
    }

    /**
     * 王炸：大王+小王
     */
    static isRocket(cardInfo) {
        return cardInfo.cardCount === 2 &&
               cardInfo.values.includes(16) &&
               cardInfo.values.includes(17);
    }

    /**
     * 炸弹：4张相同
     */
    static isBomb(cardInfo) {
        return cardInfo.groups[4].length === 1 &&
               cardInfo.cardCount === 4;
    }

    /**
     * 对子：2张相同
     */
    static isPair(cardInfo) {
        return cardInfo.groups[2].length === 1 &&
               cardInfo.cardCount === 2;
    }

    /**
     * 三张：3张相同
     */
    static isTriple(cardInfo) {
        return cardInfo.groups[3].length === 1 &&
               cardInfo.cardCount === 3;
    }

    /**
     * 三带一：3张相同+1张单牌
     */
    static isTriplePlusOne(cardInfo) {
        return cardInfo.groups[3].length === 1 &&
               cardInfo.groups[1].length === 1 &&
               cardInfo.cardCount === 4;
    }

    /**
     * 三带二：3张相同+1对
     */
    static isTriplePlusTwo(cardInfo) {
        return cardInfo.groups[3].length === 1 &&
               cardInfo.groups[2].length === 1 &&
               cardInfo.cardCount === 5;
    }

    /**
     * 顺子：5张及以上连续单牌（不包括2和王）
     */
    static isStraight(cardInfo) {
        if (cardInfo.cardCount < 5) return null;
        
        // 所有牌都必须是单张
        if (cardInfo.groups[1].length !== cardInfo.cardCount) return null;

        const values = cardInfo.groups[1];
        
        // 不能包含2和王
        if (values.some(v => v >= 15)) return null;

        // 检查是否连续
        if (!this.isConsecutive(values)) return null;

        return { maxValue: values[values.length - 1] };
    }

    /**
     * 连对：3对及以上连续对子（不包括2和王）
     */
    static isDoubleStraight(cardInfo) {
        if (cardInfo.groups[2].length < 3) return null;
        if (cardInfo.cardCount !== cardInfo.groups[2].length * 2) return null;

        const values = cardInfo.groups[2];
        
        // 不能包含2和王
        if (values.some(v => v >= 15)) return null;

        // 检查是否连续
        if (!this.isConsecutive(values)) return null;

        return { maxValue: values[values.length - 1] };
    }

    /**
     * 飞机：2个及以上连续三张（不带翅膀）
     */
    static isPlane(cardInfo) {
        if (cardInfo.groups[3].length < 2) return null;
        if (cardInfo.cardCount !== cardInfo.groups[3].length * 3) return null;

        const values = cardInfo.groups[3];
        
        // 不能包含2和王
        if (values.some(v => v >= 15)) return null;

        // 检查是否连续
        if (!this.isConsecutive(values)) return null;

        return { maxValue: values[values.length - 1], planeCount: values.length };
    }

    /**
     * 飞机带翅膀：2个及以上连续三张+相应数量的单牌或对子
     */
    static isPlanePlusWings(cardInfo) {
        if (cardInfo.groups[3].length < 2) return null;

        const tripleValues = cardInfo.groups[3];
        
        // 不能包含2和王
        if (tripleValues.some(v => v >= 15)) return null;

        // 检查三张是否连续
        if (!this.isConsecutive(tripleValues)) return null;

        const planeCount = tripleValues.length;
        const wingCount = cardInfo.cardCount - planeCount * 3;

        // 飞机带单牌：每个三张带1张单牌
        if (wingCount === planeCount && cardInfo.groups[1].length === planeCount) {
            return { maxValue: tripleValues[tripleValues.length - 1], planeCount };
        }

        // 飞机带对子：每个三张带1对
        if (wingCount === planeCount * 2 && cardInfo.groups[2].length === planeCount) {
            return { maxValue: tripleValues[tripleValues.length - 1], planeCount };
        }

        return null;
    }

    /**
     * 四带二：4张相同+2张单牌或1对
     */
    static isFourPlusTwo(cardInfo) {
        if (cardInfo.groups[4].length !== 1) return null;

        const extraCount = cardInfo.cardCount - 4;

        // 四带两张单牌
        if (extraCount === 2 && cardInfo.groups[1].length === 2) {
            return true;
        }

        // 四带一对
        if (extraCount === 2 && cardInfo.groups[2].length === 1) {
            return true;
        }

        return false;
    }

    /**
     * 检查数组是否连续
     */
    static isConsecutive(values) {
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * 构建结果对象
     */
    static buildResult(type, value, cards, description) {
        return {
            type,           // 牌型类型
            value,          // 牌型值（用于比较大小）
            cards,          // 原始卡牌数组
            description     // 牌型描述
        };
    }

    /**
     * 比较两个牌型的大小
     * @returns {number} 1: type1 > type2, -1: type1 < type2, 0: 无法比较
     */
    static compare(type1, type2) {
        // 王炸最大
        if (type1.type === this.CARD_TYPES.ROCKET) return 1;
        if (type2.type === this.CARD_TYPES.ROCKET) return -1;

        // 炸弹可以压任何非王炸的牌
        if (type1.type === this.CARD_TYPES.BOMB && type2.type !== this.CARD_TYPES.BOMB) return 1;
        if (type2.type === this.CARD_TYPES.BOMB && type1.type !== this.CARD_TYPES.BOMB) return -1;

        // 必须是相同牌型才能比较
        if (type1.type !== type2.type) return 0;

        // 比较牌型值
        if (type1.value > type2.value) return 1;
        if (type1.value < type2.value) return -1;
        return 0;
    }
}

// 导出（如果在Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardTypeDetector;
}
