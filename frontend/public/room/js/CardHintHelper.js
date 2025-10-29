/**
 * 斗地主出牌提示助手
 * 负责分析手牌，给出智能出牌建议
 */
class CardHintHelper {
    // 提示索引，用于循环提示
    static hintIndex = 0;

    /**
     * 获取出牌提示
     * @param {Array<string>} playerHand - 玩家手牌
     * @param {Object|null} lastPlay - 上家出的牌型
     * @param {boolean} isFirstPlay - 是否首次出牌
     * @returns {Array<string>|null} 推荐的牌，如果没有可出的牌返回null
     */
    static getHint(playerHand, lastPlay = null, isFirstPlay = false) {
        if (!playerHand || playerHand.length === 0) {
            return null;
        }

        // 首次出牌或新一轮，获取所有可能的牌型
        if (isFirstPlay || !lastPlay) {
            const allHints = this.getAllPlayableCards(playerHand);
            if (allHints.length === 0) {
                return null;
            }
            
            // 循环提示
            const hint = allHints[this.hintIndex % allHints.length];
            this.hintIndex++;
            return hint;
        }

        // 需要压过上家的牌，获取所有可能的牌型
        const allHints = this.getAllBeatingCards(playerHand, lastPlay);
        if (allHints.length === 0) {
            return null;
        }
        
        // 循环提示
        const hint = allHints[this.hintIndex % allHints.length];
        this.hintIndex++;
        return hint;
    }

    /**
     * 重置提示索引
     */
    static resetHintIndex() {
        this.hintIndex = 0;
    }

