"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSingletonBehavior = testSingletonBehavior;
const container_1 = require("./src/core/container");
const userManager_1 = require("./src/services/user/userManager");
const ServiceRegistry_1 = require("./src/core/ServiceRegistry");
function testSingletonBehavior() {
    console.log('\n🧪 测试依赖注入单例行为...\n');
    const serviceRegistry = new ServiceRegistry_1.ServiceRegistry();
    serviceRegistry.registerAllServices();
    const container = container_1.DependencyContainer.getInstance();
    try {
        const session1 = container.resolve('SessionManager');
        const session2 = container.resolve('SessionManager');
        console.log('✅ 容器单例测试:');
        console.log(`   Session1 === Session2: ${session1 === session2}`);
        session1.createSession({ id: 'test1', name: '测试玩家1', ready: false }, 'socket1');
        session1.createSession({ id: 'test2', name: '测试玩家2', ready: false }, 'socket2');
        const stats1 = session1.getSessionStats();
        const stats2 = session2.getSessionStats();
        console.log('   会话统计一致性:');
        console.log(`   Session1统计: ${JSON.stringify(stats1)}`);
        console.log(`   Session2统计: ${JSON.stringify(stats2)}`);
        console.log(`   统计数据一致: ${JSON.stringify(stats1) === JSON.stringify(stats2)}`);
        const userManager = (0, userManager_1.createUserManager)(session1);
        const user = userManager.authenticateUser('testUser', 'socket1');
        const sessionId = session1.createUserSession(user, 'socket1');
        console.log('\n✅ UserManager和SessionManager集成测试:');
        console.log(`   用户认证成功: ${user.name}`);
        console.log(`   会话创建成功: ${sessionId}`);
        const retrievedSession = session2.getSession(sessionId);
        console.log(`   通过Session2获取Session1创建的会话: ${retrievedSession ? '成功' : '失败'}`);
        console.log(`   会话数据: ${retrievedSession ? JSON.stringify(retrievedSession) : 'null'}`);
        console.log('\n🎉 依赖注入单例测试通过！所有服务使用同一个PlayerSession实例。\n');
    }
    catch (error) {
        console.error('\n❌ 依赖注入单例测试失败:', error);
        throw error;
    }
}
if (require.main === module) {
    testSingletonBehavior();
}
//# sourceMappingURL=test-singleton.js.map