import express from 'express';
import { getMealMacros } from '../utils/gemini_query.js';

const router = express.Router();


router.post('/meal-macros', async (req, res) => {
    try {
        const meal_data = await getMealMacros(req.body);
        console.dir(meal_data);
        return res.status(200).json({ success: true, meal });
    } catch (error) {
        console.error('Meal macros request failed:', error.message);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to calculate meal macros.',
            ...(error.raw && { raw: error.raw }),
        });
    }
});

export default router;