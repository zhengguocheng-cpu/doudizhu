"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardComparator = void 0;
const CardTypeDetector_1 = require("./CardTypeDetector");
class CardComparator {
    static compare(pattern1, pattern2) {
        if (pattern1.type === CardTypeDetector_1.CardType.INVALID || pattern2.type === CardTypeDetector_1.CardType.INVALID) {
            return 0;
        }
        if (pattern1.type === CardTypeDetector_1.CardType.ROCKET) {
            return pattern2.type === CardTypeDetector_1.CardType.ROCKET ? 0 : 1;
        }
        if (pattern2.type === CardTypeDetector_1.CardType.ROCKET) {
            return -1;
        }
        if (pattern1.type === CardTypeDetector_1.CardType.BOMB && pattern2.type !== CardTypeDetector_1.CardType.BOMB) {
            return 1;
        }
        if (pattern2.type === CardTypeDetector_1.CardType.BOMB && pattern1.type !== CardTypeDetector_1.CardType.BOMB) {
            return -1;
        }
        if (pattern1.type === CardTypeDetector_1.CardType.BOMB && pattern2.type === CardTypeDetector_1.CardType.BOMB) {
            return pattern1.value > pattern2.value ? 1 : (pattern1.value < pattern2.value ? -1 : 0);
        }
        if (!this.canCompare(pattern1, pattern2)) {
            return 0;
        }
        if (pattern1.value > pattern2.value) {
            return 1;
        }
        else if (pattern1.value < pattern2.value) {
            return -1;
        }
        else {
            return 0;
        }
    }
    static canCompare(pattern1, pattern2) {
        if (pattern1.type !== pattern2.type) {
            return false;
        }
        if (pattern1.length !== undefined && pattern2.length !== undefined) {
            return pattern1.length === pattern2.length;
        }
        return pattern1.cards.length === pattern2.cards.length;
    }
    static canBeat(pattern1, pattern2) {
        return this.compare(pattern1, pattern2) === 1;
    }
}
exports.CardComparator = CardComparator;
//# sourceMappingURL=CardComparator.js.map