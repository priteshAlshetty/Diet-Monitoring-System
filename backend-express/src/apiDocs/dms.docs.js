/**
 * @swagger
 * tags:
 *   name: DMS
 *   description: Diet and meal management
 */

/**
 * @swagger
 * /api/dms/insertMeal:
 *   post:
 *     summary: Insert a meal and its ingredients
 *     tags: [DMS]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, meal_type, mealData]
 *             properties:
 *               user_id:
 *                 type: integer
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
 *             user_id: 1
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
 *         description: Missing user_id, meal_type, or mealData
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: meal_type is required.
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