import 'dotenv/config';
import pool from '../../config/config.db.js';
import { getMealMacros } from '../../utils/gemini_query.js'
import { pathToFileURL } from 'node:url';

async function insertMealObject(params) {
    const mealObject = {};

    mealObject['meal_type'] = params.meal_type;
    mealObject['meal_type_other'] = params.meal_type_other;

    const meal_data = await getMealMacros({ meal_items: params.mealData });

    mealObject['meal_name'] = meal_data.meal_name;
    mealObject['total_calories'] = meal_data.total.calories_kcal;
    mealObject['total_protein_gm'] = meal_data.total.protein_g;
    mealObject['total_carbs_gm'] = meal_data.total.carbs_g;
    mealObject['total_fat_gm'] = meal_data.total.fat_g;
    mealObject['total_fiber_gm'] = meal_data.total.fiber_g || 0;
    mealObject['eaten_at'] = params.eaten_at || new Date();

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
        mealObject.meal_type,
        mealObject.meal_type_other || null,
        mealObject.meal_name,
        mealObject.total_calories,
        mealObject.total_protein_gm,
        mealObject.total_carbs_gm,
        mealObject.total_fat_gm,
        mealObject.total_fiber_gm,
        mealObject.eaten_at,
        meal_data
    ];

    const result = await pool.query(query, values);
    const insertedMeal = result.rows[0];

    return {
        meal_id: insertedMeal.meal_id,
        ...insertedMeal
    };
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
        console.log('Inserted meal_id:', response.meal_id);
        console.dir(response, { depth: null });
    };

    runTest().catch((error) => {
        console.error('Direct run failed:', error);
        process.exitCode = 1;
    });
}

export { insertMealObject };