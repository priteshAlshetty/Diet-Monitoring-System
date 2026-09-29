import express from 'express';
import { getMealMacros } from '../utils/gemini_query.js';

const router = express.Router();


router.post('/ai/meal-macros', async (req, res) => {
    try {
        const body = req.body;
        console.dir(body);

        if (!body || !Array.isArray(body.mealData) || body.mealData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter mealData'
            });
        }

        const processed_meal_data = await getMealMacros({ meal_items: body.mealData });
        console.dir(processed_meal_data);

        return res.status(200).json({
            success: true,
            data: processed_meal_data
        });
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