    /**
     * 获取所有可出的牌组合（首次出牌时使用）
     * @param {Array<string>} playerHand - 玩家手牌
     * @returns {Array<Array<string>>} 所有可能的牌型，按优先级排序
     */
    static getAllPlayableCards(playerHand) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        // 1. 查找所有炸弹（优先级最高，尽快出掉）
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length === 4) {
                hints.push([...cards]);
            }
        }
        
        // 2. 查找王炸
        const rocket = this.findRocket(playerHand);
        if (rocket) {
            hints.push(rocket);
        }
        
        // 3. 查找所有三带二（尽可能多出牌）
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const triple = cards.slice(0, 3);
                const remainingCards = playerHand.filter(c => !triple.includes(c));
                const remainingGroups = this.groupCardsByRank(remainingCards);
                
                for (const [pairRank, pairCards] of remainingGroups.entries()) {
                    if (pairCards.length >= 2) {
                        hints.push([...triple, ...pairCards.slice(0, 2)]);
                        break; // 只取第一个三带二
                    }
                }
            }
        }
        
        // 4. 查找所有三带一
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const triple = cards.slice(0, 3);
                const remainingCards = playerHand.filter(c => !triple.includes(c));
                if (remainingCards.length > 0) {
                    const sortedRemaining = this.sortCards(remainingCards);
                    hints.push([...triple, sortedRemaining[0]]);
                }
            }
        }
        
        // 5. 查找所有三张
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                hints.push(cards.slice(0, 3));
            }
        }
        
        // 6. 查找所有对子
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 2) {
                hints.push(cards.slice(0, 2));
            }
        }
        
        // 7. 所有单牌（从小到大）
        const sortedHand = this.sortCards(playerHand);
        for (const card of sortedHand) {
            hints.push([card]);
        }
        
        return hints;
    }

    /**
     * 获取所有能压过上家的牌组合
     * @param {Array<string>} playerHand - 玩家手牌
     * @param {Object} lastPlay - 上家出的牌型
     * @returns {Array<Array<string>>} 所有可能的牌型
     */
    static getAllBeatingCards(playerHand, lastPlay) {
        const hints = [];
        const lastType = CardValidator.normalizeType(lastPlay.type);
        const lastValue = lastPlay.value;
        
        // 按牌型查找所有能压过的牌
        switch (lastType) {
            case 'single':
                hints.push(...this.findAllBiggerSingles(playerHand, lastValue));
                break;
            
            case 'pair':
                hints.push(...this.findAllBiggerPairs(playerHand, lastValue));
                break;
            
            case 'triple':
                hints.push(...this.findAllBiggerTriples(playerHand, lastValue));
                break;
            
            case 'triple_with_single':
                hints.push(...this.findAllBiggerTripleWithSingles(playerHand, lastValue));
                break;
            
            case 'triple_with_pair':
                hints.push(...this.findAllBiggerTripleWithPairs(playerHand, lastValue));
                break;
            
            case 'bomb':
                hints.push(...this.findAllBiggerBombs(playerHand, lastValue));
                break;
        }
        
        // 任何牌型都可以用炸弹或王炸压
        if (lastType !== 'bomb' && lastType !== 'rocket') {
            const bombs = this.findAllBombs(playerHand);
            hints.push(...bombs);
        }
        
        const rocket = this.findRocket(playerHand);
        if (rocket && lastType !== 'rocket') {
            hints.push(rocket);
        }
        
        return hints;
    }

    /**
     * 查找所有更大的单牌
     */
    static findAllBiggerSingles(playerHand, minValue) {
        const hints = [];
        const sortedHand = this.sortCards(playerHand);
        
        for (const card of sortedHand) {
            const value = CardTypeDetector.getCardValue(card);
            if (value > minValue) {
                hints.push([card]);
            }
        }
        
        return hints;
    }

    /**
     * 查找所有更大的对子
     */
    static findAllBiggerPairs(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 2) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    hints.push(cards.slice(0, 2));
                }
            }
        }
        
        return hints;
    }

    /**
     * 查找所有更大的三张
     */
    static findAllBiggerTriples(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    hints.push(cards.slice(0, 3));
                }
            }
        }
        
        return hints;
    }

    /**
     * 查找所有更大的三带一
     */
    static findAllBiggerTripleWithSingles(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    
                    if (remainingCards.length > 0) {
                        const sortedRemaining = this.sortCards(remainingCards);
                        // 可以带不同的单牌
                        for (const single of sortedRemaining) {
                            hints.push([...triple, single]);
                        }
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * 查找所有更大的三带二
     */
    static findAllBiggerTripleWithPairs(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    const remainingGroups = this.groupCardsByRank(remainingCards);
                    
                    for (const [pairRank, pairCards] of remainingGroups.entries()) {
                        if (pairCards.length >= 2) {
                            hints.push([...triple, ...pairCards.slice(0, 2)]);
                        }
                    }
                }
            }
        }
        
        return hints;
    }

    /**
     * 查找所有更大的炸弹
     */
    static findAllBiggerBombs(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length === 4) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    hints.push(cards);
                }
            }
        }
        
        return hints;
    }

    /**
     * 查找所有炸弹
     */
    static findAllBombs(playerHand) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length === 4) {
                hints.push(cards);
            }
        }
        
        return hints;
    }

    /**
     * 获取能压过上家的牌
     * @param {Array<string>} playerHand - 玩家手牌
     * @param {Object} lastPlay - 上家出的牌型
     * @returns {Array<string>|null} 推荐的牌
     */
    static getBeatingCards(playerHand, lastPlay) {
        const lastType = CardValidator.normalizeType(lastPlay.type);
        const lastValue = lastPlay.value;

        // 按牌型查找能压过的牌
        switch (lastType) {
            case 'single':
                return this.findBiggerSingle(playerHand, lastValue);
            
            case 'pair':
                return this.findBiggerPair(playerHand, lastValue);
            
            case 'triple':
                return this.findBiggerTriple(playerHand, lastValue);
            
            case 'triple_with_single':
                return this.findBiggerTripleWithSingle(playerHand, lastValue);
            
            case 'triple_with_pair':
                return this.findBiggerTripleWithPair(playerHand, lastValue);
            
            case 'straight':
                return this.findBiggerStraight(playerHand, lastValue, lastPlay.cards.length);
            
            case 'consecutive_pairs':
                return this.findBiggerConsecutivePairs(playerHand, lastValue, lastPlay.cards.length / 2);
            
            case 'bomb':
                return this.findBiggerBomb(playerHand, lastValue);
            
            default:
                // 尝试用炸弹或王炸压
                return this.findBomb(playerHand) || this.findRocket(playerHand);
        }
    }

    /**
     * 查找更大的单牌
     */
    static findBiggerSingle(playerHand, minValue) {
        const sortedHand = this.sortCards(playerHand);
        
        for (const card of sortedHand) {
            const value = CardTypeDetector.getCardValue(card);
            if (value > minValue) {
                return [card];
            }
        }

        // 没有更大的单牌，尝试炸弹或王炸
        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的对子
     */
    static findBiggerPair(playerHand, minValue) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 2) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    return cards.slice(0, 2);
                }
            }
        }

        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的三张
     */
    static findBiggerTriple(playerHand, minValue) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    return cards.slice(0, 3);
                }
            }
        }

        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的三带一
     */
    static findBiggerTripleWithSingle(playerHand, minValue) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        // 找三张
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    
                    // 找一张单牌（优先选最小的）
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    if (remainingCards.length > 0) {
                        const sortedRemaining = this.sortCards(remainingCards);
                        return [...triple, sortedRemaining[0]];
                    }
                }
            }
        }

        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的三带二
     */
    static findBiggerTripleWithPair(playerHand, minValue) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        // 找三张
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    
                    // 找一对（优先选最小的）
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    const remainingGroups = this.groupCardsByRank(remainingCards);
                    
                    for (const [pairRank, pairCards] of remainingGroups.entries()) {
                        if (pairCards.length >= 2) {
                            return [...triple, ...pairCards.slice(0, 2)];
                        }
                    }
                }
            }
        }

        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的顺子
     */
    static findBiggerStraight(playerHand, minValue, length) {
        // TODO: 实现顺子查找逻辑
        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的连对
     */
    static findBiggerConsecutivePairs(playerHand, minValue, pairCount) {
        // TODO: 实现连对查找逻辑
        return this.findBomb(playerHand) || this.findRocket(playerHand);
    }

    /**
     * 查找更大的炸弹
     */
    static findBiggerBomb(playerHand, minValue) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length === 4) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    return cards;
                }
            }
        }

        return this.findRocket(playerHand);
    }

    /**
     * 查找炸弹
     */
    static findBomb(playerHand) {
        const cardGroups = this.groupCardsByRank(playerHand);
        
        for (const [rank, cards] of cardGroups.entries()) {
            if (cards.length === 4) {
                return cards;
            }
        }

        return null;
    }

    /**
     * 查找王炸
     */
    static findRocket(playerHand) {
        const hasSmallJoker = playerHand.some(card => 
            card.includes('小王') || card === '🃏小王'
        );
        const hasBigJoker = playerHand.some(card => 
            card.includes('大王') || card === '🃏大王'
        );

        if (hasSmallJoker && hasBigJoker) {
            return playerHand.filter(card => 
                card.includes('王') || card.includes('🃏')
            );
        }

        return null;
    }

    /**
     * 按牌值排序
     */
    static sortCards(cards) {
        return [...cards].sort((a, b) => {
            return CardTypeDetector.getCardValue(a) - CardTypeDetector.getCardValue(b);
        });
    }

    /**
     * 按点数分组
     */
    static groupCardsByRank(cards) {
        const groups = new Map();
        
        for (const card of cards) {
            const rank = card.replace(/[♠♥♣♦]/g, '');
            if (!groups.has(rank)) {
                groups.set(rank, []);
            }
            groups.get(rank).push(card);
        }

        // 按牌值排序
        return new Map([...groups.entries()].sort((a, b) => {
            const valueA = CardTypeDetector.RANK_VALUES[a[0]] || 0;
            const valueB = CardTypeDetector.RANK_VALUES[b[0]] || 0;
            return valueA - valueB;
        }));
    }
}
