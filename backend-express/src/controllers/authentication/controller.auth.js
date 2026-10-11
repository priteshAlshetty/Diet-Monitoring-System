import bcrypt from 'bcryptjs';
import db from '../../config/config.db.js';
import { SALT_ROUNDS } from '../../config/config.auth.js';
import { httpError } from '../../utils/httpError.js';

/**
 * Contract for every function in this file:
 *   - success  -> returns { success: true, message, ... }
 *   - failure  -> THROWS httpError(status, message), never returns { success: false }
 *
 * Tokens are NOT created here. The routes call setAuthCookies() from utils/tokens.js
 * with the `user` object these functions return.
 *
 * Status codes used:
 *   400 invalid / missing input
 *   401 bad credentials (login)
 *   403 authenticated but wrong current password
 *   404 user not found
 *   409 username already taken
 *   (unexpected DB errors are not caught here; the central errorHandler turns them into a generic 500)
 */

// Used so login takes about the same time whether or not the username exists.
// Same cost factor as real hashes, otherwise the timing would differ.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', SALT_ROUNDS);

// The DB column user_role is still NOT used for anything; every user gets the same fixed value.
const DEFAULT_ROLE = 'user';


async function getAllUsers() {
    const result = await db.query(
        "SELECT user_id, username, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at FROM \"DMS\".users"
    );

    return result.rows;
}


async function login(params) {
    const { username, password } = params ?? {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw httpError(400, 'Username or password is missing');
    }

    const result = await db.query(
        "SELECT user_id, username, password_hash FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    const user = result.rows[0];

    // Always run bcrypt (dummy hash if the user doesn't exist) and use ONE message for both
    // "unknown user" and "wrong password", so attackers can't discover which usernames exist.
    const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !passwordMatches) {
        throw httpError(401, 'Invalid username or password', { errorCode: 'INVALID_CREDENTIALS' });
    }

    return {
        success: true,
        message: "Login successful",
        user: {
            id: user.user_id,
            username: user.username
        }
    };
}


async function signup(params) {
    const { username, password } = params ?? {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw httpError(400, 'Username or password is missing');
    }

    if (password.length < 6) {
        throw httpError(400, 'Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // No SELECT pre-check: it cost an extra DB round trip and was racy anyway.
    // The UNIQUE constraint on username is the real guard (error code 23505 -> 409).
    let result;
    try {
        result = await db.query(
            "INSERT INTO \"DMS\".users (username, password_hash, user_role) VALUES ($1, $2, $3) RETURNING user_id, username",
            [username, hashedPassword, DEFAULT_ROLE]
        );
    } catch (error) {
        if (error.code === '23505') {
            throw httpError(409, 'Username already exists', {
                errorCode: 'USERNAME_TAKEN',
                cause: error
            });
        }
        throw error;
    }

    const newUser = result.rows[0];

    return {
        success: true,
        message: "Signup successful",
        user: {
            id: newUser.user_id,
            username: newUser.username
        }
    };
}


async function deleteUser(params) {
    const username = params?.username;

    const result = await db.query(
        "DELETE FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    if (result.rowCount === 0) {
        throw httpError(404, `User :${username} does not exist in system`, { errorCode: 'USER_NOT_FOUND' });
    }

    return {
        success: true,
        message: `User :${username} Deleted from system`
    };
}


async function updatePassword(params) {
    // username is NOT from the request body: the route fills it from the verified token.
    const {
        username,
        oldPassword,
        newPassword,
    } = params ?? {};

    if (!username || !oldPassword || !newPassword) {
        throw httpError(400, 'Missing required fields');
    }

    if (
        typeof username !== 'string' ||
        typeof oldPassword !== 'string' ||
        typeof newPassword !== 'string'
    ) {
        throw httpError(400, 'username, oldPassword and newPassword must be strings');
    }

    if (newPassword.length < 6) {
        throw httpError(400, 'New password must be at least 6 characters');
    }

    const result = await db.query(
        "SELECT user_id, username, password_hash FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    const user = result.rows[0];

    if (!user) {
        throw httpError(404, 'User not found', { errorCode: 'USER_NOT_FOUND' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

    // 403 (not 401): the caller is logged in, they just supplied the wrong current password.
    // A 401 here would make most frontends treat it as an expired session and log the user out.
    if (!isMatch) {
        throw httpError(403, 'Current password is incorrect', { errorCode: 'INVALID_CURRENT_PASSWORD' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updateResult = await db.query(
        "UPDATE \"DMS\".users SET password_hash = $1, password_changed_at = NOW() WHERE user_id = $2",
        [hashedPassword, user.user_id]
    );

    // User was found above, so 0 rows means they were deleted in between.
    if (updateResult.rowCount === 0) {
        throw httpError(404, 'User not found', { errorCode: 'USER_NOT_FOUND' });
    }

    return {
        success: true,
        message: "Password updated successfully. Please login again with your new password."
    };
}


export {
    getAllUsers,
    signup,
    login,
    deleteUser,
    updatePassword
};