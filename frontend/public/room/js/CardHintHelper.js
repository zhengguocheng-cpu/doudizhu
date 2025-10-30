/**
 * 斗地主出牌提示助手（优化版）
 * 策略：优先提示能出最多张数的牌型，从最小的牌开始
 * 例如：有 33 444 5678 → 提示顺序：
 * 1. 3456 78 (顺子6张)
 * 2. 444带33 (三带二5张)
 * 3. 444 (三张3张)
 * 4. 33 (对子2张)
 * 5. 3 (单牌1张)
 */
class CardHintHelper {
    // 提示索引，用于循环提示
    static hintIndex = 0;

    /**
     * 获取出牌提示
     */
    static getHint(playerHand, lastPlay = null, isFirstPlay = false) {
        if (!playerHand || playerHand.length === 0) {
            return null;
        }

        // 首次出牌或新一轮
        if (isFirstPlay || !lastPlay) {
            const allHints = this.getAllPlayableCards(playerHand);
            if (allHints.length === 0) {
                return null;
            }
            
            const hint = allHints[this.hintIndex % allHints.length];
            this.hintIndex++;
            return hint;
        }

        // 需要压过上家的牌
        const allHints = this.getAllBeatingCards(playerHand, lastPlay);
        if (allHints.length === 0) {
            return null;
        }
        
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
     * 策略：优先提示张数多的牌型，从最小的牌开始
     */
    static getAllPlayableCards(playerHand) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 1. 优先查找顺子（5-12张，从最小的牌开始）
        const straights = this.findAllStraights(playerHand);
        if (straights.length > 0) {
            // 按张数从多到少排序，张数相同则按起始牌从小到大
            straights.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return this.getCardValue(a[0]) - this.getCardValue(b[0]);
            });
            hints.push(...straights);
        }
        
        // 2. 查找连对（3对以上，从最小的牌开始）
        const consecutivePairs = this.findAllConsecutivePairs(playerHand);
        if (consecutivePairs.length > 0) {
            consecutivePairs.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return this.getCardValue(a[0]) - this.getCardValue(b[0]);
            });
            hints.push(...consecutivePairs);
        }
        
        // 3. 查找飞机（2个或以上连续的三张）
        const planes = this.findAllPlanes(playerHand);
        if (planes.length > 0) {
            planes.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return this.getCardValue(a[0]) - this.getCardValue(b[0]);
            });
            hints.push(...planes);
        }
        
        // 4. 查找飞机带翅膀（带对子）
        const planesWithPairs = this.findAllPlanesWithPairs(playerHand);
        if (planesWithPairs.length > 0) {
            planesWithPairs.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return this.getCardValue(a[0]) - this.getCardValue(b[0]);
            });
            hints.push(...planesWithPairs);
        }
        
        // 5. 查找飞机带翅膀（带单牌）
        const planesWithSingles = this.findAllPlanesWithSingles(playerHand);
        if (planesWithSingles.length > 0) {
            planesWithSingles.sort((a, b) => {
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                return this.getCardValue(a[0]) - this.getCardValue(b[0]);
            });
            hints.push(...planesWithSingles);
        }
        
        // 6. 查找三带二（5张，从最小的三张开始）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 3) {
                const triple = cards.slice(0, 3);
                const remainingCards = playerHand.filter(c => !triple.includes(c));
                const remainingGroups = this.groupCardsByRank(remainingCards);
                const remainingRanks = Array.from(remainingGroups.keys()).sort((a, b) => a - b);
                
                // 找最小的对子
                for (const pairRank of remainingRanks) {
                    const pairCards = remainingGroups.get(pairRank);
                    if (pairCards.length >= 2) {
                        hints.push([...triple, ...pairCards.slice(0, 2)]);
                        break;
                    }
                }
            }
        }
        
        // 7. 查找三带一（4张，从最小的三张开始）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 3) {
                const triple = cards.slice(0, 3);
                const remainingCards = playerHand.filter(c => !triple.includes(c));
                if (remainingCards.length > 0) {
                    const sortedRemaining = this.sortCards(remainingCards);
                    hints.push([...triple, sortedRemaining[0]]);
                }
            }
        }
        
        // 8. 查找炸弹（4张，从小到大）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length === 4) {
                hints.push([...cards]);
            }
        }
        
        // 9. 查找三张（从小到大）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 3) {
                hints.push(cards.slice(0, 3));
            }
        }
        
        // 10. 查找对子（从小到大）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 2) {
                hints.push(cards.slice(0, 2));
            }
        }
        
        // 11. 单牌（从小到大）
        const sortedHand = this.sortCards(playerHand);
        for (const card of sortedHand) {
            hints.push([card]);
        }
        
        // 12. 王炸（最后提示，因为是最大的牌）
        const rocket = this.findRocket(playerHand);
        if (rocket) {
            hints.push(rocket);
        }
        
        return hints;
    }

    /**
     * 查找所有顺子（5张及以上连续的单牌）
     */
    static findAllStraights(playerHand) {
        const straights = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const ranks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 顺子最多到A(14)，不能包含2和王
        const validRanks = ranks.filter(r => r <= 14);
        
        // 从最长开始尝试，最多12张
        for (let length = 12; length >= 5; length--) {
            for (let i = 0; i <= validRanks.length - length; i++) {
                // 检查是否连续
                let isConsecutive = true;
                const straightCards = [];
                
                for (let j = 0; j < length; j++) {
                    const expectedRank = validRanks[i] + j;
                    if (validRanks[i + j] !== expectedRank) {
                        isConsecutive = false;
                        break;
                    }
                    const cards = cardGroups.get(validRanks[i + j]);
                    if (cards && cards.length > 0) {
                        straightCards.push(cards[0]);
                    } else {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive && straightCards.length === length) {
                    straights.push(straightCards);
                }
            }
        }
        
        return straights;
    }
    
    /**
     * 查找所有连对（3对及以上连续的对子）
     */
    static findAllConsecutivePairs(playerHand) {
        const consecutivePairs = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const ranks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 连对最多到A(14)，不能包含2和王
        const validRanks = ranks.filter(r => r <= 14 && cardGroups.get(r).length >= 2);
        
        // 从最长开始尝试
        for (let length = 10; length >= 3; length--) {
            for (let i = 0; i <= validRanks.length - length; i++) {
                // 检查是否连续
                let isConsecutive = true;
                const pairCards = [];
                
                for (let j = 0; j < length; j++) {
                    const expectedRank = validRanks[i] + j;
                    if (validRanks[i + j] !== expectedRank) {
                        isConsecutive = false;
                        break;
                    }
                    const cards = cardGroups.get(validRanks[i + j]);
                    if (cards && cards.length >= 2) {
                        pairCards.push(...cards.slice(0, 2));
                    } else {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive && pairCards.length === length * 2) {
                    consecutivePairs.push(pairCards);
                }
            }
        }
        
        return consecutivePairs;
    }
    
    /**
     * 查找所有飞机（2个及以上连续的三张）
     */
    static findAllPlanes(playerHand) {
        const planes = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const ranks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 飞机最多到A(14)，不能包含2和王
        const validRanks = ranks.filter(r => r <= 14 && cardGroups.get(r).length >= 3);
        
        // 从最长开始尝试
        for (let length = 6; length >= 2; length--) {
            for (let i = 0; i <= validRanks.length - length; i++) {
                // 检查是否连续
                let isConsecutive = true;
                const planeCards = [];
                
                for (let j = 0; j < length; j++) {
                    const expectedRank = validRanks[i] + j;
                    if (validRanks[i + j] !== expectedRank) {
                        isConsecutive = false;
                        break;
                    }
                    const cards = cardGroups.get(validRanks[i + j]);
                    if (cards && cards.length >= 3) {
                        planeCards.push(...cards.slice(0, 3));
                    } else {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive && planeCards.length === length * 3) {
                    planes.push(planeCards);
                }
            }
        }
        
        return planes;
    }

    /**
     * 查找所有飞机带翅膀（带对子）
     * 例如：333444+5566 (2个三张+2个对子，10张)
     */
    static findAllPlanesWithPairs(playerHand) {
        const planesWithPairs = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const ranks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 飞机最多到A(14)，不能包含2和王
        const validRanks = ranks.filter(r => r <= 14 && cardGroups.get(r).length >= 3);
        
        // 从最长开始尝试
        for (let length = 6; length >= 2; length--) {
            for (let i = 0; i <= validRanks.length - length; i++) {
                // 检查是否连续
                let isConsecutive = true;
                const planeCards = [];
                
                for (let j = 0; j < length; j++) {
                    const expectedRank = validRanks[i] + j;
                    if (validRanks[i + j] !== expectedRank) {
                        isConsecutive = false;
                        break;
                    }
                    const cards = cardGroups.get(validRanks[i + j]);
                    if (cards && cards.length >= 3) {
                        planeCards.push(...cards.slice(0, 3));
                    } else {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive && planeCards.length === length * 3) {
                    // 找到飞机，现在找对子作为翅膀
                    const remainingCards = playerHand.filter(c => !planeCards.includes(c));
                    const remainingGroups = this.groupCardsByRank(remainingCards);
                    const pairRanks = Array.from(remainingGroups.keys())
                        .filter(r => remainingGroups.get(r).length >= 2)
                        .sort((a, b) => a - b);
                    
                    // 需要length个对子
                    if (pairRanks.length >= length) {
                        const wings = [];
                        for (let k = 0; k < length; k++) {
                            const pairCards = remainingGroups.get(pairRanks[k]);
                            wings.push(...pairCards.slice(0, 2));
                        }
                        planesWithPairs.push([...planeCards, ...wings]);
                    }
                }
            }
        }
        
        return planesWithPairs;
    }

    /**
     * 查找所有飞机带翅膀（带单牌）
     * 例如：333444+56 (2个三张+2个单牌，8张)
     */
    static findAllPlanesWithSingles(playerHand) {
        const planesWithSingles = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const ranks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 飞机最多到A(14)，不能包含2和王
        const validRanks = ranks.filter(r => r <= 14 && cardGroups.get(r).length >= 3);
        
        // 从最长开始尝试
        for (let length = 6; length >= 2; length--) {
            for (let i = 0; i <= validRanks.length - length; i++) {
                // 检查是否连续
                let isConsecutive = true;
                const planeCards = [];
                
                for (let j = 0; j < length; j++) {
                    const expectedRank = validRanks[i] + j;
                    if (validRanks[i + j] !== expectedRank) {
                        isConsecutive = false;
                        break;
                    }
                    const cards = cardGroups.get(validRanks[i + j]);
                    if (cards && cards.length >= 3) {
                        planeCards.push(...cards.slice(0, 3));
                    } else {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive && planeCards.length === length * 3) {
                    // 找到飞机，现在找单牌作为翅膀
                    const remainingCards = playerHand.filter(c => !planeCards.includes(c));
                    
                    // 需要length个单牌
                    if (remainingCards.length >= length) {
                        const sortedRemaining = this.sortCards(remainingCards);
                        const wings = sortedRemaining.slice(0, length);
                        planesWithSingles.push([...planeCards, ...wings]);
                    }
                }
            }
        }
        
        return planesWithSingles;
    }

    /**
     * 获取所有能压过上家的牌组合
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
     * 优先级：真单张 > 拆对子 > 拆三张 > 绝不拆炸弹
     */
    static findAllBiggerSingles(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const sortedHand = this.sortCards(playerHand);
        
        // 1. 优先找真正的单张（不是对子、三张、炸弹的一部分）
        for (const card of sortedHand) {
            const value = this.getCardValue(card);
            if (value > minValue) {
                const rank = card.value;
                const count = cardGroups.get(rank)?.length || 0;
                if (count === 1) {
                    hints.push([card]);
                }
            }
        }
        
        // 2. 如果没有单张，考虑拆对子
        if (hints.length === 0) {
            for (const card of sortedHand) {
                const value = this.getCardValue(card);
                if (value > minValue) {
                    const rank = card.value;
                    const count = cardGroups.get(rank)?.length || 0;
                    if (count === 2) {
                        hints.push([card]);
                    }
                }
            }
        }
        
        // 3. 如果还没有，考虑拆三张
        if (hints.length === 0) {
            for (const card of sortedHand) {
                const value = this.getCardValue(card);
                if (value > minValue) {
                    const rank = card.value;
                    const count = cardGroups.get(rank)?.length || 0;
                    if (count === 3) {
                        hints.push([card]);
                    }
                }
            }
        }
        
        // 4. 绝对不拆炸弹（count === 4 的情况不处理）
        
        return hints;
    }

    /**
     * 查找所有更大的对子
     * 优先级：真对子 > 拆三张 > 绝不拆炸弹
     */
    static findAllBiggerPairs(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        // 1. 优先找真对子（恰好2张的）
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length === 2) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    hints.push(cards.slice(0, 2));
                }
            }
        }
        
        // 2. 如果没有真对子，考虑拆三张
        if (hints.length === 0) {
            for (const rank of sortedRanks) {
                const cards = cardGroups.get(rank);
                if (cards.length === 3) {
                    const value = CardTypeDetector.RANK_VALUES[rank];
                    if (value > minValue) {
                        hints.push(cards.slice(0, 2));
                    }
                }
            }
        }
        
        // 3. 绝对不拆炸弹（count === 4 的情况不处理）
        
        return hints;
    }

    /**
     * 查找所有更大的三张
     * 绝对不拆炸弹
     */
    static findAllBiggerTriples(playerHand, minValue) {
        const hints = [];
        const cardGroups = this.groupCardsByRank(playerHand);
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            // 只有恰好3张或超过4张时才能出三张，不拆炸弹
            if (cards.length === 3 || cards.length > 4) {
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
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    
                    if (remainingCards.length > 0) {
                        const sortedRemaining = this.sortCards(remainingCards);
                        hints.push([...triple, sortedRemaining[0]]);
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
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length >= 3) {
                const value = CardTypeDetector.RANK_VALUES[rank];
                if (value > minValue) {
                    const triple = cards.slice(0, 3);
                    const remainingCards = playerHand.filter(c => !triple.includes(c));
                    const remainingGroups = this.groupCardsByRank(remainingCards);
                    const remainingRanks = Array.from(remainingGroups.keys()).sort((a, b) => a - b);
                    
                    for (const pairRank of remainingRanks) {
                        const pairCards = remainingGroups.get(pairRank);
                        if (pairCards.length >= 2) {
                            hints.push([...triple, ...pairCards.slice(0, 2)]);
                            break;
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
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
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
        const sortedRanks = Array.from(cardGroups.keys()).sort((a, b) => a - b);
        
        for (const rank of sortedRanks) {
            const cards = cardGroups.get(rank);
            if (cards.length === 4) {
                hints.push(cards);
            }
        }
        
        return hints;
    }

    /**
     * 查找王炸
     * 支持字符串格式和对象格式
     */
    static findRocket(playerHand) {
        const hasSmallJoker = playerHand.some(card => {
            if (typeof card === 'string') {
                return card.includes('小王') || card === '🃏小王';
            } else if (card && typeof card === 'object') {
                return card.rank === '小王' || card.value === 16;
            }
            return false;
        });
        
        const hasBigJoker = playerHand.some(card => {
            if (typeof card === 'string') {
                return card.includes('大王') || card === '🃏大王';
            } else if (card && typeof card === 'object') {
                return card.rank === '大王' || card.value === 17;
            }
            return false;
        });

        if (hasSmallJoker && hasBigJoker) {
            return playerHand.filter(card => {
                if (typeof card === 'string') {
                    return card.includes('王') || card.includes('🃏');
                } else if (card && typeof card === 'object') {
                    return card.rank === '小王' || card.rank === '大王' || card.value === 16 || card.value === 17;
                }
                return false;
            });
        }

        return null;
    }

    /**
     * 获取牌的数值
     * 支持字符串格式（'♠3'）和对象格式（{suit: '♠', rank: '3', value: 3}）
     */
    static getCardValue(card) {
        // 如果是对象格式，直接返回value
        if (card && typeof card === 'object' && card.value !== undefined) {
            return card.value;
        }
        
        // 如果是字符串格式，使用CardTypeDetector
        if (typeof card === 'string') {
            return CardTypeDetector.getCardValue(card);
        }
        
        console.error('❌ 无效的卡牌格式:', card);
        return 0;
    }

    /**
     * 按牌值排序
     */
    static sortCards(cards) {
        return [...cards].sort((a, b) => {
            return this.getCardValue(a) - this.getCardValue(b);
        });
    }

    /**
     * 按点数分组
     * 支持字符串格式（'♠3'）和对象格式（{suit: '♠', rank: '3', value: 3}）
     */
    static groupCardsByRank(cards) {
        const groups = new Map();
        
        for (const card of cards) {
            // 兼容两种格式
            let rank;
            if (typeof card === 'string') {
                // 字符串格式：'♠3' -> '3'
                rank = card.replace(/[♠♥♣♦]/g, '');
            } else if (card && typeof card === 'object') {
                // 对象格式：{rank: '3', value: 3} -> 3 (使用value作为key)
                rank = card.value;
            } else {
                console.error('❌ 无效的卡牌格式:', card);
                continue;
            }
            
            if (!groups.has(rank)) {
                groups.set(rank, []);
            }
            groups.get(rank).push(card);
        }

        // 按牌值排序
        return new Map([...groups.entries()].sort((a, b) => {
            // a[0] 和 b[0] 是 rank (可能是字符串或数字)
            const valueA = typeof a[0] === 'number' ? a[0] : (CardTypeDetector.RANK_VALUES[a[0]] || 0);
            const valueB = typeof b[0] === 'number' ? b[0] : (CardTypeDetector.RANK_VALUES[b[0]] || 0);
            return valueA - valueB;
        }));
    }
}
