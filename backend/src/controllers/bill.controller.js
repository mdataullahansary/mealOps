import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { RecurringBill } from '../models/bill.model.js';
import { Member } from '../models/member.model.js';
import { Expense } from '../models/expense.model.js';
import { Mess } from '../models/mess.model.js';


const createRecurringBill = asyncHandler(async (req, res) => {
  const { vendorName, category, amount, frequency, splitType, customSplit, dueDate, weekDay, startDate, endDate } = req.body;

  if (!vendorName || !amount || !frequency) {
    throw new ApiError(400, 'vendorName, amount and frequency are required');
  }

  const bill = await RecurringBill.create({
    messId: req.messId,
    vendorName,
    category,
    amount,
    frequency,
    splitType,
    customSplit,
    dueDate,
    startDate,
    endDate,
  });

  res.status(201).json({
    success: true,
    data: bill
  });
});

const getRecurringBills = asyncHandler(async (req, res) => {
  const bills = await RecurringBill.find({
    mess: req.messId,
    isActive: true
  });

  res.json({
    success: true,
    data: bills
  });
});

const updateRecurringBill = asyncHandler(async (req, res) => {
  const bill = await RecurringBill.findById(req.params.id);

  if (!bill) throw new ApiError("Bill not found");

  Object.assign(bill, req.body);
  await bill.save();

  res.json({
    success: true,
    data: bill
  });
});
const shouldRunToday = (bill, today) => {
  const day = today.getDate();
  const weekDay = today.getDay();

  if (bill.frequency === "DAILY") return true;

  if (bill.frequency === "WEEKLY") {
    return weekDay === bill.weekDay;
  }

  if (bill.frequency === "MONTHLY") {
    return day === bill.dueDate;
  }

  return false;
};
const generateMonthlyBills = asyncHandler(async (req, res) => {
  const today = new Date();
  const messId = req.messId;
  console.log(messId);
  

  try {
    const bills = await RecurringBill.find({ messId, isActive: true });
  
    if (!bills.length) {
      return res.json(new ApiResponse(200, [], "No recurring bills"));
    }
  
    const createdExpenses = [];
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
  
    for (const bill of bills) {
      //if (!shouldRunToday(bill, today)) continue;
  
      const alreadyExists = await Expense.findOne({
        recurringBill: bill._id,
        expenseDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });
  
      if (alreadyExists) continue;
      console.log('I am here');
      
      const members = await Member.find({
        messId: bill.messId,
        isActive: true,
      });
  
      if (!members.length) continue;
  
      const expense = await Expense.create({
        messId: bill.messId,
        recurringBill: bill._id,
        title: bill.vendorName,
        category: bill.category,
        totalAmount: bill.amount,
        expenseDate: today,
      });
  
      let dues = [];
  
      if (bill.splitType === "EQUAL" || bill.splitType === "PERMEAL") {
        const perHead = bill.amount / members.length;
        dues = members.map((m) => ({
          messId: bill.messId,
          member: m._id,
          expense: expense._id,
          amount: perHead,
        }));
      }
  
      if (bill.splitType === "CUSTOM") {
        dues = bill.customSplit.map((cs) => ({
          messId: bill.messId,
          member: cs.member,
          expense: expense._id,
          amount: (bill.amount * cs.percentage) / 100,
        }));
      }
  
      if (dues.length) {
        await MemberDue.insertMany(dues);
      }
  
      createdExpenses.push(expense);
    }
  
    return res.json(new ApiResponse(200, createdExpenses, "Recurring bills processed"));
  } catch (error) {
    throw new ApiError(401, error ,"Failed to generate Bill.")
  }
});
const toggleRecurringBill = asyncHandler(async (req, res) => {
  const bill = await RecurringBill.findOne({
    _id: req.params.id,
    messId: req.messId,
  });

  if (!bill) throw new ApiError("Bill not found");

  bill.isActive = !bill.isActive;
  await bill.save();

  res.json({
    success: true,
    data: bill
  });
});


export {createRecurringBill,updateRecurringBill,generateMonthlyBills,toggleRecurringBill,getRecurringBills}