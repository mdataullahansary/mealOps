import { Router } from "express";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireActiveMember } from "../middlewares/member.middleware.js";
import { initiatePayment, confirmPayment, getPendingPayments, getMyPendingPayments, rejectPayment, refundPayment, payVendorRecurringBill } from "../controllers/payment.controller.js";
import { payFromFund } from "../controllers/mess.controller.js";

const router = Router();
router.route("/initiate/:memberId").post(verifyJWT, requireActiveMember, initiatePayment);
router.route("/pending").get(verifyJWT, requireActiveMember, verifyAdmin, getPendingPayments);
router.route("/my-pending").get(verifyJWT, requireActiveMember, getMyPendingPayments);
router.route("/confirm/:paymentId").post(verifyJWT, requireActiveMember, confirmPayment);
router.route("/reject/:paymentId").post(verifyJWT, requireActiveMember, rejectPayment);
router.route("/refund/:memberId").post(verifyJWT, requireActiveMember, verifyAdmin, refundPayment);
router.route("/vendor/:billId/pay").post(verifyJWT, requireActiveMember, verifyAdmin, payVendorRecurringBill);
router.route("/pay-from-fund").post(verifyJWT, requireActiveMember, verifyAdmin, payFromFund);

export default router;