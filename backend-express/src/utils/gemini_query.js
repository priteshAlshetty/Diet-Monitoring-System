/**
 * Gemini-powered meal macro estimation utility.
 * Converts a meal item list into a prompt, sends it to the Gemini API,
 * and returns the total nutrition and per-ingredient breakdown.
 */
import 'dotenv/config';
import { pathToFileURL } from 'node:url';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = process.env.GEMINI_URL;

async function getMealMacros(params) {
    let prompt = '';
    for (const item of params.meal_items) {
        if (prompt) {
            prompt += ', ';
        }
        prompt += `${item.name} | ${item.quantity} | ${item.unit}`;
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        const error = new Error('At least one meal item is required.');
        error.statusCode = 400;
        throw error;
    }

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `Estimate the nutrition macros for this meal: \n ${prompt}. Give total calories and macros for the whole meal, plus a breakdown per ingredient.`,
                    },
                ],
            },
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    meal_name: { type: "string" },
                    total: {
                        type: "object",
                        properties: {
                            calories_kcal: { type: "number" },
                            protein_g: { type: "number" },
                            carbs_g: { type: "number" },
                            fat_g: { type: "number" },
                        },
                        required: ["calories_kcal", "protein_g", "carbs_g", "fat_g"],
                    },
                    ingredients: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                quantity: { type: "string" },
                                calories_kcal: { type: "number" },
                                protein_g: { type: "number" },
                                carbs_g: { type: "number" },
                                fat_g: { type: "number" },
                            },
                            required: ["name", "quantity", "calories_kcal", "protein_g", "carbs_g", "fat_g"],
                        },
                    },
                },
                required: ["meal_name", "total", "ingredients"],
            },
            thinkingConfig: { thinkingBudget: 0 },
        },
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const error = new Error(
                errorData?.error?.message || response.statusText || 'Gemini API request failed.'
            );
            error.statusCode = response.status;
            throw error;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            const error = new Error('No content returned from Gemini.');
            error.statusCode = 502;
            throw error;
        }

        try {
            return JSON.parse(rawText);
        } catch {
            const error = new Error('Failed to parse model output as JSON.');
            error.statusCode = 502;
            error.raw = rawText;
            throw error;
        }

    } catch (error) {
        console.log("Error at getMacros function call")
        console.dir(error);
        return {
            'success': false,
            'error': error.message
        }
    }
}

/**
 * Direct-run sample test for local debugging.
 * Calls the Gemini API 10 times with different meal combinations.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const meals = [
        [
            { name: 'rice', quantity: 1, unit: 'cup' },
            { name: 'dal', quantity: 200, unit: 'g' },
            { name: 'spinach', quantity: 1, unit: 'cup' },
        ],
        [
            { name: 'chapati', quantity: 2, unit: 'pieces' },
            { name: 'chicken curry', quantity: 250, unit: 'g' },
            { name: 'cucumber', quantity: 1, unit: 'cup' },
        ]//,
        // [
        //     { name: 'oats', quantity: 60, unit: 'g' },
        //     { name: 'milk', quantity: 250, unit: 'ml' },
        //     { name: 'banana', quantity: 1, unit: 'piece' },
        // ],
        // [
        //     { name: 'paneer', quantity: 150, unit: 'g' },
        //     { name: 'brown rice', quantity: 1, unit: 'cup' },
        //     { name: 'mixed vegetables', quantity: 1, unit: 'cup' },
        // ],
        // [
        //     { name: 'bread', quantity: 2, unit: 'slices' },
        //     { name: 'egg', quantity: 2, unit: 'pieces' },
        //     { name: 'avocado', quantity: 1, unit: 'piece' },
        // ],
        // [
        //     { name: 'quinoa', quantity: 1, unit: 'cup' },
        //     { name: 'salmon', quantity: 180, unit: 'g' },
        //     { name: 'peas', quantity: 1, unit: 'cup' },
        // ],
        // [
        //     { name: 'yogurt', quantity: 200, unit: 'g' },
        //     { name: 'granola', quantity: 50, unit: 'g' },
        //     { name: 'strawberries', quantity: 1, unit: 'cup' },
        // ],
        // [
        //     { name: 'tofu', quantity: 200, unit: 'g' },
        //     { name: 'noodles', quantity: 1, unit: 'cup' },
        //     { name: 'soy sauce', quantity: 20, unit: 'ml' },
        // ],
        // [
        //     { name: 'sweet potato', quantity: 200, unit: 'g' },
        //     { name: 'turkey', quantity: 180, unit: 'g' },
        //     { name: 'green beans', quantity: 1, unit: 'cup' },
        // ],
        // [
        //     { name: 'lentils', quantity: 200, unit: 'g' },
        //     { name: 'whole wheat pasta', quantity: 1, unit: 'cup' },
        //     { name: 'tomato sauce', quantity: 150, unit: 'g' },
        // ],
    ];

    const runMealTests = async () => {
        for (let i = 0; i < meals.length; i += 1) {
            const meal = meals[i];
            console.log(`\n--- Meal ${i + 1} ---`);
            console.dir('input args : ');
            console.dir(meal, { depth: null });
            const result = await getMealMacros({ meal_items: meal });
            console.dir(result, { depth: null });
        }
    };

    runMealTests().catch((error) => {
        console.error('Direct run failed:', error);
        process.exitCode = 1;
    });
}

export { getMealMacros };