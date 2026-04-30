export const calculateMessFinance = ({
  totalExpenses,
  totalMeals,
  members
}) => {
  if (totalMeals === 0) {
    throw new Error("Total meals cannot be zero");
  }

  const costPerMeal = Number((totalExpenses / totalMeals).toFixed(2));

  const memberSummaries = members.map(member => {
    const mealCost = Number((member.mealsTaken * costPerMeal).toFixed(2));

    const adjustedCost = Number(
      (mealCost - (member.personalExpense || 0)).toFixed(2)
    );

    return {
      memberId: member._id,
      mealsTaken: member.mealsTaken,
      mealCost,
      personalExpense: member.personalExpense || 0,
      finalBalance: adjustedCost // 🔥 NO payments here
    };
  });

  return {
    totalExpenses,
    totalMeals,
    costPerMeal,
    members: memberSummaries
  };
};