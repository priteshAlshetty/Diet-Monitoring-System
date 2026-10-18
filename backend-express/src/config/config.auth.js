import 'dotenv/config';

/**
 * Single source of truth for auth settings.
 * Signing side (controller.auth.js, utils/tokens.js) and verifying side
 * (middleware.auth.js) import from here, so they can never disagree.
 *
 * There is intentionally NO fallback secret: refusing to start is better
 * than running with a guessable default.
 */
const required = (name) => {
    const value = process.env[name];
    if (!value || value.length < 32) {
        throw new Error(`${name} is missing or too short. Set a random string of at least 32 characters in .env.`);
    }
    return value;
};

// Two different secrets, so an access token can never be accepted as a refresh token.
const JWT_ACCESS_SECRET = required('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET = required('JWT_REFRESH_SECRET');

// Seconds. jsonwebtoken takes seconds, cookies need ms (multiplied below).
const ACCESS_TTL_SECONDS = 60 * 60;            // 60 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;  // 7 days

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth/refresh';

const isProd = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
    httpOnly: true,
    secure: isProd,        // HTTPS only in production, plain http works on localhost
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TTL_SECONDS * 1000
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH, // browser sends it only to /api/auth/refresh
    maxAge: REFRESH_TTL_SECONDS * 1000
};

// Number() fixes the string problem: bcrypt treats a string as a salt, not as rounds.
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;



export {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TTL_SECONDS,
    REFRESH_TTL_SECONDS,
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    REFRESH_COOKIE_PATH,
    accessCookieOptions,
    refreshCookieOptions,
    SALT_ROUNDS
};

