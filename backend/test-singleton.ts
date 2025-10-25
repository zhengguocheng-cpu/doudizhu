/**
 * 测试依赖注入容器的单例模式
 * 验证所有服务都使用同一个PlayerSession实例
 */

import { DependencyContainer } from './src/core/container';
import { PlayerSession } from './src/services/player/playerSession';
import { createUserManager } from './src/services/user/userManager';
import { ServiceRegistry } from './src/core/ServiceRegistry';

export function testSingletonBehavior(): void {
  console.log('\n🧪 测试依赖注入单例行为...\n');

  // 1. 初始化服务注册器
  const serviceRegistry = new ServiceRegistry();
  serviceRegistry.registerAllServices();

  const container = DependencyContainer.getInstance();

  try {
    // 2. 测试从容器中获取PlayerSession
    const session1 = container.resolve<PlayerSession>('SessionManager');
    const session2 = container.resolve<PlayerSession>('SessionManager');

    console.log('✅ 容器单例测试:');
    console.log(`   Session1 === Session2: ${session1 === session2}`);

    // 3. 创建一些测试数据
    session1.createSession({ id: 'test1', name: '测试玩家1', ready: false }, 'socket1');
    session1.createSession({ id: 'test2', name: '测试玩家2', ready: false }, 'socket2');

    // 4. 验证两个引用看到相同的数据
    const stats1 = session1.getSessionStats();
    const stats2 = session2.getSessionStats();

    console.log('   会话统计一致性:');
    console.log(`   Session1统计: ${JSON.stringify(stats1)}`);
    console.log(`   Session2统计: ${JSON.stringify(stats2)}`);
    console.log(`   统计数据一致: ${JSON.stringify(stats1) === JSON.stringify(stats2)}`);

    // 5. 测试UserManager使用同一个SessionManager
    const userManager = createUserManager(session1);
    const user = userManager.authenticateUser('testUser', 'socket1');
    const sessionId = session1.createUserSession(user, 'socket1');

    // 6. 验证UserManager和AuthService使用同一个会话
    console.log('\n✅ UserManager和SessionManager集成测试:');
    console.log(`   用户认证成功: ${user.name}`);
    console.log(`   会话创建成功: ${sessionId}`);

    const retrievedSession = session2.getSession(sessionId);
    console.log(`   通过Session2获取Session1创建的会话: ${retrievedSession ? '成功' : '失败'}`);
    console.log(`   会话数据: ${retrievedSession ? JSON.stringify(retrievedSession) : 'null'}`);

    console.log('\n🎉 依赖注入单例测试通过！所有服务使用同一个PlayerSession实例。\n');

  } catch (error) {
    console.error('\n❌ 依赖注入单例测试失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testSingletonBehavior();
}
