// controllers/mealController.js
import 'dotenv/config';

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

export { getMealMacros };