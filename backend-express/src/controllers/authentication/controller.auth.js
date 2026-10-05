import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../../config/config.db.js';
import { JWT_SECRET as SECRET_KEY, JWT_EXPIRY as TOKEN_EXPIRY } from '../../config/config.auth.js';
import { httpError } from '../../utils/httpError.js';

/**
 * Contract for every function in this file:
 *   - success  -> returns { success: true, message, ... }
 *   - failure  -> THROWS httpError(status, message), never returns { success: false }
 *
 * Status codes used:
 *   400 invalid / missing input
 *   401 bad credentials (login)
 *   403 authenticated but not allowed (wrong current password, wrong role)
 *   404 user not found
 *   409 username already taken
 *   (unexpected DB errors are not caught here; the central errorHandler turns them into a generic 500)
 */

// TODO(security): env value is a string ("10") which bcrypt treats as a salt, not rounds.
// Parse with Number() and use one shared value (planned for a later issue).
const SALT_ROUNDS = process.env.SALT_ROUNDS || 6;

// Used so login takes about the same time whether or not the username exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 6);


async function getAllUsers() {
    const result = await db.query(
        "SELECT user_id, username, user_role, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at FROM \"DMS\".users"
    );

    return result.rows;
}


async function login(params) {
    const { username, password } = params ?? {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw httpError(400, 'Username or password is missing');
    }

    const result = await db.query(
        "SELECT user_id, username, password_hash, user_role FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    const user = result.rows[0];

    // Always run bcrypt (dummy hash if the user doesn't exist) and use ONE message for both
    // "unknown user" and "wrong password", so attackers can't discover which usernames exist.
    const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !passwordMatches) {
        throw httpError(401, 'Invalid username or password', { errorCode: 'INVALID_CREDENTIALS' });
    }

    const token = jwt.sign(
        {
            id: user.user_id,
            username: user.username,
            role: user.user_role
        },
        SECRET_KEY,
        {
            expiresIn: TOKEN_EXPIRY
        }
    );

    return {
        success: true,
        message: "Login successful",
        token,
        user: {
            id: user.user_id,
            username: user.username,
            role: user.user_role
        }
    };
}


async function signup(params) {
    const { username, password } = params ?? {};
    const role = params?.user_role || params?.role || "admin";

    const SALT_ROUNDS = 6; // by env later

    // TODOs
    // Later add salt rounds by env file.

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw httpError(400, 'Username or password is missing');
    }

    if (password.length < 6) {
        throw httpError(400, 'Password must be at least 6 characters');
    }

    const existing = await db.query(
        "SELECT user_id FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    if (existing.rows.length > 0) {
        throw httpError(409, 'Username already exists', { errorCode: 'USERNAME_TAKEN' });
    }

    const hashedPassword = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    let result;
    try {
        result = await db.query(
            "INSERT INTO \"DMS\".users (username, password_hash, password_text, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, user_role",
            [
                username,
                hashedPassword,
                password,
                role
            ]
        );
    } catch (error) {
        // Two simultaneous signups can both pass the SELECT above.
        // The UNIQUE constraint on username is the real guard, so map it to 409 too.
        if (error.code === '23505') {
            throw httpError(409, 'Username already exists', {
                errorCode: 'USERNAME_TAKEN',
                cause: error
            });
        }
        throw error;
    }

    const newUser = result.rows[0];

    const token = jwt.sign(
        {
            id: newUser.user_id,
            username: newUser.username,
            role: newUser.user_role
        },
        SECRET_KEY,
        {
            expiresIn: TOKEN_EXPIRY
        }
    );

    return {
        success: true,
        message: "Signup successful",
        token,
        user: {
            id: newUser.user_id,
            username: newUser.username,
            role: newUser.user_role
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
    const {
        username,
        oldPassword,
        newPassword,
        role
    } = params ?? {};

    if (!username || !oldPassword || !newPassword || !role) {
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
        "SELECT user_id, username, password_hash, user_role FROM \"DMS\".users WHERE username = $1",
        [username]
    );

    const user = result.rows[0];

    if (!user) {
        throw httpError(404, 'User not found', { errorCode: 'USER_NOT_FOUND' });
    }

    if (user.user_role !== role) {
        throw httpError(403, 'Invalid user role', { errorCode: 'INVALID_ROLE' });
    }

    const isMatch = await bcrypt.compare(
        oldPassword,
        user.password_hash
    );

    // 403 (not 401): the caller is logged in, they just supplied the wrong current password.
    // A 401 here would make most frontends treat it as an expired session and log the user out.
    if (!isMatch) {
        throw httpError(403, 'Current password is incorrect', { errorCode: 'INVALID_CURRENT_PASSWORD' });
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        SALT_ROUNDS
    );

    const updateResult = await db.query(
        "UPDATE \"DMS\".users SET password_hash = $1, password_text = $2, password_changed_at = NOW() WHERE username = $3",
        [
            hashedPassword,
            newPassword,
            username
        ]
    );

    // User was found above, so 0 rows means they were deleted in between.
    if (updateResult.rowCount === 0) {
        throw httpError(404, 'User not found', { errorCode: 'USER_NOT_FOUND' });
    }

    return {
        success: true,
        message: "Password updated successfully"
    };
}


export {
    getAllUsers,
    signup,
    login,
    deleteUser,
    updatePassword
};
