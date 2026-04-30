import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler (async (req, res ) => {
 console.log("Health check called")
 return res
 .status(200)
 .json(new ApiResponse (200, 'ok', 'Health Checked Passed'))
}) 

export {healthCheck}