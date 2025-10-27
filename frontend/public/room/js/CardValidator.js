/**
 * 斗地主出牌验证器
 * 负责验证出牌是否符合规则
 */
class CardValidator {
    /**
     * 验证出牌是否合法
     * @param {Array<string>} cards - 要出的牌
     * @param {Object|null} lastPlay - 上家出的牌型信息
     * @param {boolean} isFirstPlay - 是否是首次出牌
     * @param {Array<string>} playerHand - 玩家手牌（用于验证是否拥有这些牌）
     * @returns {Object} { valid: boolean, reason: string, cardType: Object }
     */
    static validate(cards, lastPlay = null, isFirstPlay = false, playerHand = null) {
        // 1. 检查是否选择了牌
        if (!cards || cards.length === 0) {
            return {
                valid: false,
                reason: '请选择要出的牌',
                cardType: null
            };
        }

        // 2. 验证玩家是否拥有这些牌
        if (playerHand && !this.hasCards(cards, playerHand)) {
            return {
                valid: false,
                reason: '手牌中没有这些牌',
                cardType: null
            };
        }

        // 3. 检测牌型
        const cardType = CardTypeDetector.detect(cards);
        if (!cardType) {
            return {
                valid: false,
                reason: '无效的牌型',
                cardType: null
            };
        }

        // 4. 首次出牌（任意牌型都可以）
        if (isFirstPlay) {
            return {
                valid: true,
                reason: '首次出牌',
                cardType: cardType
            };
        }

        // 5. 没有上家出牌（说明上一轮所有人都pass了，可以出任意牌型）
        if (!lastPlay) {
            return {
                valid: true,
                reason: '可以出任意牌型',
                cardType: cardType
            };
        }

        // 6. 验证是否能压过上家的牌
        const canBeat = this.canBeat(cardType, lastPlay);
        if (!canBeat.valid) {
            return {
                valid: false,
                reason: canBeat.reason,
                cardType: cardType
            };
        }

        return {
            valid: true,
            reason: '出牌合法',
            cardType: cardType
        };
    }

    /**
     * 判断cardType1是否能压过cardType2
     * @param {Object} cardType1 - 要出的牌型
     * @param {Object} cardType2 - 上家的牌型
     * @returns {Object} { valid: boolean, reason: string }
     */
    static canBeat(cardType1, cardType2) {
        // 1. 王炸可以压任何牌
        if (cardType1.type === CardTypeDetector.CARD_TYPES.ROCKET) {
            return { valid: true, reason: '王炸最大' };
        }

        // 2. 炸弹可以压除王炸外的任何牌
        if (cardType1.type === CardTypeDetector.CARD_TYPES.BOMB) {
            if (cardType2.type === CardTypeDetector.CARD_TYPES.ROCKET) {
                return { valid: false, reason: '王炸比炸弹大' };
            }
            if (cardType2.type === CardTypeDetector.CARD_TYPES.BOMB) {
                // 炸弹比炸弹，比较大小
                if (cardType1.value > cardType2.value) {
                    return { valid: true, reason: '炸弹更大' };
                } else {
                    return { valid: false, reason: '炸弹太小' };
                }
            }
            return { valid: true, reason: '炸弹可以压' };
        }

        // 3. 非炸弹不能压炸弹和王炸
        if (cardType2.type === CardTypeDetector.CARD_TYPES.BOMB ||
            cardType2.type === CardTypeDetector.CARD_TYPES.ROCKET) {
            return { valid: false, reason: '只有炸弹或王炸可以压炸弹/王炸' };
        }

        // 4. 必须是相同牌型
        if (cardType1.type !== cardType2.type) {
            return { valid: false, reason: '牌型不匹配' };
        }

        // 5. 相同牌型，比较大小
        if (cardType1.value > cardType2.value) {
            return { valid: true, reason: '牌更大' };
        } else {
            return { valid: false, reason: '牌太小，压不过' };
        }
    }

