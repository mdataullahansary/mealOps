import { MEAL_CUTOFF } from "../constants.js"

const isAfterCutoff = (mealType, date) => {
  const now = new Date();
  const mealDate = new Date(date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());

  // future → allowed
  if (target > today) return false;

  // past → locked
  if (target < today) return true;

  // same day → check cutoff
  const cutoffConfig = MEAL_CUTOFF[mealType];

  const cutoff = new Date();
  cutoff.setHours(cutoffConfig.hour);
  cutoff.setMinutes(cutoffConfig.minute);
  cutoff.setSeconds(0);

  return now > cutoff;
};

export {isAfterCutoff}