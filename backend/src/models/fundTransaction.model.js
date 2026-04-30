import {mongoose,Schema} from "mongoose";

const fundTransactionSchema = new mongoose.Schema({
  mess: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: "Mess" 
    },

  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"]
  },

  amount: Number,

  source: {
    type: String,
    enum: ["PAYMENT", "EXPENSE"]
  },

  payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

  title: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Member" }

}, { timestamps: true });

export const FundTransaction = mongoose.model("FundTransaction",fundTransactionSchema)