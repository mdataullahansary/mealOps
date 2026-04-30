import mongoose, { Schema } from "mongoose";

const expenseSchema = new mongoose.Schema(
{
  messId: {
    type: Schema.Types.ObjectId,
    ref: "Mess",
    required: true,
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  // 🔹 who initially paid (manager case)
  paidBy: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  title: String,
  category: String,

  totalAmount: {
    type: Number,
    required: true,
  },

  expenseDate: Date,
  notes: String,

  // 🔹 Approval system
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  approvedAt: Date,
  rejectionReason: String,


  items: [
    {
      type: Schema.Types.ObjectId,
      ref: "ExpenseItem",
    },
  ],
},
{ timestamps: true }
);

export const Expense = mongoose.model("Expense", expenseSchema);