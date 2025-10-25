"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./src/config");
const app_1 = __importDefault(require("./src/app"));
const app = new app_1.default();
app.getApp().use((err, req, res, next) => {
    console.error('全局错误处理:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: config_1.config.legacy.nodeEnv === 'development' ? err.message : '未知错误'
    });
});
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});
app.start();
//# sourceMappingURL=server.js.map