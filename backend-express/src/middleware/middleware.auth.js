import { ACCESS_COOKIE } from '../config/config.auth.js';
import { verifyAccess } from '../utils/tokens.js';

/**
 * Verifies the access token from the HttpOnly cookie and sets `req.user`.
 * Never writes a response itself: failures go to the central errorHandler
 * via next(error), so every 401 has the same shape.
 */
function verifyToken(req, res, next) {
    try {
        req.user = verifyAccess(req.cookies?.[ACCESS_COOKIE]);
        next();
    } catch (error) {
        next(error);
    }
}

export default verifyToken;