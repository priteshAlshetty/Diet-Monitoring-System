import 'dotenv/config';

/**
 * Single source of truth for JWT settings.
 * Both the signing side (controller.auth.js) and the verifying side
 * (middleware.auth.js) import from here, so they can never disagree.
 *
 * There is intentionally NO fallback secret: running with a guessable
 * default is worse than refusing to start.
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error(
        'JWT_SECRET is missing or too short. Set a random string of at least 32 characters in your environment (.env).'
    );
}

const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 6;

export { JWT_SECRET, JWT_EXPIRY, SALT_ROUNDS };
