import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Meal } from "../models/meal.model.js";
import { Expense } from "../models/expense.model.js";
import { MonthlySummary } from "../models/monthlySummary.model.js";
import { Member } from "../models/member.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import {calculateMessFinance} from "../utils/financeEngine.js"


//GENERATE SUMMARY
const generateMonthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const messId = req.messId;

  const existing = await MonthlySummary.findOne({ messId, month, year });
  if (existing) throw new ApiError(400, "Summary already exists");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // 🔹 1. MEALS (single query)
  const mealsAgg = await Meal.aggregate([
    {
      $match: {
        messId: new mongoose.Types.ObjectId(messId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$userId",
        totalMeals: { $sum: "$count" }
      }
    }
  ]);

  let totalMeals = 0;
  const mealMap = {};

  mealsAgg.forEach(m => {
    mealMap[m._id.toString()] = m.totalMeals;
    totalMeals += m.totalMeals;
  });

  if (!totalMeals) throw new ApiError(400, "No meals found");

  // 🔥 2. EXPENSES (ONE POWERFUL QUERY)
  const expenseAgg = await Expense.aggregate([
    {
      $match: {
        messId: new mongoose.Types.ObjectId(messId),
        status: "approved",
        expenseDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $facet: {
        total: [
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ],
        byUser: [
          {
            $group: {
              _id: "$paidBy",
              total: { $sum: "$totalAmount" }
            }
          }
        ]
      }
    }
  ]);

  const totalExpenses = expenseAgg[0].total[0]?.total || 0;

  const expenseMap = {};
  expenseAgg[0].byUser.forEach(e => {
    expenseMap[e._id.toString()] = e.total;
  });

  // 🔹 3. MEMBERS (single query)
  const members = await Member.find({ messId }).select("userId");

  // 🔹 PREPARE ENGINE INPUT
  const memberData = members.map(member => ({
    _id: member.userId,
    mealsTaken: mealMap[member.userId.toString()] || 0,
    personalExpense: expenseMap[member.userId.toString()] || 0
  }));

  // 🔥 FINANCE ENGINE
  const result = calculateMessFinance({
    totalExpenses,
    totalMeals,
    members: memberData
  });

  // 🔹 SAVE
  const summary = await MonthlySummary.create({
    messId,
    month,
    year,
    totalMeals: result.totalMeals,
    totalExpenses: result.totalExpenses,
    perMealCost: result.costPerMeal,
    members: result.members.map(m => ({
      userId: m.memberId,
      meals: m.mealsTaken,
      amount: m.mealCost,
      personalExpense: m.personalExpense,
      paid: 0,
      finalDue: m.finalBalance
    })),
    isLocked: false
  });

  return res.status(201).json(
    new ApiResponse(201, summary, "Monthly summary generated")
  );
});

// FINALIZE SUMMARY (TRANSACTION SAFE)
const finalizeMonthlySummary = asyncHandler(async (req, res) => {
  const { summaryId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const summary = await MonthlySummary.findById(summaryId).session(session);

    if (!summary) throw new ApiError(404, "Not found");
    if (summary.isLocked) throw new ApiError(400, "Already finalized");

    for (const m of summary.members) {
      const member = await Member.findOne(
        { userId: m.userId, messId: summary.messId },
        null,
        { session }
      );

      if (!member) continue;

      member.balance = Number(
        ((member.balance || 0) + m.finalDue).toFixed(2)
      );

      await member.save({ session });
    }

    summary.isLocked = true;
    await summary.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(
      new ApiResponse(200, summary, "Month finalized")
    );

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});


//GET SUMMARY
const getMonthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const messId = req.messId;

  const summary = await MonthlySummary.findOne({
    messId,
    month,
    year,
  }).populate("members.userId", "name email");

  if (!summary) throw new ApiError(404, "Not found");

  return res.json(new ApiResponse(200, summary));
});


// SETTLEMENT (OPTIMIZED)

export {generateMonthlySummary,finalizeMonthlySummary,getMonthlySummary}