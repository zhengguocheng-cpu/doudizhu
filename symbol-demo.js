/**
 * Symbol 在依赖注入中的使用演示
 */

// ================================
// Symbol 基础概念
// ================================

console.log('🔍 Symbol 在依赖注入中的使用\n');

// 1. Symbol 基础使用
console.log('1. Symbol 基础概念:');

// 创建 Symbol
const symbol1 = Symbol('test');
const symbol2 = Symbol('test');
const symbol3 = Symbol.for('test'); // 全局 Symbol

console.log('symbol1:', symbol1);
console.log('symbol2:', symbol2);
console.log('symbol1 === symbol2:', symbol1 === symbol2); // false - 每个Symbol都是唯一的
console.log('symbol3:', symbol3);
console.log('Symbol.for("test") === symbol3:', Symbol.for('test') === symbol3); // true - 全局Symbol是共享的

// 2. Symbol 作为对象属性键
console.log('\n2. Symbol 作为对象属性键:');

const obj = {};
obj[symbol1] = 'Symbol属性值';
obj.regularProperty = '普通属性值';

console.log('obj:', obj);
console.log('obj[symbol1]:', obj[symbol1]);
console.log('Object.keys(obj):', Object.keys(obj)); // 不会显示Symbol属性
console.log('Object.getOwnPropertySymbols(obj):', Object.getOwnPropertySymbols(obj)); // 获取Symbol属性

// ================================
// Symbol 在依赖注入中的优势
// ================================

console.log('\n3. Symbol 在依赖注入中的优势:');

// 字符串Token的问题
const STRING_TOKEN = 'Logger';
const userStringToken1 = 'Logger';
const userStringToken2 = 'Logger';

// Symbol Token的优势
const SYMBOL_TOKEN = Symbol('Logger');
const userSymbolToken1 = Symbol('Logger');
const userSymbolToken2 = Symbol('Logger');

console.log('字符串Token问题:');
console.log(`STRING_TOKEN === userStringToken1: ${STRING_TOKEN === userStringToken1}`); // true - 容易冲突
console.log(`STRING_TOKEN === userStringToken2: ${STRING_TOKEN === userStringToken2}`); // true - 容易冲突

console.log('\nSymbol Token优势:');
console.log(`SYMBOL_TOKEN === userSymbolToken1: ${SYMBOL_TOKEN === userSymbolToken1}`); // false - 绝对唯一
console.log(`SYMBOL_TOKEN === userSymbolToken2: ${SYMBOL_TOKEN === userSymbolToken2}`); // false - 绝对唯一

// 全局Symbol (Symbol.for)
const globalToken1 = Symbol.for('Logger');
const globalToken2 = Symbol.for('Logger');

console.log('\n全局Symbol:');
console.log(`globalToken1 === globalToken2: ${globalToken1 === globalToken2}`); // true - 全局共享
console.log(`Symbol.keyFor(globalToken1): ${Symbol.keyFor(globalToken1)}`); // Logger - 可获取键名

// ================================
// 实际依赖注入场景
// ================================

console.log('\n4. 依赖注入中的Token使用场景:');

// 1. 字符串Token - 简单但容易冲突
const stringContainer = {
  services: new Map(),

  register(name, factory) {
    this.services.set(name, factory);
  },

  resolve(name) {
    return this.services.get(name);
  }
};

// 2. Symbol Token - 唯一性保证
const symbolContainer = {
  services: new Map(),

  register(token, factory) {
    this.services.set(token, factory);
  },

  resolve(token) {
    return this.services.get(token);
  }
};

// 3. 构造函数Token - 类型安全
const constructorContainer = {
  services: new Map(),

  register(TokenClass, factory) {
    this.services.set(TokenClass, factory);
  },

  resolve(TokenClass) {
    return this.services.get(TokenClass);
  }
};

// 演示各种Token的使用
console.log('\n演示各种Token类型:');

// 字符串Token
stringContainer.register('Logger', () => ({ log: (msg) => console.log(`[LOG] ${msg}`) }));
stringContainer.register('UserService', () => ({ getUser: (id) => ({ id, name: 'Alice' }) }));

// Symbol Token
symbolContainer.register(Symbol('Logger'), () => ({ log: (msg) => console.log(`[SYMBOL-LOG] ${msg}`) }));
symbolContainer.register(Symbol('UserService'), () => ({ getUser: (id) => ({ id, name: 'Bob' }) }));

// 构造函数Token
class Logger {}
class UserService {}
constructorContainer.register(Logger, () => ({ log: (msg) => console.log(`[CLASS-LOG] ${msg}`) }));
constructorContainer.register(UserService, () => ({ getUser: (id) => ({ id, name: 'Charlie' }) }));

console.log('\n解析服务:');

// 字符串解析
const logger1 = stringContainer.resolve('Logger');
logger1.log('字符串Token解析成功');

// Symbol解析
const logger2 = symbolContainer.resolve(Symbol('Logger'));
logger2.log('Symbol Token解析成功');

// 构造函数解析
const logger3 = constructorContainer.resolve(Logger);
logger3.log('构造函数Token解析成功');

console.log('\n5. Token类型对比总结:');
console.log('✅ 字符串Token: 简单直观，但容易冲突');
console.log('✅ Symbol Token: 绝对唯一，防冲突，但不可序列化');
console.log('✅ 构造函数Token: 类型安全，IDE支持，但依赖类定义');
console.log('✅ 混合使用: 实际项目中可根据场景选择最适合的Token类型');

console.log('\n🎉 Symbol在依赖注入中的作用演示完成!');