    /**
     * 验证玩家是否拥有这些牌
     * @param {Array<string>} cards - 要验证的牌
     * @param {Array<string>} playerHand - 玩家手牌
     * @returns {boolean}
     */
    static hasCards(cards, playerHand) {
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
     * 快速验证牌型是否有效（不考虑上家出牌）
     * @param {Array<string>} cards - 要验证的牌
     * @returns {boolean}
     */
    static isValidCardType(cards) {
        if (!cards || cards.length === 0) {
            return false;
        }
        
        const cardType = CardTypeDetector.detect(cards);
        return cardType !== null;
    }

    /**
     * 获取可以压过lastPlay的最小牌型
     * @param {Array<string>} playerHand - 玩家手牌
     * @param {Object} lastPlay - 上家的牌型
     * @returns {Array<Array<string>>} 可以出的牌组合列表
     */
    static findValidPlays(playerHand, lastPlay) {
        const validPlays = [];

        // 如果没有上家出牌，返回所有可能的牌型
        if (!lastPlay) {
            // 这里可以实现更复杂的逻辑，暂时返回空数组
            return validPlays;
        }

        // 根据上家牌型查找可以压过的牌
        switch (lastPlay.type) {
            case CardTypeDetector.CARD_TYPES.SINGLE:
                validPlays.push(...this.findBiggerSingles(playerHand, lastPlay.value));
                break;
            case CardTypeDetector.CARD_TYPES.PAIR:
                validPlays.push(...this.findBiggerPairs(playerHand, lastPlay.value));
                break;
            case CardTypeDetector.CARD_TYPES.TRIPLE:
                validPlays.push(...this.findBiggerTriples(playerHand, lastPlay.value));
                break;
            // ... 其他牌型
        }

        // 添加炸弹和王炸
        validPlays.push(...this.findBombs(playerHand));
        validPlays.push(...this.findRocket(playerHand));

        return validPlays;
    }

    /**
     * 查找比指定值大的单牌
     */
    static findBiggerSingles(playerHand, minValue) {
        const singles = [];
        
        playerHand.forEach(card => {
            const value = CardTypeDetector.getCardValue(card);
            if (value > minValue) {
                singles.push([card]);
            }
        });

        return singles;
    }

    /**
     * 查找比指定值大的对子
     */
    static findBiggerPairs(playerHand, minValue) {
        const pairs = [];
        const valueCount = {};

        // 统计每个值的数量
        playerHand.forEach(card => {
            const value = CardTypeDetector.getCardValue(card);
            if (!valueCount[value]) {
                valueCount[value] = [];
            }
            valueCount[value].push(card);
        });

        // 查找对子
        Object.keys(valueCount).forEach(value => {
            const v = parseInt(value);
            if (v > minValue && valueCount[value].length >= 2) {
                pairs.push([valueCount[value][0], valueCount[value][1]]);
            }
        });

        return pairs;
    }

    /**
     * 查找比指定值大的三张
     */
    static findBiggerTriples(playerHand, minValue) {
        const triples = [];
        const valueCount = {};

        // 统计每个值的数量
        playerHand.forEach(card => {
            const value = CardTypeDetector.getCardValue(card);
            if (!valueCount[value]) {
                valueCount[value] = [];
            }
            valueCount[value].push(card);
        });

        // 查找三张
        Object.keys(valueCount).forEach(value => {
            const v = parseInt(value);
            if (v > minValue && valueCount[value].length >= 3) {
                triples.push([
                    valueCount[value][0],
                    valueCount[value][1],
                    valueCount[value][2]
                ]);
            }
        });

        return triples;
    }

    /**
     * 查找所有炸弹
     */
    static findBombs(playerHand) {
        const bombs = [];
        const valueCount = {};

        // 统计每个值的数量
        playerHand.forEach(card => {
            const value = CardTypeDetector.getCardValue(card);
            if (!valueCount[value]) {
                valueCount[value] = [];
            }
            valueCount[value].push(card);
        });

        // 查找炸弹
        Object.keys(valueCount).forEach(value => {
            if (valueCount[value].length === 4) {
                bombs.push(valueCount[value]);
            }
        });

        return bombs;
    }

    /**
     * 查找王炸
     */
    static findRocket(playerHand) {
        const rockets = [];
        let hasBigJoker = false;
        let hasSmallJoker = false;
        let bigJokerCard = null;
        let smallJokerCard = null;

        playerHand.forEach(card => {
            if (card.includes('大王')) {
                hasBigJoker = true;
                bigJokerCard = card;
            }
            if (card.includes('小王')) {
                hasSmallJoker = true;
                smallJokerCard = card;
            }
        });

        if (hasBigJoker && hasSmallJoker) {
            rockets.push([bigJokerCard, smallJokerCard]);
        }

        return rockets;
    }
}

// 导出（如果在Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardValidator;
}
