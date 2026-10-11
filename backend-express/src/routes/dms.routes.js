import express from 'express';
import { getMealMacros } from '../utils/gemini_query.js';
import { insertMealObject } from '../controllers/dms/insertMeal.controller.js';
import { httpError } from '../utils/httpError.js';

const router = express.Router();

// Express 5 forwards thrown errors / rejected promises to the central errorHandler,
// so these handlers don't need their own try/catch.
//
// This whole router is mounted behind verifyToken in app.js, so req.user is always set here.
// The user is ALWAYS taken from the token (req.user.id), never from the request body.

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
    // Whitelist the fields we accept. Any user_id sent in the body is ignored.
    const { mealData, meal_type, meal_type_other, eaten_at } = req.body ?? {};

    if (!Array.isArray(mealData) || mealData.length === 0) {
        throw httpError(400, 'At least one meal item is required.');
    }

    if (typeof meal_type !== 'string' || !meal_type.trim()) {
        throw httpError(400, 'meal_type is required.');
    }

    const result = await insertMealObject({
        mealData,
        meal_type,
        meal_type_other,
        eaten_at,
        user_id: req.user.id   // from the verified access token
    });

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