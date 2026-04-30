import { Router } from "express";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireActiveMember } from "../middlewares/member.middleware.js";
import {generateMonthlySummary,finalizeMonthlySummary} from "../controllers/monthly.controller.js"

const router = Router()
router.route("/generate").post(verifyJWT,requireActiveMember,verifyAdmin,generateMonthlySummary)
router.route("/finalize/:summaryId").post(verifyJWT,requireActiveMember,verifyAdmin,finalizeMonthlySummary)
  
export default router