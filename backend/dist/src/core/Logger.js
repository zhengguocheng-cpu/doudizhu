"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const types_1 = require("../types");
const config_1 = require("../config");
class Logger {
    constructor() {
        this.minLevel = this.parseLogLevel(config_1.loggingConfig.level);
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    log(logData) {
        if (this.shouldLog(logData.level)) {
            this.writeLog(logData);
        }
    }
    error(message, error, context) {
        this.log({
            level: types_1.LogLevel.ERROR,
            message,
            error,
            context,
            timestamp: new Date()
        });
    }
    warn(message, context) {
        this.log({
            level: types_1.LogLevel.WARN,
            message,
            context,
            timestamp: new Date()
        });
    }
    info(message, context) {
        this.log({
            level: types_1.LogLevel.INFO,
            message,
            context,
            timestamp: new Date()
        });
    }
    debug(message, context) {
        this.log({
            level: types_1.LogLevel.DEBUG,
            message,
            context,
            timestamp: new Date()
        });
    }
    trace(message, context) {
        this.log({
            level: types_1.LogLevel.TRACE,
            message,
            context,
            timestamp: new Date()
        });
    }
    createChildLogger(context) {
        const childLogger = new Logger();
        return childLogger;
    }
    parseLogLevel(level) {
        const levelMap = {
            'error': types_1.LogLevel.ERROR,
            'warn': types_1.LogLevel.WARN,
            'info': types_1.LogLevel.INFO,
            'debug': types_1.LogLevel.DEBUG,
            'trace': types_1.LogLevel.TRACE
        };
        return levelMap[level.toLowerCase()] || types_1.LogLevel.INFO;
    }
    shouldLog(level) {
        return level <= this.minLevel;
    }
    writeLog(logData) {
        const formattedLog = this.formatLog(logData);
        if (config_1.loggingConfig.format === 'json') {
            console.log(JSON.stringify(formattedLog));
        }
        else {
            this.writeSimpleLog(formattedLog);
        }
        if (config_1.loggingConfig.file.enabled) {
            this.writeToFile(formattedLog);
        }
    }
    formatLog(logData) {
        const levelNames = {
            [types_1.LogLevel.ERROR]: 'ERROR',
            [types_1.LogLevel.WARN]: 'WARN',
            [types_1.LogLevel.INFO]: 'INFO',
            [types_1.LogLevel.DEBUG]: 'DEBUG',
            [types_1.LogLevel.TRACE]: 'TRACE'
        };
        const baseLog = {
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
    writeSimpleLog(logData) {
        const level = logData.level.padEnd(5);
        const timestamp = logData.timestamp;
        const context = logData.context ? ` [${logData.context.service || 'unknown'}]` : '';
        const message = logData.message;
        console.log(`${timestamp} ${level}${context} ${message}`);
        if (logData.error) {
            console.error(logData.error.stack);
        }
    }
    writeToFile(logData) {
        console.log(`📄 FILE LOG: ${JSON.stringify(logData)}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map