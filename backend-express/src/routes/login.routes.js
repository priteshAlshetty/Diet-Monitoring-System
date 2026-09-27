
import { login } from '../controllers/authentication/controller.auth.js';
import express from 'express';

const router = express.Router();




// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters"
            })
        }

        const result = await login({ username, password });


        if (!result.success) {
            return res.status(401).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('login route error:', error.message);
        res.status(500).json({ success: false, message: `Internal server error : ${error.message}` });
    }
});


export default router;