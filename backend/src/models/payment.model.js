import mongoose, { Schema, ObjectId } from "mongoose";

const paymentSchema = new mongoose.Schema({
  messId: { type: ObjectId, ref: "Mess", required: true },

  fromUser: { type: ObjectId, ref: "Member" },

  amount: { type: Number, required: true },

  type: {
    type: String,
    enum: ["FUND", "DUES", "VENDOR","REFUND"],
    default: "DUES"
  },

  dueIds: [{
    type: ObjectId,
    ref: "MemberDue"
  }],

  method: {
    type: String,
    enum: ["cash", "upi"],
    default: "cash"
  },

  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"],
    default: "PENDING"
  },

  screenshot: String,
  reference: String,

  approvedBy: { type: ObjectId, ref: "Member" },
  approvedAt: Date

}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);