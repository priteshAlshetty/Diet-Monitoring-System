
import jwt from 'jsonwebtoken';
import db from '../../config/config.db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || '4f8a2e91c6d7b3f0a5e8c2d9b6f1a4e7c3d8b5f2a9e6c1d4b7f0a3e8c5d2b9f6';
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '1h';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 6;


async function getAllUsers() {
    try {
        const result = await db.query(
            "SELECT user_id, username, user_role, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at FROM \"DMS\".users"
        );

        return result.rows;

    } catch (error) {
        console.error('getAllUsers Error:', error.message);
        throw error;
    }
}


async function login(params) {

    const { username, password } = params;

    try {

        if (!username || !password) {
            return {
                success: false,
                message: "Username or password is missing"
            };
        }

        const result = await db.query(
            "SELECT user_id, username, password_hash, user_role FROM \"DMS\".users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "Invalid username !!"
            };
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isMatch) {
            return {
                success: false,
                message: "Invalid password !!"
            };
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
    catch (error) {

        console.error('login Error: ', error.message);
        throw error;

    }
}


async function signup(params) {

    const username = params.username;
    const password = params.password;
    const role = params.user_role || params.role || "admin";

    const SALT_ROUNDS = 6; // by env later

    // TODOs
    // Later add salt rounds by env file.

    try {

        if (!username || !password) {
            return {
                success: false,
                message: "Username or password is missing"
            };
        }

        if (password.length < 6) {
            return {
                success: false,
                message: "Password must be at least 6 characters"
            };
        }

        const existing = await db.query(
            "SELECT user_id FROM \"DMS\".users WHERE username = $1",
            [username]
        );

        if (existing.rows.length > 0) {
            return {
                success: false,
                message: "Username already exists"
            };
        }

        const hashedPassword = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        const result = await db.query(
            "INSERT INTO \"DMS\".users (username, password_hash, password_text, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, user_role",
            [
                username,
                hashedPassword,
                password,
                role
            ]
        );

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

    } catch (error) {

        console.error('signup error:', error.message);
        throw error;

    }
}


async function deleteUser(params) {

    try {

        const result = await db.query(
            "DELETE FROM \"DMS\".users WHERE username = $1",
            [params.username]
        );

        if (result.rowCount > 0) {

            return {
                success: true,
                message: `User :${params.username} Deleted from system`
            };

        } else {

            return {
                success: false,
                message: `User :${params.username} does not exists in system`
            };

        }

    } catch (error) {

        console.error('deleteUser error:', error.message);
        throw error;

    }
}


async function updatePassword(params) {

    const {
        username,
        oldPassword,
        newPassword,
        role
    } = params;

    try {

        if (!username || !oldPassword || !newPassword || !role) {
            return {
                success: false,
                message: "Missing required fields"
            };
        }

        if (newPassword.length < 6) {
            return {
                success: false,
                message: "New password must be at least 6 characters"
            };
        }

        const result = await db.query(
            "SELECT user_id, username, password_hash, user_role FROM \"DMS\".users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "Invalid username "
            };
        }

        const user = result.rows[0];

        if (user.user_role !== role) {

            return {
                success: false,
                message: "Invalid user role"
            };

        }

        const isMatch = await bcrypt.compare(
            oldPassword,
            user.password_hash
        );

        if (!isMatch) {

            return {
                success: false,
                message: "Invalid password"
            };

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

        return {
            success: updateResult.rowCount > 0,
            message: updateResult.rowCount > 0
                ? "Password updated successfully"
                : "Password update failed"
        };

    } catch (error) {

        console.error('updatePassword error:', error.message);
        console.error('updatePassword error:', error.stack);

        throw error;

    }
}


export {
    getAllUsers,
    signup,
    login,
    deleteUser,
    updatePassword
};