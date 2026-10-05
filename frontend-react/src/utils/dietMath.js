// All diet numbers are computed here with standard formulas. No external API.
//
//  BMI            = weight(kg) / height(m)^2
//  Healthy range  = weight at BMI 18.5 .. 24.9 (midpoint at BMI 22)
//  BMR            = Mifflin-St Jeor: 10*kg + 6.25*cm - 5*age (+5 male, -161 female)
//  Maintenance    = BMR * activity factor
//  Daily calories = maintenance - 500 (lose) or + 300 (gain), never below a safety floor
//  Rate of change = (calories - maintenance) * 7 / 7700 kg per week
//  Protein        = 2.0 g/kg (lose) or 1.8 g/kg (gain) of a reference weight, max 35% of calories
//  Fats           = 25% of calories (9 kcal/g);  Carbs = remaining calories (4 kcal/g)

export const ACTIVITY = [
  { key: "sedentary", label: "Sedentary (little or no exercise)", factor: 1.2 },
  { key: "light", label: "Light (exercise 1-3 days/week)", factor: 1.375 },
  { key: "moderate", label: "Moderate (exercise 3-5 days/week)", factor: 1.55 },
  { key: "active", label: "Very active (exercise 6-7 days/week)", factor: 1.725 },
  { key: "extra", label: "Extra active (physical job or 2x training)", factor: 1.9 },
];

const KCAL_PER_KG = 7700;
const LOSE_DEFICIT = 500;
const GAIN_SURPLUS = 300;
const FLOOR = { male: 1500, female: 1200 };

const r1 = (n) => Math.round(n * 10) / 10;
const weightAtBmi = (b, cm) => b * (cm / 100) ** 2;

export const calcBmi = (kg, cm) => kg / (cm / 100) ** 2;
export const bmiCategory = (b) =>
  b < 18.5 ? "Underweight" : b < 25 ? "Normal" : b < 30 ? "Overweight" : "Obese";

export const calcBmr = ({ sex, weight, height, age }) =>
  10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);

export function buildPlan({ sex, age, height, weight, activity, goal }) {
  const notes = [];
  const bmi = calcBmi(weight, height);
  const range = {
    min: weightAtBmi(18.5, height),
    mid: weightAtBmi(22, height),
    max: weightAtBmi(24.9, height),
  };

  // Suggested target weight
  let target = weight;
  if (goal === "lose") {
    if (weight > range.mid) target = range.mid;
    else notes.push("You are already at or below the middle of the healthy range, so no weight loss is suggested.");
    if (bmi < 18.5) notes.push("Your BMI is in the underweight range. Please talk to a doctor before trying to lose weight.");
  } else {
    if (weight < range.mid) target = range.mid;
    else if (weight < range.max) target = Math.min(weight * 1.05, range.max);
    else notes.push("Your BMI is already at the top of the healthy range or above. Gaining more is only suitable if it is muscle, so check with a professional.");
  }
  const delta = target - weight;

  // Calories
  const factor = ACTIVITY.find((a) => a.key === activity)?.factor ?? 1.2;
  const bmr = calcBmr({ sex, weight, height, age });
  const maintenance = bmr * factor;
  let adjust = Math.abs(delta) < 0.5 ? 0 : goal === "lose" ? -LOSE_DEFICIT : GAIN_SURPLUS;
  let calories = maintenance + adjust;
  const floor = FLOOR[sex];
  if (calories < floor) {
    calories = floor;
    notes.push(`Calories were raised to ${floor} kcal, the minimum generally considered safe without medical supervision.`);
  }
  calories = Math.round(calories);
  const weeklyChange = ((calories - maintenance) * 7) / KCAL_PER_KG; // kg per week, signed
  const weeks = adjust !== 0 && weeklyChange !== 0 && Math.sign(weeklyChange) === Math.sign(delta)
    ? Math.ceil(Math.abs(delta) / Math.abs(weeklyChange))
    : null;

  // Macros
  const refWeight = bmi > 24.9 ? range.max : weight; // avoids oversizing protein for higher BMI
  const perKg = goal === "lose" ? 2.0 : 1.8;
  let protein = Math.min(refWeight * perKg, (calories * 0.35) / 4);
  const fats = (calories * 0.25) / 9;
  const carbs = Math.max(0, (calories - protein * 4 - fats * 9) / 4);

  return {
    bmi: r1(bmi),
    category: bmiCategory(bmi),
    healthyMin: r1(range.min),
    healthyMax: r1(range.max),
    targetWeight: r1(target),
    weightChange: r1(delta),
    weeks,
    weeklyChange: r1(weeklyChange),
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    calories,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
    proteinPerKg: r1(protein / refWeight),
    notes,
  };
}
