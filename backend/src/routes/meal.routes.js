import { Router } from 'express';
import {
createMenu,toggleMeal,skipMeals,resumeMeal,getMyMeals,getAllmeals,getSummery} from '../controllers/meal.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireActiveMember } from '../middlewares/member.middleware.js';

const router = Router();
router.route("/create-menu").post(verifyJWT,requireActiveMember,createMenu)
router.route("/toggle").patch(verifyJWT,requireActiveMember,toggleMeal)
router.route("/resume").patch(verifyJWT,requireActiveMember,resumeMeal)
router.route("/get-my-meals").get(verifyJWT,requireActiveMember,getMyMeals)
router.route("/allmeals").get(verifyJWT,requireActiveMember,getAllmeals)
router.route("/getsummery").get(verifyJWT,requireActiveMember,getSummery)
export default router;
