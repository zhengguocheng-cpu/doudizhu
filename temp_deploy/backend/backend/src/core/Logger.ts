/**
 * 日志服务
 * 提供结构化日志记录和多种输出格式
 */

import { StructuredLog, LogLevel } from '../types';
import { loggingConfig } from '../config';

export class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;

  private constructor() {
    this.minLevel = this.parseLogLevel(loggingConfig.level);
  }

  /**
   * 获取日志服务单例实例
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 记录结构化日志
   */
  public log(logData: StructuredLog): void {
    if (this.shouldLog(logData.level)) {
      this.writeLog(logData);
    }
  }

  /**
   * 记录错误日志
   */
  public error(message: string, error?: Error, context?: any): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      error,
      context,
      timestamp: new Date()
    });
  }

  /**
   * 记录警告日志
   */
  public warn(message: string, context?: any): void {
    this.log({
      level: LogLevel.WARN,
      message,
      context,
      timestamp: new Date()
    });
  }

  /**
   * 记录信息日志
   */
  public info(message: string, context?: any): void {
    this.log({
      level: LogLevel.INFO,
      message,
      context,
      timestamp: new Date()
    });
  }

  /**
   * 记录调试日志
   */
  public debug(message: string, context?: any): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      context,
      timestamp: new Date()
    });
  }

  /**
   * 记录跟踪日志
   */
  public trace(message: string, context?: any): void {
    this.log({
      level: LogLevel.TRACE,
      message,
      context,
      timestamp: new Date()
    });
  }

  /**
   * 创建子日志器
   */
  public createChildLogger(context: string): Logger {
    const childLogger = new Logger();
    // 这里可以扩展以支持上下文继承
    return childLogger;
  }

  /**
   * 解析日志级别字符串
   */
  private parseLogLevel(level: string): LogLevel {
    const levelMap: Record<string, LogLevel> = {
      'error': LogLevel.ERROR,
      'warn': LogLevel.WARN,
      'info': LogLevel.INFO,
      'debug': LogLevel.DEBUG,
      'trace': LogLevel.TRACE
    };

    return levelMap[level.toLowerCase()] || LogLevel.INFO;
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel;
  }

  /**
   * 写入日志
   */
  private writeLog(logData: StructuredLog): void {
    const formattedLog = this.formatLog(logData);

    if (loggingConfig.format === 'json') {
      console.log(JSON.stringify(formattedLog));
    } else {
      this.writeSimpleLog(formattedLog);
    }

    // 如果启用了文件日志
    if (loggingConfig.file.enabled) {
      this.writeToFile(formattedLog);
    }
  }

  /**
   * 格式化日志数据
   */
  private formatLog(logData: StructuredLog): any {
    const levelNames = {
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.TRACE]: 'TRACE'
    };

    const baseLog: any = {
      timestamp: logData.timestamp.toISOString(),
      level: levelNames[logData.level] || 'INFO',
      message: logData.message,
      context: logData.context,
      metadata: logData.metadata,
      duration: logData.duration
    };

    if (logData.error) {
      baseLog.error = {
        name: logData.error.name,
        message: logData.error.message,
        stack: logData.error.stack
      };
    }

    return baseLog;
  }

  /**
   * 写入简单格式日志
   */
  private writeSimpleLog(logData: any): void {
    const level = logData.level.padEnd(5);
    const timestamp = logData.timestamp;
    const context = logData.context ? ` [${logData.context.service || 'unknown'}]` : '';
    const message = logData.message;

    console.log(`${timestamp} ${level}${context} ${message}`);

    if (logData.error) {
      console.error(logData.error.stack);
    }
  }

  /**
   * 写入文件日志
   */
  private writeToFile(logData: any): void {
    // 这里可以实现文件写入逻辑
    // 为了简化，这里暂时只输出到控制台
    console.log(`📄 FILE LOG: ${JSON.stringify(logData)}`);
  }
}
