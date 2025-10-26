"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});
(async () => {
    try {
        const app = new app_1.default();
        await app.start();
    }
    catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=server.js.map