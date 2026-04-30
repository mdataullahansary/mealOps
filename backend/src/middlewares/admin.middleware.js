import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";

const verifyAdmin = asyncHandler(async(req, _, next) => {
    const user = req.user;  
    if(!user){
        throw new ApiError(401, "Unauthorized: No user information found")
    }   
    if(user.role !== "admin"){
        throw new ApiError(403, "Forbidden: Admin access required")
    }
    next();
})

export { verifyAdmin };