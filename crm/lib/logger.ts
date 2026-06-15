import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logFormat = winston.format.printf(({ timestamp, level, message, module: mod, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] [${mod || 'app'}] ${message}${metaStr}`
})

const fileTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    fileTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
})

export function getLogger(module: string) {
  return {
    info: (message: string, meta?: object) => logger.info(message, { module, ...meta }),
    warn: (message: string, meta?: object) => logger.warn(message, { module, ...meta }),
    error: (message: string, error?: unknown, meta?: object) => {
      const errMeta = error instanceof Error ? { stack: error.stack, error: error.message } : {}
      logger.error(message, { module, ...errMeta, ...meta })
    },
    debug: (message: string, meta?: object) => logger.debug(message, { module, ...meta }),
  }
}
