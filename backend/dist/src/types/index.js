"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.RoomStatus = exports.UserStatus = exports.GameStatus = void 0;
__exportStar(require("./player"), exports);
__exportStar(require("./room"), exports);
__exportStar(require("../constants"), exports);
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["READY"] = "ready";
    GameStatus["PLAYING"] = "playing";
    GameStatus["PAUSED"] = "paused";
    GameStatus["FINISHED"] = "finished";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["OFFLINE"] = "offline";
    UserStatus["ONLINE"] = "online";
    UserStatus["IN_GAME"] = "in_game";
    UserStatus["AWAY"] = "away";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["OPEN"] = "open";
    RoomStatus["FULL"] = "full";
    RoomStatus["IN_GAME"] = "in_game";
    RoomStatus["CLOSED"] = "closed";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    LogLevel["TRACE"] = "trace";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
//# sourceMappingURL=index.js.map