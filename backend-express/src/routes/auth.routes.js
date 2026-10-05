import { signup, deleteUser, updatePassword, getAllUsers } from '../controllers/authentication/controller.auth.js';
import { httpError } from '../utils/httpError.js';
import express from 'express';

const router = express.Router();

// Rules used in this file (they prevent "headers already sent" bugs):
//   1. Invalid input  -> `throw httpError(...)`  (never res.status(...) without `return`)
//   2. Normal outcome -> `return res.status(...).json(...)` or a single final res call
// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so no try/catch is needed here.

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, password, user_role } = req.body ?? {};

    if (!username || !password) {
        throw httpError(400, 'Missing required parameters: username, password');
    }

    // Controllers throw httpError (400 / 409 / ...) on failure,
    // so a returned result is always a success.
    const result = await signup({ username, password, user_role });
    res.status(201).json(result);
});

// PUT /api/auth/update-password
router.put('/update-password', async (req, res) => {
    const { username, oldPassword, newPassword, role } = req.body ?? {};

    if (!username || !oldPassword || !newPassword || !role) {
        throw httpError(400, 'Missing required parameters: username, oldPassword, newPassword, role');
    }

    // Throws 400 / 403 / 404 from the controller on failure.
    const result = await updatePassword({ username, oldPassword, newPassword, role });
    res.status(200).json(result);
});

// DELETE /api/auth/delete-user/:username
// (:username is a required path segment, so Express never matches this route
//  without it. The old `if (!req.params.username)` check was unreachable.)
router.delete('/delete-user/:username', async (req, res) => {
    // Throws 404 from the controller if the user doesn't exist.
    const result = await deleteUser({ username: req.params.username });
    res.status(200).json(result);
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
    const users = await getAllUsers();
    res.status(200).json({ success: true, users });
});

export default router;
