
import { signup, deleteUser, updatePassword, getAllUsers } from '../controllers/authentication/controller.auth.js';
import express from 'express';

const router = express.Router();


//POST api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, user_role } = req.body;
        if (!username || !password) {
            res.status(400).json({
                success: false,
                message: "Required parameter missing !"
            })
        }
        const result = await signup({ username, password, user_role });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);


    } catch (error) {
        console.error('signup route error: ', error.message);
        res.status(500).json({
            success: false,
            message: `Internal Server Error : ${error.message}`
        })
    }
});




// PUT /api/auth/update-password
router.put('/update-password', async (req, res) => {
    try {

        const { username, oldPassword, newPassword, role } = req.body;

        if (!username || !oldPassword || !newPassword || !role) {
            return res.status(400).json({
                success: false,
                message: "Missing required parameters : username, oldPassword, newPassword, role"
            })
        }

        const result = await updatePassword({ username, oldPassword, newPassword, role });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('update-password route error:', error.message);
        res.status(500).json({ success: false, message: `Internal server error : ${error.message}` });
    }
});
// DELETE /api/auth/delete-user/:username
router.delete('/delete-user/:username', async (req, res) => {
    try {
        if (!req.params.username) {
            res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            })
        }

        const result = await deleteUser({ username: req.params.username });

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('delete-user route error:', error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error('get-users route error:', error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

export default router;