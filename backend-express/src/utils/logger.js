import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';

const { combine, errors, json, printf, timestamp, colorize } = winston.format;
const logDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../logs');

fs.mkdirSync(logDirectory, { recursive: true });

winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    verbose: 'gray',
    debug: 'blue',
    silly: 'magenta'
});

const consoleFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    colorize({ all: true }),
    printf(({ timestamp: logTime, level, message, ...metadata }) => {
        const details = Object.entries(metadata)
            .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
            .join(' ');
        return `${logTime} ${level} ${message}${details ? ` ${details}` : ''}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'http',
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
            filename: path.join(logDirectory, 'application.log'),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
            tailable: true,
            format: combine(timestamp(), errors({ stack: true }), json())
        })
    ]
});

export default logger;