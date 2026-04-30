import mongoose from "mongoose";

const monthlySchema = new mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
    },

    month: {
      type: Number, // 1-12
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    totalMeals: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },

    perMealCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        meals: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        paid: { type: Number, default: 0 },
        personalExpense:{ type: Number, default: 0 },
        finalDue: { type: Number, default: 0 },
      },
    ],

    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate month per mess
monthlySchema.index(
  { messId: 1, month: 1, year: 1 },
  { unique: true }
);

export const MonthlySummary = mongoose.model(
  "MonthlySummary",
  monthlySchema
);