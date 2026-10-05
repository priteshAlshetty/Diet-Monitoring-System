import logger from '../utils/logger.js';
import { classifyDbInfraError } from '../utils/dbErrors.js';

const isProd = process.env.NODE_ENV === 'production';

// Errors raised by Express / body-parser. They carry a `type` instead of our own
// statusCode semantics, so we map them to friendly, safe messages.
const KNOWN_ERRORS = {
    'entity.parse.failed': { status: 400, message: 'Malformed JSON in request body.' },
    'entity.too.large': { status: 413, message: 'Request body is too large.' },
    'encoding.unsupported': { status: 415, message: 'Unsupported content encoding.' },
};

/**
 * Catch-all for unmatched routes. Mount AFTER all routes.
 */
function notFoundHandler(req, res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.path}`);
    error.statusCode = 404;
    next(error);
}

/**
 * Central error handler. Mount LAST (after notFoundHandler).
 *
 * Rules:
 *  - Errors that carry a statusCode/status were thrown on purpose, so their
 *    message is safe to show the client.
 *  - Anything else (TypeError, raw pg error, ...) is an unexpected bug: the
 *    client gets a generic 500, the full details go to the log only.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Response already started: let Express close the connection.
    if (res.headersSent) {
        return next(err);
    }

    const known = KNOWN_ERRORS[err?.type];

    // Raw DB infrastructure failures that no controller mapped (pool timeout, lost
    // connection, statement timeout): report 503/504 so clients know a retry may work.
    const hasOwnStatus = Number.isInteger(err?.statusCode) || Number.isInteger(err?.status);
    const infra = !known && !hasOwnStatus ? classifyDbInfraError(err) : null;

    let statusCode = known?.status ?? infra?.statusCode ?? err?.statusCode ?? err?.status;
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    const isIntentional = Boolean(known) || Boolean(infra) || hasOwnStatus;

    const message = infra
        ? infra.message
        : isIntentional
            ? known?.message ?? err.message
            : 'Internal server error';

    // ---- Log full details server-side ----
    logger.log(statusCode >= 500 ? 'error' : 'warn', 'request failed', {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        statusCode,
        userId: req.user?.id ?? req.user?.user_id,
        errorName: err?.name,
        errorMessage: err?.message,
        errorCode: err?.errorCode ?? err?.code,
        upstreamStatus: err?.upstreamStatus,
        cause: err?.cause?.message,
        ...(typeof err?.raw === 'string' && { raw: err.raw.slice(0, 1000) }),
        ...(statusCode >= 500 && { stack: err?.stack }),
    });

    // ---- Send a consistent response shape ----
    // RFC 6750: 401 responses must advertise the auth scheme.
    if (statusCode === 401) {
        res.set('WWW-Authenticate', 'Bearer');
    }

    return res.status(statusCode).json({
        success: false,
        message,
        // Machine-readable code (e.g. TOKEN_EXPIRED) so clients can react without parsing text.
        ...(isIntentional && err?.errorCode && { code: err.errorCode }),
        // Debug aid only; never expose model output in production.
        ...(!isProd && err?.raw !== undefined && { raw: err.raw }),
    });
}

export { notFoundHandler, errorHandler };
