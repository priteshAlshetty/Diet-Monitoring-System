/**
 * @swagger
 * tags:
 *   name: DMS
 *   description: Diet and meal management (requires a logged-in user)
 */

/**
 * @swagger
 * /api/dms/insertMeal:
 *   post:
 *     summary: Insert a meal and its ingredients
 *     description: The meal is saved for the logged-in user (taken from the access cookie). Do not send a user_id; it is ignored.
 *     tags: [DMS]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meal_type, mealData]
 *             properties:
 *               meal_type:
 *                 type: string
 *                 example: Breakfast
 *               meal_type_other:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               eaten_at:
 *                 type: string
 *                 format: date-time
 *               mealData:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [name, quantity, unit]
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *           example:
 *             meal_type: Breakfast
 *             meal_type_other: ''
 *             mealData:
 *               - name: oats
 *                 quantity: 60
 *                 unit: g
 *               - name: milk
 *                 quantity: 250
 *                 unit: ml
 *               - name: banana
 *                 quantity: 1
 *                 unit: piece
 *     responses:
 *       201:
 *         description: Meal and ingredients inserted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Meal info uploaded successfully.
 *               data:
 *                 meal_id: 6
 *                 user_id: 1
 *                 meal_type: Breakfast
 *                 meal_name: Oatmeal with Milk and Banana
 *                 total_calories: 427
 *                 total_protein_gm: 16.5
 *                 total_carbs_gm: 74.5
 *                 total_fat_gm: 8.1
 *                 total_fiber_gm: 9.3
 *       400:
 *         description: Missing meal_type or mealData
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: meal_type is required.
 *       401:
 *         description: Not logged in or access token expired (errorCode TOKEN_MISSING, TOKEN_EXPIRED or TOKEN_INVALID)
 *       500:
 *         description: Database or server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 *       502:
 *         description: Nutrition macro service failed
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Failed to calculate meal macros.
 */
/**
 * @swagger
 * /api/dms/dailyMacros:
 *   get:
 *     tags: [DMS]
 *     summary: Daily calories and macros for the last N days
 *     description: >
 *       Returns one entry for each of the last N days in India time (Asia/Kolkata), ending today.
 *       Days with no logged meals are included with all values set to 0.
 *       The user is taken from the access cookie. Do not send a user id.
 *       Results are ordered from the oldest day to today.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         required: true
 *         description: Number of days to return, counting back from today (1 to 366).
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 366
 *           example: 7
 *     responses:
 *       200:
 *         description: Daily totals, one item per day (zeros for days without meals)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 days:
 *                   type: integer
 *                   description: Number of items in data (same as the requested days)
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DailyMacros'
 *             example:
 *               success: true
 *               days: 3
 *               data:
 *                 - date: "2026-10-09"
 *                   meals: 0
 *                   calories: 0
 *                   protein_gm: 0
 *                   carbs_gm: 0
 *                   fat_gm: 0
 *                   fiber_gm: 0
 *                 - date: "2026-10-10"
 *                   meals: 3
 *                   calories: 1310
 *                   protein_gm: 62.5
 *                   carbs_gm: 168
 *                   fat_gm: 41.2
 *                   fiber_gm: 22
 *                 - date: "2026-10-11"
 *                   meals: 2
 *                   calories: 427
 *                   protein_gm: 16.5
 *                   carbs_gm: 74.5
 *                   fat_gm: 8.1
 *                   fiber_gm: 9.3
 *       400:
 *         description: Missing or invalid days (must be a whole number from 1 to 366)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "days must be a whole number between 1 and 366."
 *       401:
 *         description: Not logged in or access token expired (errorCode TOKEN_MISSING, TOKEN_EXPIRED or TOKEN_INVALID)
 *       500:
 *         description: Database or server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to fetch daily macros."
 */

