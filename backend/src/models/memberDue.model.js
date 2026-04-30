import mongoose, { Schema, ObjectId } from "mongoose";
const memberDueSchema = new mongoose.Schema({
  messId: { type: ObjectId, ref: "Mess", required: true },

  member: { type: ObjectId, ref: "Member", required: true },
  expense: { type: ObjectId, ref: "Expense", required: true },

  amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["PENDING", "PAYABLE", "PAID"],
    default: "PENDING"
  }

}, { timestamps: true });
memberDueSchema.index({ member: 1, expense: 1 }, { unique: true });

export const MemberDue = mongoose.model("MemberDue",memberDueSchema)