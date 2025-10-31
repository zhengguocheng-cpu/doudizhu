// 扩展Socket.IO类型定义
import { Socket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    userId?: string;      // 绑定到Socket的用户ID
    userName?: string;    // 绑定到Socket的用户名
    sessionId?: string;   // 会话ID
    authenticated?: boolean; // 认证状态
  }
}
