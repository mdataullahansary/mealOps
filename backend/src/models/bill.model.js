import mongoose, { Schema, ObjectId } from "mongoose";

const recurringBillSchema = new mongoose.Schema({
  messId: { type: ObjectId, ref: "Mess", required: true },

  vendorName: String, // e.g. "Milk Vendor"
  category: {
    type: String,
    enum: ["rent", "gas", "electricity", "misc"]
  },

  amount: Number,

  frequency: {
    type: String,
    enum: ["DAILY", "WEEKLY", "MONTHLY"],
  },

  weekDay: {
    type: Number,
    min: 0,
    max: 6,
  },

  splitType: {
    type: String,
    enum: ["EQUAL", "PERMEAL", "CUSTOM"],
    default: "EQUAL",
  },

  customSplit: [{
    member: ObjectId,
    percentage: Number
  }],

  dueDate: Number,
  startDate: Date,
  endDate: Date,

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const RecurringBill = mongoose.model("RecurringBill",recurringBillSchema)