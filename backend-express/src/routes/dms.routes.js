import express from 'express';
import { getMealMacros } from '../utils/gemini_query.js';
import { insertMealObject } from '../controllers/dms/insertMeal.controller.js';

const router = express.Router();


router.post('/ai/meal-macros', async (req, res) => {
    try {
        const body = req.body;

        if (!body || !Array.isArray(body.mealData) || body.mealData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter mealData'
            });
        }

        const processed_meal_data = await getMealMacros({ meal_items: body.mealData });
        // console.dir(processed_meal_data);

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

router.post('/insertMeal', async (req, res) => {
    const body = req.body || {};
    const { mealData, user_id, meal_type } = body;

    if (!Array.isArray(mealData) || mealData.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one meal item is required.'
        });
    }

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: 'user_id is required.'
        });
    }

    if (typeof meal_type !== 'string' || !meal_type.trim()) {
        return res.status(400).json({
            success: false,
            message: 'meal_type is required.'
        });
    }

    try {
        const result = await insertMealObject(body);
        if (!result?.success || !result.data) {
            throw new Error('Meal insert did not return a result.');
        }

        return res.status(201).json({
            success: true,
            message: 'Meal info uploaded successfully.',
            data: result.data
        });
    } catch (error) {
        console.error('Meal insert failed:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
export default router;