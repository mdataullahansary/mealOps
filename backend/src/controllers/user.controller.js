import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import {Mess} from "../models/mess.model.js";
import {ApiResponse} from "../utils/apiResponse.js";
import {ApiError} from "../utils/apiError.js";
import { uploadImage } from "../utils/cloudinary.js";


const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        if(!user) {
            throw new ApiError(404, "User not found")
        }
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
    
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error while generating access and refresh tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, phoneNumber, password} = req.body;

  if (!fullname || !email || !phoneNumber || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }]
  });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  

  // Avatar upload
  const avatarLocalPath = req.file?.path;
  let avatarUrl;

  if (avatarLocalPath) {
    avatarUrl = await uploadImage(avatarLocalPath);
  }

  const user = await User.create({
    fullname,
    email,
    phoneNumber,
    password,
    
  });


  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken");



  return res.status(201).json(
    new ApiResponse(201, "User registered successfully", createdUser)
  );
});

const loginUser = asyncHandler(async(req, res) => {
    const { email, phoneNumber, password } = req.body;
    if(!email || !password){
        throw new ApiError(400, "Email and password are required")  
    }
    const user = await User.findOne({
        $or: [{ email }, { phoneNumber }]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials")
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",  
    }
     return res
     .status(200)
     .cookie("refreshToken", refreshToken, options)
     .cookie("accessToken", accessToken, options)
     .json(new ApiResponse(200, "User logged in successfully", { user: loggedInUser, accessToken }))
})



const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
    { new: true }
)
 const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
 }
    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"))
})


const deleteUser = asyncHandler(async(req, res) => {
    console.log("Delete user controller called for user ID:", req.user._id);
    const result = await User.deleteOne({ _id: req.user._id });
    if (result.deletedCount === 0) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "User deleted successfully"));
});

const updateAccountInfo = asyncHandler(async(req, res) => {
    const { fullname, phoneNumber,email } = req.body;
    const userId = req.user._id;
    const updateData = {};

    if (fullname) updateData.fullname = fullname;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Account information updated successfully", { user }));
});

const getAccountInfo = asyncHandler(async(req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password -refreshToken");
    if(!user){
        throw new ApiError(404, "User not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, "User info fetched successfully", { user }))
})

const updateAvatar = asyncHandler(async(req, res) => {

})
const currentPassword = asyncHandler(async(req, res) => {
    
})
const changePassword = asyncHandler(async(req, res) => {
     
})

export {registerUser, loginUser, logoutUser, deleteUser, updateAccountInfo, getAccountInfo, updateAvatar, currentPassword, changePassword}
