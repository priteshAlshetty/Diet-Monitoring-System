import crypto from 'node:crypto';
import express from 'express';
import { signup, deleteUser, updatePassword, getAllUsers } from '../controllers/authentication/controller.auth.js';
import verifyToken from '../middleware/middleware.auth.js';
import { httpError } from '../utils/httpError.js';
import { setAuthCookies, clearAuthCookies } from '../utils/tokens.js';

const router = express.Router();

// Rules used in this file (they prevent "headers already sent" bugs):
//   1. Invalid input  -> `throw httpError(...)`  (never res.status(...) without `return`)
//   2. Normal outcome -> a single final res call
// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so no try/catch is needed here.

// Constant-time comparison. Hashing first makes both buffers the same length,
// which timingSafeEqual requires.
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

// POST /api/auth/signup  (public, gated by ACCESS_CODE)
router.post('/signup', async (req, res) => {
    const { username, password, access_code } = req.body ?? {};

    if (!username || !password || !access_code) {
        throw httpError(400, 'Missing required parameters: username, password, access_code');
    }

    // Fail closed: if ACCESS_CODE is not configured, nobody can sign up.
    // errorCode is fixed on purpose: never put what the user typed into logs.
    const ACCESS_CODE = process.env.ACCESS_CODE;
    if (!ACCESS_CODE || !safeEqual(access_code, ACCESS_CODE)) {
        throw httpError(403, 'Invalid access code', { errorCode: 'INVALID_ACCESS_CODE' });
    }

    const result = await signup({ username, password });

    // Tokens go in HttpOnly cookies, NOT in the JSON body.
    setAuthCookies(res, result.user);

    return res.status(201).json({
        success: true,
        message: result.message,
        user: result.user
    });
});

// Everything below requires a valid access cookie (sets req.user)
router.use(verifyToken);

// PUT /api/auth/update-password  (changes the password of the logged-in user)
router.put('/update-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body ?? {};

    if (!oldPassword || !newPassword) {
        throw httpError(400, 'Missing required parameters: oldPassword, newPassword');
    }

    const result = await updatePassword({
        username: req.user.username,   // from the verified token, never from the body
        oldPassword,
        newPassword
    });

    // Log this browser out so the user signs in again with the new password.
    clearAuthCookies(res);
    return res.status(200).json(result);
});

// DELETE /api/auth/delete-user/:username  (a user can only delete their own account)
router.delete('/delete-user/:username', async (req, res) => {
    if (req.params.username !== req.user.username) {
        throw httpError(403, 'You can only delete your own account', { errorCode: 'FORBIDDEN' });
    }

    const result = await deleteUser({ username: req.user.username });

    clearAuthCookies(res);
    return res.status(200).json(result);
});

// GET /api/auth/users
// Any logged-in user can list all users (fine for a trusted beta).
router.get('/users', async (req, res) => {
    const users = await getAllUsers();
    return res.status(200).json({ success: true, users });
});

export default router;