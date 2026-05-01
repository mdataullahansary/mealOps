import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Mess } from '../models/mess.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Member } from '../models/member.model.js';
import { Menu } from '../models/menu.model.js';
import { Meal } from '../models/meal.model.js';
import { isAfterCutoff } from '../utils/meal.utils.js';
import{MEAL_TYPES} from "../constants.js"

const createMenu = asyncHandler(async (req, res) => {
  const { date, mealType, items } = req.body;
  const messId = req.messId;

  // prevent duplicate
  try {
    const exists = await Menu.findOne({ messId, date, mealType });
    if (exists) return res.status(400).json({ msg: "Menu already exists" });
  
    const menu = await Menu.create({
      messId,
      date,
      mealType,
      items,
      createdBy: req.member._id
    });
  
    const members = await Member.find({ messId, status: "approved" });
  
    for (let m of members) {
      let meal = await Meal.findOne({ userId: m._id, date });
  
      if (!meal) {
        meal = await Meal.create({
          userId: m._id,
          messId,
          date,
          lunch: false,
          dinner: false
        });
      }
  
      // 🔥 apply global preference
      if (m.mealPreference === "paused") {
        meal[mealType] = false;
      } else {
        meal[mealType] = true;
      }
  
      await meal.save();
    }
  
  
    res.status(200).json(new ApiResponse(200, menu, 'Menu was created'));
  } catch (error) {
    throw new ApiError(401,"Failed to create menu")
  }
});

const toggleMeal = asyncHandler(async (req, res) => {
  const { date, mealType, status, mode } = req.body;

 if(isAfterCutoff(mealType,date)) {
  
  
  return res.status(400).json(new ApiResponse(200, "Time exceed"))
 }

 if (mode === "continuous") {
    const member = await Member.findOneAndUpdate(
      { userId: req.member._id },
      { mealPreference: status ? "active" : "paused" }
    );
    return res.status(400).json(new ApiResponse(200, "Meal preference updated"))
  }

  let meal = await Meal.findOne({
    userId: req.member._id,
    date
  });

  if (!meal) {
    meal = await Meal.create({
      userId: req.member._id,
      messId: req.messId,
      date,
    });


    if(mealType == "lunch") {
   meal.lunch = !meal.lunch
 }

 if(mealType == "dinner") {
   meal.dinner = !meal.dinner
   meal.lunch = !meal.lunch
 }
  }
 if(mealType == "lunch") {
   meal.lunch = !meal.lunch
 }

 if(mealType == "dinner") {
   meal.dinner = !meal.dinner
 }
 
  meal.override = true;

  await meal.save();

  res
  .status(200)
  .json(new ApiResponse(200,meal, `Meal Updated : ${mealType} - ${status}`))




});

const resumeMeal = asyncHandler(async(req,res) => {
  await Member.findOneAndUpdate(
    { userId: req.member._id },
    { mealPreference: "active" }
  );

  res
  .status(200)
  .json(new ApiResponse(200, "Meals Updated"))
})
const skipMeals = asyncHandler(async (req, res) => {

});
const getMyMeals = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
 if(!startDate && !endDate) {
  throw ApiError (401, "Start date and End Dates are required")
 }
  const meals = await Meal.find({
    userId: req.member._id,
    date: { $gte: startDate, $lte: endDate }
  });

  res
  .status(200)
  .json(new ApiResponse(200, meals , "Meals fatch successfully"))
});

const getAllmeals = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const meals = await Meal.find({
    messId: req.messId,
    date
  }).select("lunch dinner")
  .populate({path:"userId", select:"roleInMess",
    populate : 
      {path:"userId",
      select : "fullname"
    }
  });

  
   let lunch = 0, dinner = 0;
 
   meals.forEach(m => {
     if (m.lunch) lunch++;
     if (m.dinner) dinner++;
   });

  res
  .status(200)
  .json(new ApiResponse(200, {meals,
    totalLunch: lunch,
     totalDinner: dinner,
     totalMeals: lunch + dinner },
     "Fetch Successfully"));
});

const getSummery = asyncHandler(async (req, res) => {
 try {
  const { startDate, endDate } = req.query;
 
   const meals = await Meal.find({
     messId: req.messId,
     date: { $gte: startDate, $lte: endDate }
   });
 
   let lunch = 0, dinner = 0;
 
   meals.forEach(m => {
     if (m.lunch) lunch++;
     if (m.dinner) dinner++;
   });
 
   res
   .status(200)
   .json(new ApiResponse(200,
     {totalLunch: lunch,
     totalDinner: dinner,
     totalMeals: lunch + dinner},
     "Total Meals"
   ))
 } catch (error) {
  throw new ApiError(404, "Failed to get meals")
 }
});

export {
  createMenu,
  toggleMeal,
  skipMeals,
  resumeMeal,
  getMyMeals,
  getAllmeals,
  getSummery,
};
