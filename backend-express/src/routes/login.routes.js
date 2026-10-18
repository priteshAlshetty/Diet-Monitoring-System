import express from 'express';
import { login } from '../controllers/authentication/controller.auth.js';
import { httpError } from '../utils/httpError.js';
import { REFRESH_COOKIE } from '../config/config.auth.js';
import {
    verifyRefresh,
    setAuthCookies,
    setAccessCookie,
    clearAuthCookies
} from '../utils/tokens.js';

const router = express.Router();

// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so no try/catch is needed here.

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
        throw httpError(400, 'Missing required parameters');
    }
    // TEMPORARY: 1s artificial delay to test the frontend loader. Remove after testing.
    await new Promise((resolve) => setTimeout(resolve, 5000));
    // login() throws a 401 httpError for bad credentials,
    // so a returned result is always a success.
    const result = await login({ username, password });

    // Tokens go in HttpOnly cookies, NOT in the JSON body.
    setAuthCookies(res, result.user);

    return res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
    });
});

// POST /api/auth/refresh
// Zero DB calls: verifies the refresh cookie and issues a new ACCESS cookie only.
// The refresh token is not re-issued, so its 7-day expiry stays fixed.
router.post('/refresh', (req, res) => {
    // Refresh failures: clear cookies so the frontend lands cleanly on the login page.
    let payload;
    try {
        payload = verifyRefresh(req.cookies?.[REFRESH_COOKIE]);
    } catch (error) {
        clearAuthCookies(res);
        throw error;
    }

    setAccessCookie(res, { id: payload.id, username: payload.username });

    res.status(200).json({ success: true, message: 'Token refreshed' });
});

// POST /api/auth/logout
// Clears both cookies in this browser. (Stateless tokens can't be revoked server-side.)
router.post('/logout', (req, res) => {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Logged out' });
});

export default router;