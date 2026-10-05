import 'dotenv/config';
import pool from '../../config/config.db.js';
import { getMealMacros } from '../../utils/gemini_query.js'
import { classifyDbInfraError } from '../../utils/dbErrors.js';
import { pathToFileURL } from 'node:url';

/**
 * Errors thrown from this module always carry a `statusCode`:
 *   400 - invalid input (bad user_id, too-long text, bad eaten_at, ...)
 *   404 - user_id does not exist
 *   502 - Gemini returned data the database cannot accept
 *   503 - database unavailable
 *   500 - anything else (original error kept on `error.cause` for logging)
 */

// ---- Limits that mirror the "DMS" schema (keep in sync with the tables) ----
const MAX_PG_INT = 2147483647;      // users.user_id / meals.user_id: integer
const MEAL_TYPE_OTHER_MAX = 50;     // meals.meal_type_other: varchar(50)
const FOOD_ITEM_MAX = 255;          // meal_items.food_item: varchar(255)
const MAX_MACRO_VALUE = 999999.99;  // every macro column: numeric(8,2)

function createError(message, statusCode, extra = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return Object.assign(error, extra);
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
// CHECK (col >= 0) and numeric(8,2) range
const isMacro = (v) => isNum(v) && v >= 0 && v <= MAX_MACRO_VALUE;
// fiber is optional in our inserts (`|| 0`)
const isOptionalMacro = (v) => v == null || isMacro(v);

/**
 * Validates the client input BEFORE any Gemini call or DB work,
 * so bad requests fail fast (400) and never cost an API call.
 * Returns normalized values.
 */
function validateInput(params) {
    if (
        !params ||
        typeof params.meal_type !== 'string' ||
        !params.meal_type.trim() ||
        !Array.isArray(params.mealData) ||
        params.mealData.length === 0
    ) {
        throw createError('user_id, meal_type, and at least one meal item are required.', 400);
    }

    // user_id is a 32-bit integer column. Accept 5 or "5", reject everything else.
    const rawId = params.user_id;
    const userId =
        typeof rawId === 'number'
            ? rawId
            : typeof rawId === 'string' && /^\d+$/.test(rawId)
                ? Number(rawId)
                : NaN;
    if (!Number.isInteger(userId) || userId < 1 || userId > MAX_PG_INT) {
        throw createError('user_id must be a positive integer.', 400);
    }

    let mealTypeOther = null;
    if (params.meal_type_other != null && params.meal_type_other !== '') {
        if (typeof params.meal_type_other !== 'string') {
            throw createError('meal_type_other must be a string.', 400);
        }
        mealTypeOther = params.meal_type_other.trim() || null;
        if (mealTypeOther && mealTypeOther.length > MEAL_TYPE_OTHER_MAX) {
            throw createError(`meal_type_other must be at most ${MEAL_TYPE_OTHER_MAX} characters.`, 400);
        }
    }

    const eatenAt = params.eaten_at ? new Date(params.eaten_at) : new Date();
    if (Number.isNaN(eatenAt.getTime())) {
        throw createError('eaten_at is not a valid date.', 400);
    }

    return { userId, mealType: params.meal_type, mealTypeOther, eatenAt };
}

/**
 * Cheap existence check so an unknown user_id fails with 404 BEFORE we pay for a
 * Gemini call. (The foreign key still guards against a race; see mapDbError.)
 */
async function assertUserExists(userId) {
    let result;
    try {
        result = await pool.query('SELECT 1 FROM "DMS".users WHERE user_id = $1', [userId]);
    } catch (error) {
        throw mapDbError(error);
    }
    if (result.rowCount === 0) {
        throw createError('User not found.', 404, { errorCode: 'USER_NOT_FOUND' });
    }
}

/**
 * Validates Gemini's response against what the schema will accept:
 *   - CHECK (... >= 0) on every macro column
 *   - numeric(8,2) range
 *   - food_item varchar(255)
 * Throws 502 because the problem is the upstream data, not the client's request.
 */
function assertValidMealData(meal_data) {
    const t = meal_data?.total;
    const totalsOk =
        t &&
        isMacro(t.calories_kcal) &&
        isMacro(t.protein_g) &&
        isMacro(t.carbs_g) &&
        isMacro(t.fat_g) &&
        isOptionalMacro(t.fiber_g);

    const ingredientsOk =
        Array.isArray(meal_data?.ingredients) &&
        meal_data.ingredients.length > 0 &&
        meal_data.ingredients.every(
            (i) =>
                i &&
                typeof i.name === 'string' &&
                i.name.trim() &&
                i.name.length <= FOOD_ITEM_MAX &&
                i.quantity != null &&
                isMacro(i.calories_kcal) &&
                isMacro(i.protein_g) &&
                isMacro(i.carbs_g) &&
                isMacro(i.fat_g) &&
                isOptionalMacro(i.fiber_g)
        );

    if (
        typeof meal_data?.meal_name !== 'string' ||
        !meal_data.meal_name.trim() ||
        !totalsOk ||
        !ingredientsOk
    ) {
        throw createError('Meal macro response is incomplete or invalid.', 502, {
            raw: meal_data
        });
    }
}

/**
 * Converts raw Postgres / driver errors into safe, client-friendly errors.
 * The original error is kept on `cause` so it is still logged server-side, but
 * internal details (table names, SQL, constraint names) never reach the client.
 *
 * Most of these are a safety net: validateInput / assertValidMealData should
 * already have caught the problem. They matter when the schema changes or a
 * race slips through.
 */
function mapDbError(error) {
    if (error?.statusCode) {
        return error; // already a handled, intentional error
    }

    const code = error?.code;

    // FK violation on user_id (meals_user_id_fkey / meal_items_user_id_fkey),
    // e.g. the user was deleted between the existence check and the insert.
    if (code === '23503' && /user_id_fkey$/.test(error.constraint ?? '')) {
        return createError('User not found.', 404, { errorCode: 'USER_NOT_FOUND', cause: error });
    }
    // CHECK (... >= 0) on a macro column: the values came from Gemini.
    if (code === '23514') {
        return createError('Meal macro values are invalid.', 502, { cause: error });
    }
    // numeric(8,2) overflow: also Gemini data (user_id is validated up front).
    if (code === '22003') {
        return createError('A macro value is out of range.', 502, { cause: error });
    }
    // varchar overflow (meal_type_other / food_item) that slipped past validation.
    if (code === '22001') {
        return createError('One or more text fields are too long.', 400, { cause: error });
    }
    if (code === '22P02') {
        return createError('One or more fields have an invalid format.', 400, { cause: error });
    }
    if (code === '22007' || code === '22008') {
        return createError('Invalid date/time value (check eaten_at).', 400, { cause: error });
    }
    // Database down / pool exhausted (503) or query timed out (504).
    const infra = classifyDbInfraError(error);
    if (infra) {
        return createError(infra.message, infra.statusCode, { cause: error });
    }

    // Deliberately NOT mapped: 23505 (unique violation). meals / meal_items only have
    // primary-key uniqueness, so a 23505 here means the ID sequence is out of sync.
    // That is a server bug, not a client conflict, so it falls through to a 500.
    return createError('Failed to save meal.', 500, { cause: error });
}

async function insertMealObject(params) {
    // ---- 1. Validate input (400) ----
    const { userId, mealType, mealTypeOther, eatenAt } = validateInput(params);

    // ---- 2. Fail fast on unknown user (404), before spending a Gemini call ----
    await assertUserExists(userId);

    // ---- 3. Get macros from Gemini (errors already carry statusCode) ----
    // Done BEFORE acquiring a transaction connection so a slow API call never holds one.
    const meal_data = await getMealMacros({ meal_items: params.mealData });
    assertValidMealData(meal_data);

    const mealQuery = `
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
    const mealValues = [
        userId,
        mealType,
        mealTypeOther,
        meal_data.meal_name,
        meal_data.total.calories_kcal,
        meal_data.total.protein_g,
        meal_data.total.carbs_g,
        meal_data.total.fat_g,
        meal_data.total.fiber_g || 0,
        eatenAt,
        meal_data
    ];

    // ---- 4. Acquire DB connection (503 on failure) ----
    let client;
    try {
        client = await pool.connect();
    } catch (error) {
        throw mapDbError(error);
    }

    let transactionStarted = false;
    let destroyClient = false;

    // ---- 5. Transaction ----
    try {
        await client.query('BEGIN');
        transactionStarted = true;

        const result = await client.query(mealQuery, mealValues);
        const insertedMeal = result.rows[0];
        if (!insertedMeal) {
            throw createError('Meal insert did not return a row.', 500);
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
                    userId,
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
                throw createError(`Failed to insert meal ingredient: ${item.name}`, 500);
            }
        }

        await client.query('COMMIT');
        transactionStarted = false;

        return {
            success: true,
            data: insertedMeal
        };
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Failed to roll back meal insert:', rollbackError);
                // Connection is in an unknown state: don't return it to the pool.
                destroyClient = true;
            }
        }
        throw mapDbError(error);
    } finally {
        client.release(destroyClient ? true : undefined);
    }
}


/**
 * Direct-run sample test for local debugging.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const params = {
        meal_type: 'Lunch',
        meal_type_other: '',
        mealData: [
            { name: 'rice', quantity: 1, unit: 'cup' },
            { name: 'dal', quantity: 200, unit: 'g' },
            { name: 'spinach', quantity: 1, unit: 'cup' },
        ],
        eaten_at: new Date(),
        user_id: 1
    };

    const runTest = async () => {
        const response = await insertMealObject(params);
        console.dir(response, { depth: null });
    };

    runTest()
        .catch((error) => {
            console.error('Direct run failed:', error);
            process.exitCode = 1;
        })
        .finally(() => pool.end());
}

export { insertMealObject };
