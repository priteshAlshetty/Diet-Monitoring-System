import logger from '../utils/logger.js';

const sensitiveFieldPattern = /password|token|secret|authorization|cookie|api[_-]?key/i;
const maxBodyLogLength = 4000;

function redactSensitiveFields(value) {
    if (Array.isArray(value)) {
        return value.map(redactSensitiveFields);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, fieldValue]) => [
                key,
                sensitiveFieldPattern.test(key) ? '[REDACTED]' : redactSensitiveFields(fieldValue)
            ])
        );
    }

    return value;
}

function getLoggableBody(body) {
    if (body === undefined) {
        return undefined;
    }

    try {
        const serializedBody = JSON.stringify(redactSensitiveFields(body));
        if (serializedBody.length > maxBodyLogLength) {
            return `${serializedBody.slice(0, maxBodyLogLength)}...[truncated]`;
        }
        return JSON.parse(serializedBody);
    } catch {
        return '[unavailable]';
    }
}

function requestLogger(req, res, next) {
    const startedAt = process.hrtime.bigint();
    let logged = false;

    const logRequest = (aborted = false) => {
        if (logged) {
            return;
        }
        logged = true;

        const statusCode = aborted ? 499 : res.statusCode;
        const level = aborted || statusCode >= 400
            ? (statusCode >= 500 ? 'error' : 'warn')
            : 'http';
        const durationMs = Number((Number(process.hrtime.bigint() - startedAt) / 1e6).toFixed(2));

        logger.log(level, aborted ? 'request aborted' : 'request completed', {
            method: req.method,
            path: new URL(req.originalUrl, 'http://localhost').pathname,
            statusCode,
            durationMs,
            ip: req.ip,
            userId: req.user?.user_id ?? req.user?.id ?? req.body?.user_id,
            ...(req.body !== undefined && { body: getLoggableBody(req.body) })
        });
    };

    res.once('finish', () => logRequest());
    res.once('close', () => {
        if (!res.writableFinished) {
            logRequest(true);
        }
    });

    next();
}

export default requestLogger;