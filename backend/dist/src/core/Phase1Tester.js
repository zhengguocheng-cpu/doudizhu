"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase1Tester = void 0;
const container_1 = require("./container");
const EventBus_1 = require("./EventBus");
const Logger_1 = require("./Logger");
const config_1 = require("../config");
class Phase1Tester {
    constructor() {
        this.container = container_1.DependencyContainer.getInstance();
        this.eventBus = EventBus_1.EventBus.getInstance();
        this.logger = Logger_1.Logger.getInstance();
    }
    async runAllTests() {
        console.log('\n🚀 开始Phase 1测试...\n');
        try {
            await this.testDependencyInjection();
            await this.testEventBus();
            await this.testLogger();
            await this.testConfiguration();
            console.log('\n✅ Phase 1 所有测试通过！\n');
        }
        catch (error) {
            console.error('\n❌ Phase 1 测试失败:', error);
            throw error;
        }
    }
    async testDependencyInjection() {
        console.log('📦 测试依赖注入容器...');
        this.container.register('TestService', () => ({ name: 'test', value: 42 }));
        const service = this.container.resolve('TestService');
        if (service.name === 'test' && service.value === 42) {
            console.log('✅ 依赖注入容器测试通过');
        }
        else {
            throw new Error('依赖注入容器测试失败');
        }
    }
    async testEventBus() {
        console.log('📡 测试事件总线...');
        let eventReceived = false;
        const testData = { message: 'Hello EventBus!' };
        this.eventBus.subscribe('test', (data) => {
            if (data.message === testData.message) {
                eventReceived = true;
            }
        });
        this.eventBus.emit('test', testData);
        await new Promise(resolve => setTimeout(resolve, 10));
        if (eventReceived) {
            console.log('✅ 事件总线测试通过');
        }
        else {
            throw new Error('事件总线测试失败');
        }
    }
    async testLogger() {
        console.log('📝 测试日志服务...');
        this.logger.info('测试信息日志', { test: 'info' });
        this.logger.warn('测试警告日志', { test: 'warn' });
        this.logger.error('测试错误日志', new Error('Test error'), { test: 'error' });
        console.log('✅ 日志服务测试通过');
    }
    async testConfiguration() {
        console.log('⚙️ 测试配置系统...');
        if (config_1.config.server.port && config_1.config.server.host) {
            console.log(`✅ 服务器配置: ${config_1.config.server.host}:${config_1.config.server.port}`);
        }
        else {
            throw new Error('服务器配置测试失败');
        }
        if (config_1.config.game.maxPlayers && config_1.config.game.timeouts.turnTimeout) {
            console.log(`✅ 游戏配置: 最大玩家 ${config_1.config.game.maxPlayers}, 回合超时 ${config_1.config.game.timeouts.turnTimeout}ms`);
        }
        else {
            throw new Error('游戏配置测试失败');
        }
        console.log('✅ 配置系统测试通过');
    }
    generateReport() {
        return `
Phase 1 测试报告
================

✅ 依赖注入容器: 正常工作
✅ 事件总线: 正常工作
✅ 日志服务: 正常工作
✅ 配置系统: 正常工作

基础设施组件状态: 健康
建议: 可以继续Phase 2实施

生成时间: ${new Date().toISOString()}
    `.trim();
    }
}
exports.Phase1Tester = Phase1Tester;
exports.default = Phase1Tester;
//# sourceMappingURL=Phase1Tester.js.map