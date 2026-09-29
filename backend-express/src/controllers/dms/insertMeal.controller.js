import 'dotenv/config';
import pool from '../../config/config.db.js';
import { getMealMacros } from '../../utils/gemini_query.js'
import { pathToFileURL } from 'node:url';

async function insertMealObject(params) {
    if (
        !params ||
        !params.user_id ||
        typeof params.meal_type !== 'string' ||
        !params.meal_type.trim() ||
        !Array.isArray(params.mealData) ||
        params.mealData.length === 0
    ) {
        const error = new Error('user_id, meal_type, and at least one meal item are required.');
        error.statusCode = 400;
        throw error;
    }

    let client;
    let transactionStarted = false;

    try {
        const meal_data = await getMealMacros({ meal_items: params.mealData });
        if (meal_data?.success === false) {
            const error = new Error(meal_data.error || 'Failed to calculate meal macros.');
            error.statusCode = 502;
            throw error;
        }
        if (!meal_data?.total || !Array.isArray(meal_data.ingredients)) {
            const error = new Error('Meal macro response is incomplete.');
            error.statusCode = 502;
            throw error;
        }

        const query = `
            INSERT INTO "DMS"."meals" (
                user_id,
                meal_type,
                meal_type_other,
                meal_name,
                total_calories,
                total_protein_gm,
                total_carbs_gm,
                total_fat_gm,
                total_fiber_gm,
                eaten_at,
                raw_json_api,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
            RETURNING *
        `;
        const values = [
            params.user_id,
            params.meal_type,
            params.meal_type_other || null,
            meal_data.meal_name,
            meal_data.total.calories_kcal,
            meal_data.total.protein_g,
            meal_data.total.carbs_g,
            meal_data.total.fat_g,
            meal_data.total.fiber_g || 0,
            params.eaten_at || new Date(),
            meal_data
        ];

        client = await pool.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        const result = await client.query(query, values);
        const insertedMeal = result.rows[0];
        if (!insertedMeal) {
            throw new Error('Meal insert did not return a row.');
        }

        for (const item of meal_data.ingredients) {
            const ingredientResult = await client.query(
                `INSERT INTO "DMS".meal_items (
                    meal_id, user_id, food_item, quantity, calories,
                    protein_gm, carbs_gm, fat_gm, fiber_gm
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    insertedMeal.meal_id,
                    params.user_id,
                    item.name,
                    item.quantity,
                    item.calories_kcal,
                    item.protein_g,
                    item.carbs_g,
                    item.fat_g,
                    item.fiber_g || 0
                ]
            );
            if (ingredientResult.rowCount !== 1) {
                throw new Error(`Failed to insert meal ingredient: ${item.name}`);
            }
        }

        await client.query('COMMIT');
        transactionStarted = false;
        return {
            success: true,
            data: insertedMeal
        };
    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Failed to roll back meal insert:', rollbackError);
            }
        }
        throw error;
    } finally {
        client?.release();
    }
}


/**
 * Direct-run sample test for local debugging.
 * 
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    let params = {

        meal_type: 'Lunch',
        meal_type_other: '',
        mealData: [
            { name: 'rice', quantity: 1, unit: 'cup' },
            { name: 'dal', quantity: 200, unit: 'g' },
            { name: 'spinach', quantity: 1, unit: 'cup' },
        ],
        eaten_at: new Date(),
        user_id: 1

    }

    const runTest = async () => {
        const response = await insertMealObject(params);
    };

    runTest().catch((error) => {
        console.error('Direct run failed:', error);
        process.exitCode = 1;
    });
}

export { insertMealObject };