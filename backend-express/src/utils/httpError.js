/**
 * Creates an Error that the central errorHandler treats as intentional:
 * its message is shown to the client together with the given HTTP status.
 *
 * Optional `extra` fields:
 *   errorCode - machine-readable code returned to the client (e.g. 'TOKEN_EXPIRED')
 *   cause     - original error, logged server-side only
 */
export function httpError(statusCode, message, extra = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return Object.assign(error, extra);
}
