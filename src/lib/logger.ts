// Centralized logging utility — import in any route/component as needed

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel: LogLevel = (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  if (LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, context, message, ...(data !== undefined && { data }) };
    if (level === 'error') console.error(JSON.stringify(entry));
    else if (level === 'warn') console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (ctx: string, msg: string, data?: unknown) => log('error', ctx, msg, data),
  warn: (ctx: string, msg: string, data?: unknown) => log('warn', ctx, msg, data),
  info: (ctx: string, msg: string, data?: unknown) => log('info', ctx, msg, data),
  debug: (ctx: string, msg: string, data?: unknown) => log('debug', ctx, msg, data),
};
