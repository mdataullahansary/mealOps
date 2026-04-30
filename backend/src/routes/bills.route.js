import { Router } from "express";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireActiveMember } from "../middlewares/member.middleware.js";
import { createRecurringBill,updateRecurringBill,generateMonthlyBills,toggleRecurringBill,getRecurringBills } from "../controllers/bill.controller.js";

const router = Router()

router.route("/recurring-bills").post(verifyJWT,requireActiveMember,createRecurringBill)
router.route("/recurring-bills").get(verifyJWT,requireActiveMember,verifyAdmin,getRecurringBills)
router.route("/recurring-bills/:id").patch(verifyJWT,requireActiveMember,verifyAdmin,updateRecurringBill)
router.route("/bills/generate").post(verifyJWT,requireActiveMember,verifyAdmin,generateMonthlyBills)
//router.route("/bills/:id").patch(verifyJWT,requireActiveMember,verifyAdmin,updateMonthlyBill)
router.route("/recurring-bills/toggle/:id").patch(verifyJWT,requireActiveMember,verifyAdmin,toggleRecurringBill)

export default router;
