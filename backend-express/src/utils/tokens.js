import jwt from 'jsonwebtoken';
import { httpError } from './httpError.js';
import {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TTL_SECONDS,
    REFRESH_TTL_SECONDS,
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    accessCookieOptions,
    refreshCookieOptions
} from '../config/config.auth.js';

const ALG = 'HS256';

// Only these fields go into a token. Anything else in `user` is ignored.
const identity = (user) => ({ id: user.id, username: user.username });

function signAccess(user) {
    return jwt.sign({ ...identity(user), typ: 'access' }, JWT_ACCESS_SECRET, {
        algorithm: ALG,
        expiresIn: ACCESS_TTL_SECONDS
    });
}

function signRefresh(user) {
    return jwt.sign({ ...identity(user), typ: 'refresh' }, JWT_REFRESH_SECRET, {
        algorithm: ALG,
        expiresIn: REFRESH_TTL_SECONDS
    });
}

function verify(token, secret, typ, codes) {
    if (!token) {
        throw httpError(401, codes.missingMessage, { errorCode: codes.missing });
    }

    let payload;
    try {
        payload = jwt.verify(token, secret, { algorithms: [ALG] });
    } catch (error) {
        // TokenExpiredError extends JsonWebTokenError, so check it first.
        if (error.name === 'TokenExpiredError') {
            throw httpError(401, codes.expiredMessage, { errorCode: codes.expired, cause: error });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw httpError(401, 'Invalid token.', { errorCode: codes.invalid, cause: error });
        }
        throw error;
    }

    if (payload.typ !== typ) {
        throw httpError(401, 'Invalid token.', { errorCode: codes.invalid });
    }
    return payload;
}

function verifyAccess(token) {
    return verify(token, JWT_ACCESS_SECRET, 'access', {
        missing: 'TOKEN_MISSING',
        missingMessage: 'Access denied. No token provided.',
        expired: 'TOKEN_EXPIRED',
        expiredMessage: 'Token expired. Please refresh.',
        invalid: 'TOKEN_INVALID'
    });
}

function verifyRefresh(token) {
    return verify(token, JWT_REFRESH_SECRET, 'refresh', {
        missing: 'REFRESH_MISSING',
        missingMessage: 'No refresh token provided.',
        expired: 'REFRESH_EXPIRED',
        expiredMessage: 'Session expired. Please login again.',
        invalid: 'REFRESH_INVALID'
    });
}

// Sets both cookies (login and signup).
function setAuthCookies(res, user) {
    res.cookie(ACCESS_COOKIE, signAccess(user), accessCookieOptions);
    res.cookie(REFRESH_COOKIE, signRefresh(user), refreshCookieOptions);
}

// Sets only the access cookie (/refresh), so the refresh expiry stays fixed.
function setAccessCookie(res, user) {
    res.cookie(ACCESS_COOKIE, signAccess(user), accessCookieOptions);
}

// Path and flags must match how the cookies were set, or the browser keeps them.
function clearAuthCookies(res) {
    res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

export {
    signAccess,
    signRefresh,
    verifyAccess,
    verifyRefresh,
    setAuthCookies,
    setAccessCookie,
    clearAuthCookies
};