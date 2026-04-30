export const DB_NAME = "mealops"


const MEAL_TYPES = {
  LUNCH: "lunch",
  DINNER: "dinner"
};

const MEAL_CUTOFF = {
  [MEAL_TYPES.LUNCH]: {
    hour: 10,
    minute: 0
  },
  [MEAL_TYPES.DINNER]: {
    hour: 17,
    minute: 0
  }
};

const MEAL_PREFERENCE = {
  ACTIVE: "active",
  PAUSED: "paused"
};
export {
  MEAL_TYPES,
  MEAL_CUTOFF,
  MEAL_PREFERENCE
};