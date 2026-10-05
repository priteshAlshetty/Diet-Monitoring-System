import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.auth.js';
import { httpError } from '../utils/httpError.js';

// Strict "Authorization: Bearer <token>" parsing (scheme is case-insensitive per RFC 7235).
const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * Verifies the JWT and sets `req.user`.
 * Never writes a response itself: failures go to the central errorHandler via
 * next(error), so every 401 has the same shape and is logged in one place.
 */
function verifyToken(req, res, next) {
    const match = BEARER_PATTERN.exec(req.get('Authorization') || '');

    if (!match) {
        return next(
            httpError(401, 'Access denied. No token provided.', { errorCode: 'TOKEN_MISSING' })
        );
    }

    try {
        // Pin the algorithm so a forged token can't pick a weaker one (e.g. "none").
        req.user = jwt.verify(match[1], JWT_SECRET, { algorithms: ['HS256'] });
        return next();
    } catch (error) {
        // TokenExpiredError extends JsonWebTokenError, so it must be checked first.
        if (error.name === 'TokenExpiredError') {
            return next(
                httpError(401, 'Token expired. Please login again.', {
                    errorCode: 'TOKEN_EXPIRED',
                    cause: error
                })
            );
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return next(
                httpError(401, 'Invalid token.', { errorCode: 'TOKEN_INVALID', cause: error })
            );
        }
        // Anything else is unexpected: let it become a generic 500.
        return next(error);
    }
}

export default verifyToken;
