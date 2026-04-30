import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Mess } from '../models/mess.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Member } from '../models/member.model.js';
import { Payment } from '../models/payment.model.js';
import { FundTransaction } from '../models/fundTransaction.model.js';

const addFund = asyncHandler(async (req, res) => {

  const { amount } = req.body;

  const mess = await Mess.findById(req.messId);

  mess.fund.balance += amount;
  mess.fund.totalCollected += amount;

  await mess.save();


  res.json({
    success: true,
    message: "Fund added successfully",
    fund: mess.fund
  });
});

const payFromFund = asyncHandler(async (req, res) => {
  const { amount, title } = req.body;

  const mess = await Mess.findById(req.user.messId);

  if (mess.fund.balance < amount) {
    throw new Error("Insufficient fund balance");
  }
 
  mess.fund.balance -= amount;
  mess.fund.totalSpent += amount;

  await mess.save();

  await FundTransaction.create({
  mess: mess._id,
  type: "DEBIT",
  amount,
  title,
  createdBy: req.user._id
});

  res.json({
    success: true,
    message: `${title} paid successfully`,
    fund: mess.fund
  });
});

export {payFromFund,addFund}