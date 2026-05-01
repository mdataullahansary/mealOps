import mongoose , {Schema}from "mongoose";

const expenseItemSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
  },

  name: {
    type: String,
    required: true, // e.g. "Onion"
  },

  quantity: {
    type: Number,
    required: true,
  },

  unit: {
    type: String, // kg, litre, packet
  },

  pricePerUnit: {
    type: Number,
  
  },

  totalPrice: {
    type: Number,
    required: true,
  },

  purchasedFrom: {
    type: String, // optional shop name
  },
}, { timestamps: true });
export const ExpenseItem = mongoose.model("ExpenseItem", expenseItemSchema);