"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardPlayValidator = void 0;
const CardTypeDetector_1 = require("./CardTypeDetector");
const CardComparator_1 = require("./CardComparator");
class CardPlayValidator {
    static validate(playerCards, playedCards, lastPattern, isFirstPlay) {
        if (!playedCards || playedCards.length === 0) {
            return { valid: false, error: '请选择要出的牌' };
        }
        if (!this.hasCards(playerCards, playedCards)) {
            return { valid: false, error: '你没有这些牌' };
        }
        const pattern = CardTypeDetector_1.CardTypeDetector.detect(playedCards);
        if (pattern.type === CardTypeDetector_1.CardType.INVALID) {
            return { valid: false, error: '无效的牌型' };
        }
        if (isFirstPlay) {
            return { valid: true, pattern };
        }
        if (!lastPattern) {
            return { valid: false, error: '系统错误：缺少上家牌型' };
        }
        if (!this.canBeat(pattern, lastPattern)) {
            return { valid: false, error: '你的牌压不过上家' };
        }
        return { valid: true, pattern };
    }
    static hasCards(playerCards, playedCards) {
        const playerCardsCopy = [...playerCards];
        for (const card of playedCards) {
            const index = playerCardsCopy.indexOf(card);
            if (index === -1) {
                return false;
            }
            playerCardsCopy.splice(index, 1);
        }
        return true;
    }
    static canBeat(newPattern, lastPattern) {
        return CardComparator_1.CardComparator.canBeat(newPattern, lastPattern);
    }
}
exports.CardPlayValidator = CardPlayValidator;
//# sourceMappingURL=CardPlayValidator.js.map