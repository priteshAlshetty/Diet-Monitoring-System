import { login } from '../controllers/authentication/controller.auth.js';
import { httpError } from '../utils/httpError.js';
import express from 'express';

const router = express.Router();

// POST /api/auth/login
// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so no try/catch is needed here.
router.post('/login', async (req, res) => {
    // In Express 5 req.body is undefined when no body was sent, so default to {}.
    const { username, password } = req.body ?? {};

    if (!username || !password) {
        throw httpError(400, 'Missing required parameters');
    }

    // login() throws a 401 httpError for bad credentials,
    // so a returned result is always a success.
    const result = await login({ username, password });
    res.status(200).json(result);
});

export default router;
