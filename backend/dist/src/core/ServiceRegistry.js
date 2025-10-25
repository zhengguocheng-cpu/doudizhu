"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
const container_1 = require("../core/container");
const Logger_1 = require("../core/Logger");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const userManager_1 = require("../services/user/userManager");
const playerSession_1 = require("../services/player/playerSession");
const playerManager_1 = require("../services/player/playerManager");
const playerService_1 = require("../services/player/playerService");
const AuthService_1 = require("../services/auth/AuthService");
class ServiceRegistry {
    constructor() {
        this.container = container_1.DependencyContainer.getInstance();
    }
    registerAllServices() {
        this.registerCoreServices();
        this.registerMiddlewareServices();
        this.registerBusinessServices();
    }
    registerCoreServices() {
        this.container.registerSingleton('Logger', () => Logger_1.Logger.getInstance());
    }
    registerMiddlewareServices() {
        this.container.registerSingleton('AuthMiddleware', () => new AuthMiddleware_1.AuthMiddleware());
        this.container.registerSingleton('ErrorMiddleware', () => new ErrorMiddleware_1.ErrorMiddleware());
    }
    registerBusinessServices() {
        this.container.registerSingleton('SessionManager', () => new playerSession_1.PlayerSession());
        this.container.registerSingleton('UserManager', () => {
            const sessionManager = this.container.resolve('SessionManager');
            return (0, userManager_1.createUserManager)(sessionManager);
        });
        this.container.registerSingleton('AuthService', () => (0, AuthService_1.getAuthService)());
        this.container.registerSingleton('PlayerManager', () => new playerManager_1.PlayerManager());
        this.container.registerSingleton('PlayerService', () => new playerService_1.PlayerService());
    }
    getRegisteredServices() {
        return this.container.getRegisteredTokens().map(token => String(token));
    }
}
exports.ServiceRegistry = ServiceRegistry;
//# sourceMappingURL=ServiceRegistry.js.map