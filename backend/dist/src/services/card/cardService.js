"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardService = exports.CardService = void 0;
const cardGenerator_1 = require("./cardGenerator");
const cardShuffler_1 = require("./cardShuffler");
const cardValidator_1 = require("./cardValidator");
class CardService {
    createShuffledDeck() {
        const deck = cardGenerator_1.CardGenerator.generateDeck();
        return cardShuffler_1.CardShuffler.shuffle(deck);
    }
    dealCards(playerCount) {
        if (!cardValidator_1.CardValidator.validateRoomPlayerCount(playerCount)) {
            throw new Error('玩家数量不符合斗地主规则（3-6人）');
        }
        const deck = this.createShuffledDeck();
        const totalCards = deck.length;
        const cardsPerPlayer = Math.floor(totalCards / playerCount);
        const playerCards = [];
        const bottomCards = [];
        for (let i = 0; i < playerCount; i++) {
            const startIndex = i * cardsPerPlayer;
            const endIndex = startIndex + cardsPerPlayer;
            playerCards.push(deck.slice(startIndex, endIndex));
        }
        const remainingStart = playerCount * cardsPerPlayer;
        bottomCards.push(...deck.slice(remainingStart));
        return { playerCards, bottomCards };
    }
    validatePlay(playerCards, playedCards) {
        try {
            if (!cardValidator_1.CardValidator.validateCardCount(playedCards)) {
                return { valid: false, error: '出牌数量不符合规则' };
            }
            if (!cardValidator_1.CardValidator.validatePlayerCards(playerCards, playedCards)) {
                return { valid: false, error: '玩家不拥有这些牌' };
            }
            for (const card of playedCards) {
                if (!cardValidator_1.CardValidator.isValidCardString(card)) {
                    return { valid: false, error: '包含无效的牌' };
                }
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : '出牌验证失败'
            };
        }
    }
    compareCardGroups(cards1, cards2) {
        if (cards1.length === 0 && cards2.length === 0)
            return 0;
        if (cards1.length === 0)
            return -1;
        if (cards2.length === 0)
            return 1;
        const value1 = cardValidator_1.CardValidator.getCardValue(cards1[0]);
        const value2 = cardValidator_1.CardValidator.getCardValue(cards2[0]);
        if (value1 > value2)
            return 1;
        if (value1 < value2)
            return -1;
        return 0;
    }
    getCardDisplayName(cardString) {
        try {
            const card = cardGenerator_1.CardGenerator.stringToCard(cardString);
            const suit = cardGenerator_1.CardGenerator.getSuitDisplayName(card.suit);
            const rank = cardGenerator_1.CardGenerator.getRankDisplayName(card.rank);
            return `${suit}${rank}`;
        }
        catch {
            return cardString;
        }
    }
    getCardsDisplayNames(cardStrings) {
        return cardStrings.map(card => this.getCardDisplayName(card));
    }
    validateShuffleFairness(shuffles = 1000) {
        const deck = cardGenerator_1.CardGenerator.generateDeck();
        const result = cardShuffler_1.CardShuffler.validateShuffleFairness(deck, shuffles);
        return result.isFair;
    }
}
exports.CardService = CardService;
CardService.CARDS_PER_PLAYER = 17;
CardService.BOTTOM_CARDS_COUNT = 3;
exports.cardService = new CardService();
//# sourceMappingURL=cardService.js.map