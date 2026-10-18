import pool from '../../config/config.db.js';
import { httpError } from '../../utils/httpError.js';
import { classifyDbInfraError } from '../../utils/dbErrors.js';

/**
 * Dashboard data for ONE user and ONE calendar day.
 *
 * Errors (all thrown as httpError):
 *   400 - bad date / bad user id
 *   503 / 504 - database unavailable or timed out (via classifyDbInfraError)
 *   500 - anything else (central errorHandler)
 */

// TODO: goals are fixed for now. Later, read them from a per-user goals table
// and replace this constant (the rest of the file will not need to change).
const DAILY_GOALS = {
    calories: 1800,
    protein_g: 80,
    carbs_g: 200,
    fat_g: 60
};

// The whole system runs on Indian Standard Time, so "a day" always means an IST calendar day.
const APP_TIMEZONE = 'Asia/Kolkata';

// Energy per gram, used only for the donut chart percentages.
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

/**
 * ONE round trip: totals + the meal list for the day.
 *   $1 = user id, $2 = 'YYYY-MM-DD', $3 = APP_TIMEZONE
 * The range is written on the raw eaten_at column, so idx_meals_user_date
 * (user_id, eaten_at) is used. Always returns exactly one row (empty day = zeros and []).
 */
const DAILY_SUMMARY_SQL = `
WITH day_meals AS (
    SELECT
        meal_id,
        meal_type,
        meal_type_other,
        COALESCE(NULLIF(meal_name, ''), meal_type) AS meal_name,
        total_calories,
        total_protein_gm,
        total_carbs_gm,
        total_fat_gm,
        total_fiber_gm,
        eaten_at
    FROM "DMS".meals
    WHERE user_id = $1
      AND eaten_at >= ($2::date)::timestamp AT TIME ZONE $3::text
      AND eaten_at <  ($2::date + 1)::timestamp AT TIME ZONE $3::text
)
SELECT
    COALESCE(SUM(total_calories), 0)::float8   AS calories,
    COALESCE(SUM(total_protein_gm), 0)::float8 AS protein_g,
    COALESCE(SUM(total_carbs_gm), 0)::float8   AS carbs_g,
    COALESCE(SUM(total_fat_gm), 0)::float8     AS fat_g,
    COALESCE(SUM(total_fiber_gm), 0)::float8   AS fiber_g,
    COALESCE(
        json_agg(
            json_build_object(
                'meal_id',         meal_id,
                'meal_type',       meal_type,
                'meal_type_other', meal_type_other,
                'meal_name',       meal_name,
                'time',            to_char(eaten_at AT TIME ZONE $3::text, 'HH12:MI AM'),
                'eaten_at',        eaten_at,
                'calories',        total_calories,
                'protein_g',       total_protein_gm,
                'carbs_g',         total_carbs_gm,
                'fat_g',           total_fat_gm,
                'fiber_g',         total_fiber_gm
            )
            ORDER BY eaten_at, meal_id
        ),
        '[]'::json
    ) AS meals
FROM day_meals;
`;

// Today's date in IST, as YYYY-MM-DD ('en-CA' formats that way).
function todayInIst() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());
}

// Must look like YYYY-MM-DD and be a real calendar date (rejects 2026-02-30).
function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const percentOf = (value, goal) => (goal > 0 ? Math.round((value / goal) * 100) : 0);

async function getDailySummary(params) {
    const { userId, date } = params ?? {};

    if (!Number.isInteger(userId) || userId < 1) {
        throw httpError(400, 'Invalid user.');
    }

    if (date !== undefined && typeof date !== 'string') {
        throw httpError(400, 'date must be a string in YYYY-MM-DD format.');
    }
    const day = date || todayInIst();
    if (!isValidDate(day)) {
        throw httpError(400, 'date must be a valid date in YYYY-MM-DD format.');
    }

    let row;
    try {
        const result = await pool.query(DAILY_SUMMARY_SQL, [userId, day, APP_TIMEZONE]);
        row = result.rows[0];
    } catch (error) {
        const infra = classifyDbInfraError(error);
        if (infra) {
            throw httpError(infra.statusCode, infra.message, { cause: error });
        }
        throw error;
    }

    const totals = {
        calories: row.calories,
        protein_g: row.protein_g,
        carbs_g: row.carbs_g,
        fat_g: row.fat_g,
        fiber_g: row.fiber_g
    };

    // Donut chart: share of the energy that comes from each macro (protein/carbs 4 kcal/g, fat 9 kcal/g).
    const kcal = {
        protein: totals.protein_g * KCAL_PER_G.protein,
        carbs: totals.carbs_g * KCAL_PER_G.carbs,
        fat: totals.fat_g * KCAL_PER_G.fat
    };
    const kcalSum = kcal.protein + kcal.carbs + kcal.fat;
    const share = (value) => (kcalSum > 0 ? Math.round((value / kcalSum) * 100) : 0);

    return {
        date: day,
        totals,
        goals: DAILY_GOALS,
        // Not capped at 100: the frontend decides how to draw "over goal".
        progress_percent: {
            calories: percentOf(totals.calories, DAILY_GOALS.calories),
            protein: percentOf(totals.protein_g, DAILY_GOALS.protein_g),
            carbs: percentOf(totals.carbs_g, DAILY_GOALS.carbs_g),
            fat: percentOf(totals.fat_g, DAILY_GOALS.fat_g)
        },
        macro_breakdown_percent: {
            protein: share(kcal.protein),
            carbs: share(kcal.carbs),
            fat: share(kcal.fat)
        },
        meals: row.meals
    };
}

export { getDailySummary };