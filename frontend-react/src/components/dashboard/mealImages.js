import breakfast from "../../assets/meals/breakfast.svg";
import lunch from "../../assets/meals/lunch.svg";
import snack from "../../assets/meals/snack.svg";
import dinner from "../../assets/meals/dinner.svg";
import other from "../../assets/meals/other.svg";

const IMAGES = { breakfast, lunch, snack, dinner };
export const mealImage = (type) => IMAGES[String(type).toLowerCase()] ?? other;
