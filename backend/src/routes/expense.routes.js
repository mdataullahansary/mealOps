import { Router } from "express";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireActiveMember } from "../middlewares/member.middleware.js";
import {createExpense,getAllExpenses,getPendingExpenses,approveExpense,rejectExpense} from "../controllers/expense.controller.js"

const router = Router ()
router.route("/create").post(verifyJWT,requireActiveMember,createExpense)
router.route("/pending").get(verifyJWT,requireActiveMember,verifyAdmin,getPendingExpenses)
router.route("/:id/approve").patch(verifyJWT,requireActiveMember,verifyAdmin,approveExpense)
router.route("/:id/reject").patch(verifyJWT,requireActiveMember,verifyAdmin,rejectExpense)
router.route("/expanses").get(verifyJWT,requireActiveMember,createExpense)

export default router;
