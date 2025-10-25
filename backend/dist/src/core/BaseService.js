"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const container_1 = require("./container");
const types_1 = require("../types");
class BaseService {
    constructor() {
        this.container = container_1.DependencyContainer.getInstance();
    }
    async initialize() {
        try {
            this.logger = this.container.resolve('Logger');
        }
        catch (error) {
            console.warn(`Logger服务不可用，使用console作为fallback: ${this.constructor.name}`);
            this.logger = console;
        }
        this.log(types_1.LogLevel.INFO, 'Service initializing', { service: this.constructor.name });
        await this.onInitialize();
        this.log(types_1.LogLevel.INFO, 'Service initialized', { service: this.constructor.name });
    }
    async destroy() {
        this.log(types_1.LogLevel.INFO, 'Service destroying', { service: this.constructor.name });
        await this.onDestroy();
        this.log(types_1.LogLevel.INFO, 'Service destroyed', { service: this.constructor.name });
    }
    getService(token) {
        return this.container.resolve(token);
    }
    log(level, message, metadata) {
        if (this.logger) {
            if (typeof this.logger.log === 'function') {
                this.logger.log({
                    level,
                    message,
                    context: { service: this.constructor.name },
                    metadata,
                    timestamp: new Date()
                });
            }
            else {
                const timestamp = new Date().toISOString();
                const levelNames = {
                    [types_1.LogLevel.ERROR]: 'ERROR',
                    [types_1.LogLevel.WARN]: 'WARN',
                    [types_1.LogLevel.INFO]: 'INFO',
                    [types_1.LogLevel.DEBUG]: 'DEBUG',
                    [types_1.LogLevel.TRACE]: 'TRACE'
                };
                const levelName = levelNames[level] || 'INFO';
                const serviceName = this.constructor.name;
                this.logger.log(`[${timestamp}] ${levelName} [${serviceName}] ${message}`, metadata || '');
            }
        }
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=BaseService.js.map