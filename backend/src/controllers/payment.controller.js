import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Member } from '../models/member.model.js';
import { Mess } from '../models/mess.model.js';
import { MonthlySummary } from '../models/monthlySummary.model.js';
import { RecurringBill } from '../models/bill.model.js';
import { Payment } from '../models/payment.model.js';
import { FundTransaction } from '../models/fundTransaction.model.js';

// INITIATE PAYMENT
const initiatePayment = asyncHandler(async (req, res) => {
  const { amount, method, note } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Valid amount required');
  }

  const payment = await Payment.create({
    messId: req.messId,
    fromUser: req.user._id,
    amount,
    method,
    note,
    status: 'PENDING',
    type: 'FUND',
  });

  return res.json(new ApiResponse(201, payment, 'Payment initiated'));
});

// GET PENDING PAYMENTS
const getPendingPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    messId: req.messId,
    status: 'PENDING',
    type: 'FUND',
  })
    .select('fromUser amount method createdAt')
    .populate('fromUser', 'name email')
    .lean()
    .sort({ createdAt: -1 });

  return res.json(new ApiResponse(200, payments, 'Pending payments'));
});

// CONFIRM PAYMENT (WITH TRANSACTION)
const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔹 1. Get payment
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'PENDING' },
      { status: 'PROCESSING' },
      { new: true, session }
    );

    if (!payment) {
      throw new ApiError(400, 'Invalid or already processed payment');
    }

    const messId = payment.messId;
    const userId = payment.fromUser;

    // 🔹 2. Fetch summary + mess in parallel
    const [summary, mess] = await Promise.all([
      MonthlySummary.findOne({
        messId,
        isLocked: false,
      }).session(session),

      Mess.findById(messId).session(session),
    ]);

    if (!summary) throw new ApiError(400, 'No active summary');
    if (!mess) throw new ApiError(404, 'Mess not found');

    // 🔹 3. Find member inside summary (in-memory)
    const memberIndex = summary.members.findIndex(
      (m) => m.userId.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      throw new ApiError(404, 'Member not in summary');
    }

    const member = summary.members[memberIndex];

    // 🔥 4. UPDATE FUND
    mess.fund.balance += payment.amount;
    mess.fund.totalCollected += payment.amount;

    // 🔥 5. UPDATE SUMMARY (safe math)
    member.paid += payment.amount;

    member.finalDue = Number((member.finalDue - payment.amount).toFixed(2));

    // 🔥 6. LEDGER ENTRY
    await FundTransaction.create(
      [
        {
          mess: mess._id,
          type: 'CREDIT',
          source: 'PAYMENT',
          amount: payment.amount,
          payment: payment._id,
          createdBy: req.user._id,
          title: 'Member payment',
        },
      ],
      { session }
    );

    // 🔹 7. Finalize payment
    payment.status = 'COMPLETED';

    await Promise.all([
      payment.save({ session }),
      mess.save({ session }),
      summary.save({ session }),
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.json(new ApiResponse(200, payment, 'Payment confirmed'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

const getMyPendingPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    messId: req.messId,
    fromUser: req.user._id,
    status: 'PENDING',
  }).sort({ createdAt: -1 });

  return res.json(new ApiResponse(200, payments, 'Your pending payments'));
});
// REJECT PAYMENT
const rejectPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Not found');

  if (payment.status !== 'PENDING') {
    throw new ApiError(400, 'Already processed');
  }

  payment.status = 'REJECTED';
  await payment.save();

  return res.json(new ApiResponse(200, payment, 'Payment rejected'));
});

const refundPayment = asyncHandler(async (req, res) => {
  const { amount, method, note, reference } = req.body;
  const { memberId } = req.params;

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Valid amount required');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [mess, member] = await Promise.all([
      Mess.findById(req.messId).session(session),
      Member.findOne({
        _id: memberId,
        messId: req.messId,
        status: 'approved',
        isActive: true,
      }).session(session),
    ]);

    if (!mess) throw new ApiError(404, 'Mess not found');
    if (!member) throw new ApiError(404, 'Member not found');
    if (mess.fund.balance < amount) {
      throw new ApiError(400, 'Insufficient fund balance');
    }

    if (member.balance < amount) {
      throw new ApiError(400, 'Refund amount exceeds member balance');
    }

    mess.fund.balance -= amount;
    mess.fund.totalRefunded += amount;

    member.balance = Number((member.balance - amount).toFixed(2));

    const payment = await Payment.create(
      {
        messId: req.messId,
        fromUser: member._id,
        amount,
        method,
        note,
        reference,
        status: 'COMPLETED',
        type: 'REFUND',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { session }
    );

    await FundTransaction.create(
      {
        mess: mess._id,
        type: 'DEBIT',
        source: 'PAYMENT',
        amount,
        payment: payment._id,
        title: 'Member refund',
        createdBy: req.user._id,
      },
      { session }
    );

    await Promise.all([
      mess.save({ session }),
      member.save({ session }),
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.json(new ApiResponse(200, payment, 'Refund completed'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

const payVendorRecurringBill = asyncHandler(async (req, res) => {
  const { method = 'cash', note, reference } = req.body;
  const { billId } = req.params;

  const bill = await RecurringBill.findOne({
    _id: billId,
    messId: req.messId,
    isActive: true,
  });

  if (!bill) {
    throw new ApiError(404, 'Recurring bill not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const mess = await Mess.findById(req.messId).session(session);

    if (!mess) {
      throw new ApiError(404, 'Mess not found');
    }

    if (mess.fund.balance < bill.amount) {
      throw new ApiError(400, 'Insufficient fund balance');
    }

    mess.fund.balance -= bill.amount;
    mess.fund.totalSpent += bill.amount;

    const payment = await Payment.create(
      {
        messId: req.messId,
        fromUser: req.user._id,
        amount: bill.amount,
        method,
        note: note || `Vendor payment for ${bill.vendorName}`,
        reference,
        status: 'COMPLETED',
        type: 'VENDOR',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { session }
    );

    await FundTransaction.create(
      {
        mess: mess._id,
        type: 'DEBIT',
        source: 'PAYMENT',
        amount: bill.amount,
        payment: payment._id,
        title: `Vendor payment to ${bill.vendorName}`,
        createdBy: req.user._id,
      },
      { session }
    );

    await mess.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.json(new ApiResponse(200, payment, 'Vendor payment completed'));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export { initiatePayment, getPendingPayments, confirmPayment, rejectPayment, refundPayment, payVendorRecurringBill,getMyPendingPayments };
