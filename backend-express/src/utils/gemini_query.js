/**
 * Gemini-powered meal macro estimation utility.
 * Converts a meal item list into a prompt, sends it to the Gemini API,
 * and returns the total nutrition and per-ingredient breakdown.
 *
 * Errors are thrown (never returned) and always carry a `statusCode`:
 *   400 - invalid input
 *   429 - Gemini rate limit
 *   500 - server misconfiguration (missing GEMINI_URL / GEMINI_API_KEY)
 *   502 - Gemini unreachable / bad response / unparsable output
 *   504 - Gemini request timed out
 */
import 'dotenv/config';
import { pathToFileURL } from 'node:url';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = process.env.GEMINI_URL;
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 15000;

function createError(message, statusCode, extra = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return Object.assign(error, extra);
}

async function getMealMacros(params) {
    // ---- 1. Validate input (400) ----
    const items = params?.meal_items;
    if (!Array.isArray(items) || items.length === 0) {
        throw createError('At least one meal item is required.', 400);
    }
    if (items.some((i) => !i?.name || i.quantity == null || !i?.unit)) {
        throw createError('Each meal item needs name, quantity and unit.', 400);
    }

    // ---- 2. Validate server config (500) ----
    if (!GEMINI_URL || !GEMINI_API_KEY) {
        throw createError('Gemini is not configured on the server.', 500);
    }

    const prompt = items.map((i) => `${i.name} | ${i.quantity} | ${i.unit}`).join(', ');

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
                            fiber_g: { type: "number" },
                        },
                        required: ["calories_kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"],
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
                                fiber_g: { type: "number" },
                            },
                            required: ["name", "quantity", "calories_kcal", "protein_g", "carbs_g", "fat_g", "fiber_g"],
                        },
                    },
                },
                required: ["meal_name", "total", "ingredients"],
            },
            thinkingConfig: { thinkingBudget: 10 },
        },
    };

    // ---- 3. Call Gemini ----
    let response;
    try {
        response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        });
    } catch (cause) {
        if (cause?.name === 'TimeoutError') {
            throw createError('Gemini API request timed out.', 504, { cause });
        }
        // network-level failure (DNS, connection refused, etc.)
        throw createError('Could not reach the Gemini API.', 502, { cause });
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
            errorData?.error?.message || response.statusText || 'Gemini API request failed.';
        // Don't leak upstream auth/permission codes to our own client.
        throw createError(message, response.status === 429 ? 429 : 502, {
            upstreamStatus: response.status,
        });
    }

    // ---- 4. Parse response ----
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw createError('No content returned from Gemini.', 502);
    }

    try {
        return JSON.parse(rawText);
    } catch {
        throw createError('Failed to parse model output as JSON.', 502, { raw: rawText });
    }
}

/**
 * Direct-run sample test for local debugging.
 * Calls the Gemini API with different meal combinations.
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
        ],
    ];

    const runMealTests = async () => {
        for (const meal of meals) {
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