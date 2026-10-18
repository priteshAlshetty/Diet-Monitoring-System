// controllers/dms/controller.dms.js
import pool from "../../config/config.db.js"; // adjust to your pg pool
import { httpError } from '../../utils/httpError.js';
const DAILY_MACROS_SQL = `
WITH days AS (
    SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date - g) AS day
    FROM generate_series(0, $2::int - 1) AS g
)
SELECT
    to_char(d.day, 'YYYY-MM-DD')                 AS date,
    COUNT(m.meal_id)::int                        AS meals,
    COALESCE(SUM(m.total_calories),   0)::float8 AS calories,
    COALESCE(SUM(m.total_protein_gm), 0)::float8 AS protein_gm,
    COALESCE(SUM(m.total_carbs_gm),   0)::float8 AS carbs_gm,
    COALESCE(SUM(m.total_fat_gm),     0)::float8 AS fat_gm,
    COALESCE(SUM(m.total_fiber_gm),   0)::float8 AS fiber_gm
FROM days d
LEFT JOIN "DMS".meals m
       ON m.user_id = $1
      AND (m.eaten_at AT TIME ZONE 'Asia/Kolkata')::date = d.day
      AND m.eaten_at >= ((SELECT MIN(day) FROM days)::timestamp AT TIME ZONE 'Asia/Kolkata')
GROUP BY d.day
ORDER BY d.day;
`;

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

/**
 * Daily macro totals for the last N days (IST), with zeros for days that have no meals.
 * @param {{ userId: number|string, days: number|string }} params
 * @returns {Promise<Array<{date:string, meals:number, calories:number, protein_gm:number,
 *                          carbs_gm:number, fat_gm:number, fiber_gm:number}>>}
 */
// params = { userId, days }
export async function getDailyMacros(params) {
    try {
        const userId = Number(params?.userId);
        const days = Number(params?.days);

        if (!Number.isInteger(userId) || userId < 1) {
            throw httpError(400, "A valid userId is required.");
        }
        if (!Number.isInteger(days) || days < 1 || days > 366) {
            throw httpError(400, "days must be a whole number between 1 and 366.");
        }

        const { rows } = await pool.query(DAILY_MACROS_SQL, [userId, days]);
        return rows;
    } catch (err) {
        // Validation errors above already carry a status: pass them on unchanged.
        if (err.status) throw err;

        // Anything else (database down, SQL error, ...): log the details, hide them from the caller.
        console.error("getDailyMacros failed:", err);
        throw httpError(500, "Failed to fetch daily macros.", err);
    }
}