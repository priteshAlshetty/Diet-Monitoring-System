import express from 'express';
import { getMealMacros } from '../utils/gemini_query.js';
import { insertMealObject } from '../controllers/dms/insertMeal.controller.js';
import { httpError } from '../utils/httpError.js';

const router = express.Router();

// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so these handlers don't need their own try/catch.

// POST /api/dms/ai/meal-macros
router.post('/ai/meal-macros', async (req, res) => {
    const mealData = req.body?.mealData;

    if (!Array.isArray(mealData) || mealData.length === 0) {
        throw httpError(400, 'Missing required parameter mealData');
    }

    // getMealMacros throws on failure (400 / 429 / 500 / 502 / 504), so reaching
    // the next line means the call succeeded.
    const data = await getMealMacros({ meal_items: mealData });

    res.status(200).json({ success: true, data });
});

// POST /api/dms/insertMeal
router.post('/insertMeal', async (req, res) => {
    const body = req.body ?? {};
    const { mealData, user_id, meal_type } = body;

    if (!Array.isArray(mealData) || mealData.length === 0) {
        throw httpError(400, 'At least one meal item is required.');
    }

    if (!user_id) {
        throw httpError(400, 'user_id is required.');
    }

    if (typeof meal_type !== 'string' || !meal_type.trim()) {
        throw httpError(400, 'meal_type is required.');
    }

    const result = await insertMealObject(body);

    if (!result?.success || !result.data) {
        throw httpError(500, 'Meal insert did not return a result.');
    }

    res.status(201).json({
        success: true,
        message: 'Meal info uploaded successfully.',
        data: result.data
    });
});

export default router;
