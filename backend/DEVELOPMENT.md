# 开发环境配置

## 🚀 快速启动

### 普通开发模式
```bash
npm run dev
```
直接运行TypeScript代码，无热重载。

### 🔥 热重载开发模式（推荐）
```bash
npm run dev:watch
```
或
```bash
npm run dev:nodemon
```
自动监听文件变化并重启服务器。

### 🐛 调试模式
```bash
npm run dev:debug
```
启用Node.js调试器，支持断点调试。

## 📁 监听的文件类型

nodemon会监听以下文件和目录的变化：
- `src/**/*` - 所有源代码文件
- `server.ts` - 服务器入口文件
- `.env` - 环境配置文件
- `*.ts` - TypeScript文件
- `*.js` - JavaScript文件
- `*.json` - 配置文件

## 🚫 忽略的文件

以下文件和目录不会触发重启：
- `node_modules/**/*` - 第三方依赖
- `dist/**/*` - 编译输出
- `test/**/*` - 测试文件
- `*.test.ts` - 测试文件
- `*.spec.ts` - 规范文件

## ⚙️ VS Code配置

### 调试配置
1. 按 `F5` 或点击调试面板的"运行和调试"
2. 选择 "Debug TypeScript" 或 "Debug with Nodemon"
3. 开始调试，支持断点设置

### 任务配置
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Tasks: Run Task"
3. 选择以下任务：
   - `npm: dev` - 普通开发
   - `npm: dev:watch` - 热重载开发
   - `npm: dev:debug` - 调试模式

## 🔄 热重载特性

- **自动重启**: 修改任何监听文件都会自动重启服务器
- **延迟重启**: 500ms延迟，避免频繁重启
- **彩色输出**: 控制台输出带颜色，便于识别
- **详细日志**: 显示重启原因和时间
- **优雅关闭**: 支持SIGTERM和SIGINT信号

## 📝 使用建议

1. **开发时推荐使用热重载模式**: `npm run dev:watch`
2. **调试时使用调试模式**: `npm run dev:debug`
3. **生产部署使用构建模式**: `npm run build && npm start`
4. **修改配置后重启**: 修改nodemon.json或package.json后需要手动重启

## 🛠️ 自定义配置

编辑 `nodemon.json` 文件可以自定义：
- 监听文件类型和目录
- 忽略文件模式
- 重启延迟时间
- 环境变量
- 输出格式
