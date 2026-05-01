import { Router } from "express";
import { getVisibleMembers,joinedMess,getMyInfo } from "../controllers/member.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireActiveMember } from "../middlewares/member.middleware.js";

const router = Router();
router.route("/allmembers").get(verifyJWT,requireActiveMember,getVisibleMembers)
router.route("/join-mess/:code").put(verifyJWT,joinedMess);
router.route("/info").get(verifyJWT,requireActiveMember,getMyInfo)

export default router;