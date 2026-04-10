type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, error?: Error | unknown, meta?: LogMeta): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level && level in LOG_LEVELS) {
    return level as LogLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
  const timestamp = formatTimestamp();
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return meta;
  
  const sanitized: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger: Logger = {
  debug(message: string, meta?: LogMeta): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, sanitizeMeta(meta)));
    }
  },

  info(message: string, meta?: LogMeta): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, sanitizeMeta(meta)));
    }
  },

  warn(message: string, meta?: LogMeta): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, sanitizeMeta(meta)));
    }
  },

  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    if (shouldLog('error')) {
      const errorMeta: LogMeta = { ...meta };
      if (error instanceof Error) {
        errorMeta.errorName = error.name;
        errorMeta.errorMessage = error.message;
        errorMeta.errorStack = error.stack;
      } else if (error !== undefined) {
        errorMeta.error = String(error);
      }
      console.error(formatMessage('error', message, sanitizeMeta(errorMeta)));
    }
  },
};

export function createLogger(context: string): Logger {
  return {
    debug: (message: string, meta?: LogMeta) => logger.debug(`[${context}] ${message}`, meta),
    info: (message: string, meta?: LogMeta) => logger.info(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: LogMeta) => logger.warn(`[${context}] ${message}`, meta),
    error: (message: string, error?: Error | unknown, meta?: LogMeta) => 
      logger.error(`[${context}] ${message}`, error, meta),
  };
}

export default logger;
