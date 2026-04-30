import { Router } from "express";
import { createMess,pendingRequests,approveMember,rejectMember,getAllMembers,removedMember } from "../controllers/member.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();
router.route("/create-mess").put(verifyJWT, createMess);
router.route("/all-mem").get(verifyJWT,verifyAdmin,getAllMembers)
router.route("/approve-req/:memberId").put(verifyJWT, verifyAdmin,approveMember);
router.route("/reject-req/:memberId").put(verifyJWT, verifyAdmin,rejectMember);
router.route("/remove/:memberId").put(verifyJWT, verifyAdmin,removedMember);


export default router;