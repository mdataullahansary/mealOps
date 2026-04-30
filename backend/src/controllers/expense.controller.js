import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Expense } from "../models/expense.model.js";
import { ExpenseItem } from "../models/expenseItem.model.js";

  const createExpense = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { title, category, expenseDate, notes, items } = req.body;

    if (!items?.length) {
      throw new ApiError(400, "Items required");
    }

    let totalAmount = 0;

    // Create empty expense first
    const [expense] = await Expense.create(
      [{
        messId: req.user.messId,
        createdBy: req.user._id,
        title,
        category,
        expenseDate,
        notes,
        totalAmount: 0,
        status: "pending",
      }],
      { session }
    );

    const itemsData = items.map(item => {
      const totalPrice = item.quantity * item.pricePerUnit;
      totalAmount += totalPrice;

      return {
        expenseId: expense._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        totalPrice,
      };
    });

    const createdItems = await ExpenseItem.insertMany(itemsData, { session });

    // Update expense
    expense.totalAmount = totalAmount;
    expense.items = createdItems.map(i => i._id);

    await expense.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(201, expense, "Expense created successfully")
    );

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

 const getPendingExpenses = asyncHandler(async (req, res) => {
  const messId = req.messId;

  const expenses = await Expense.find({
    messId,
    status: "pending",
  })
    .populate("createdBy", "name email")
    .populate("items")
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, expenses, "Pending expenses fetched")
  );
});

const approveExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await Expense.findById(id);

  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  if (expense.status !== "pending") {
    throw new ApiError(400, "Expense already processed");
  }

  // Optional: check admin belongs to same mess
  if (expense.messId.toString() !== req.messId.toString()) {
    throw new ApiError(403, "Not authorized for this mess");
  }

  expense.status = "approved";
  expense.approvedBy = req.user._id;
  expense.approvedAt = new Date();

  await expense.save();

  return res.json(
    new ApiResponse(200, expense, "Expense approved")
  );
});


 const rejectExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const expense = await Expense.findById(id);

  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  if (expense.status !== "pending") {
    throw new ApiError(400, "Expense already processed");
  }

  if (expense.messId.toString() !== req.messId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  expense.status = "rejected";
  expense.rejectionReason = reason || "No reason provided";

  await expense.save();

  return res.json(
    new ApiResponse(200, expense, "Expense rejected")
  );
});

const getAllExpenses = asyncHandler(async (req, res) => {
  const messId = req.messId;

  const { status, startDate, endDate, category } = req.query;

  const filter = { messId };

  if (status) {
    filter.status = status; // pending / approved / rejected
  }

  if (category) {
    filter.category = category;
  }

  if (startDate && endDate) {
    filter.expenseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const expenses = await Expense.find(filter)
    .populate("createdBy", "name")
    .populate("approvedBy", "name")
    .populate("items")
    .sort({ expenseDate: -1 });

  return res.json(
    new ApiResponse(200, expenses, "Expenses fetched")
  );
});

export {createExpense,getAllExpenses,getPendingExpenses,approveExpense,rejectExpense}