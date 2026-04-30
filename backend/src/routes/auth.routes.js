import { Router } from "express";
import { registerUser, loginUser,logoutUser,deleteUser,updateAccountInfo,getAccountInfo } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);


//secure routes
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/delete").post(verifyJWT, deleteUser);
router.route("/update-account").put(verifyJWT, updateAccountInfo);
router.route("/account-info").get(verifyJWT, getAccountInfo);
export default router;