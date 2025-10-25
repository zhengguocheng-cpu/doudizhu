"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.redirect('/login/');
});
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        environment: config_1.default.legacy.nodeEnv
    });
});
router.get('/info', (req, res) => {
    res.json({
        name: '斗地主游戏服务器',
        version: '1.0.0',
        description: '支持多人在线斗地主游戏的后端服务器',
        features: [
            '实时多人游戏',
            '房间管理',
            '游戏逻辑处理',
            'WebSocket通信'
        ],
        config: {
            port: config_1.default.server.port,
            maxPlayersPerRoom: config_1.default.game.maxPlayers,
            corsOrigin: config_1.default.server.cors.origin
        }
    });
});
router.get('/login/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../../frontend/public/login/index.html'));
});
router.get('/lobby/', (req, res) => {
    res.sendFile(config_1.default.paths.frontend.lobby + '/index.html');
});
router.get('/room/', (req, res) => {
    res.sendFile(config_1.default.paths.frontend.room + '/index.html');
});
exports.default = router;
//# sourceMappingURL=index.js.map