/**
 * @swagger
 * /api/dms/dailySummary:
 *   get:
 *     summary: Dashboard data for one day
 *     description: |
 *       Returns the logged-in user's totals, goals, progress percentages, macro breakdown and meal list
 *       for one calendar day in Indian Standard Time (IST). The user is taken from the access cookie.
 *       Goals are fixed for now (1800 kcal, 80 g protein, 200 g carbs, 60 g fat).
 *     tags: [DMS]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         description: Day to load, as YYYY-MM-DD. Defaults to today (IST).
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-10-11"
 *     responses:
 *       200:
 *         description: Summary for the requested day. A day with no meals returns zeros and an empty meals list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     totals:
 *                       type: object
 *                       properties:
 *                         calories:
 *                           type: number
 *                         protein_g:
 *                           type: number
 *                         carbs_g:
 *                           type: number
 *                         fat_g:
 *                           type: number
 *                         fiber_g:
 *                           type: number
 *                     goals:
 *                       type: object
 *                       properties:
 *                         calories:
 *                           type: number
 *                         protein_g:
 *                           type: number
 *                         carbs_g:
 *                           type: number
 *                         fat_g:
 *                           type: number
 *                     progress_percent:
 *                       type: object
 *                       description: totals divided by goals, rounded. Not capped at 100.
 *                       properties:
 *                         calories:
 *                           type: integer
 *                         protein:
 *                           type: integer
 *                         carbs:
 *                           type: integer
 *                         fat:
 *                           type: integer
 *                     macro_breakdown_percent:
 *                       type: object
 *                       description: Share of energy from each macro (protein and carbs 4 kcal/g, fat 9 kcal/g).
 *                       properties:
 *                         protein:
 *                           type: integer
 *                         carbs:
 *                           type: integer
 *                         fat:
 *                           type: integer
 *                     meals:
 *                       type: array
 *                       description: Meals of the day, oldest first.
 *                       items:
 *                         type: object
 *                         properties:
 *                           meal_id:
 *                             type: integer
 *                           meal_type:
 *                             type: string
 *                           meal_type_other:
 *                             type: string
 *                             nullable: true
 *                           meal_name:
 *                             type: string
 *                           time:
 *                             type: string
 *                             description: Time of the meal in IST, for display.
 *                           eaten_at:
 *                             type: string
 *                             format: date-time
 *                           calories:
 *                             type: number
 *                           protein_g:
 *                             type: number
 *                           carbs_g:
 *                             type: number
 *                           fat_g:
 *                             type: number
 *                           fiber_g:
 *                             type: number
 *             example:
 *               success: true
 *               data:
 *                 date: "2026-10-11"
 *                 totals:
 *                   calories: 1240
 *                   protein_g: 62
 *                   carbs_g: 170
 *                   fat_g: 37
 *                   fiber_g: 0
 *                 goals:
 *                   calories: 1800
 *                   protein_g: 80
 *                   carbs_g: 200
 *                   fat_g: 60
 *                 progress_percent:
 *                   calories: 69
 *                   protein: 78
 *                   carbs: 85
 *                   fat: 62
 *                 macro_breakdown_percent:
 *                   protein: 20
 *                   carbs: 54
 *                   fat: 26
 *                 meals:
 *                   - meal_id: 1
 *                     meal_type: Breakfast
 *                     meal_type_other: null
 *                     meal_name: Oats with Banana & Nuts
 *                     time: 08:00 AM
 *                     eaten_at: "2026-10-11T02:30:00+00:00"
 *                     calories: 320
 *                     protein_g: 12
 *                     carbs_g: 48
 *                     fat_g: 10
 *                     fiber_g: 0
 *       400:
 *         description: date is not a valid YYYY-MM-DD date
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: date must be a valid date in YYYY-MM-DD format.
 *       401:
 *         description: Not logged in or access token expired (errorCode TOKEN_MISSING, TOKEN_EXPIRED or TOKEN_INVALID)
 *       503:
 *         description: Database unavailable
 *       504:
 *         description: Database query timed out
 */