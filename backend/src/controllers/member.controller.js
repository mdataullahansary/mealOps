import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Mess } from '../models/mess.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Member } from '../models/member.model.js';

const generateMessCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const createUniqueMessCode = async () => {
  let uniqueCode;
  let isUnique = false;

  while (!isUnique) {
    uniqueCode = generateMessCode();
    const existingMess = await Mess.findOne({ messCode: uniqueCode });
    if (!existingMess) {
      isUnique = true;
    }
  }

  return uniqueCode;
};

const createMess = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  //console.log('user :', req.user);

  const { messName } = req.body;
  //console.log(messName);
  
  if (!messName) {
    throw new ApiError(400, 'Mess name is required');
  }

  const messCode = await createUniqueMessCode();
  const mess = await Mess.create({
    name: messName,
    messCode,
    createdBy: userId,
  });

 // console.log(messCode);

  await User.findByIdAndUpdate(
    userId,
    { mess: mess._id, role: 'admin', hassMess: true },
    { new: true }
  );

  console.log('user : admin');

  const member = await Member.create({
    userId,
    isAdmin: true,
    messId: mess._id,
    roleInMess: 'member',
    phone: req.user.phoneNumber,
    status: "approved"
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, 'Mess created successfully', { mess, member })
    );
});

const joinedMess = asyncHandler(async (req, res) => {
  const { code } = req.params;
  try {
    const mess = await Mess.findOne({ messCode: code });

    if (!mess) {
      throw new ApiError(404, 'Invalid join code');
    }
     
     
    const user = req.user;
    console.log(user._id);
    
    if (user.messId) {
      throw new ApiError(400, 'Already part of a mess');
    }

    const existing = await Member.findOne({
      userId: user._id,
      messId: mess._id,
    });
     
    if (existing) {
      throw new ApiError(400, 'Already requested or member');
    }
    const member = await Member.create({
      userId: user._id,
      messId: mess._id,
      phone: req.user.phoneNumber,
    });
    return res.json(new ApiResponse(200, member, 'Join request sent'));
  } catch (error) {
    throw new ApiError(404, 'Failed to Joined Mess ');
  }
});

const pendingRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const messId = await Mess.findOne({ createdBy: userId }).select('_id');
  if (!messId) {
    throw new ApiError(404, 'No mess found for the user');
  }

  const requests = await Member.find({
    messId: messId,
    status: 'pending',
  }).select('-password -refreshToken');

  return res
    .status(200)
    .json(
      new ApiResponse(200, 'User requests fetched successfully', { requests })
    );
});

const approveMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      throw ApiError(404, 'Member Not Found');
    }

    member.status = 'approved';
    member.isActive = true;
    await member.save();
    await User.findByIdAndUpdate(member.userId, {
      messId: member.userId,
      hassMess: true,
    });

    return res.status(200).json(new ApiResponse(200, 'Member Approved'));
  } catch (error) {
    throw new ApiError(404, 'Failed to Approve Member');
  }
});

const rejectMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  await Member.findByIdAndUpdate(memberId, {
    status: 'rejected',
    isActive: false,
  });

  return res.status(200).json(new ApiResponse(200, 'Request rejected'));
});

const removedMember = asyncHandler(async (req,res) => {
  const user= req.user
   const {memberId}= req.params;

   const member = await Member.find({
    messId: user.messId,
    _id: memberId
  }).select('-password -refreshToken');
  
  if (member.balance == 0 ) {
      throw ApiError(401, "Clear due or refund before delete")
  } 
  await Member.findByIdAndUpdate(memberId, {
    status: 'removed',
    isActive: false,
  });


})

const getVisibleMembers = asyncHandler(async (req, res) => {

  const user = req.member;
  
  
  if (user.hassMess) {
    throw new ApiError(400, 'Mess ID not found for user');
  }
  const members = await Member.find({
    messId: req.messId,
    status: "approved",
    isActive: true,
  })
    .populate("userId", "fullname email")
    .select("roleInMess");
  const count = members.length;
  return res
    .status(200)
    .json(new ApiResponse(200, { members,count }, 'All members fetched successfully'));
});

const getAllMembers = asyncHandler (async (req,res) => {
  const { status, active } = req.query;

  let messId = req.messId;
  if (!messId) {
    const mess = await Mess.findOne({ createdBy: req.user._id }).select('_id');
    if (!mess) {
      throw new ApiError(404, 'No mess found for the admin');
    }
    messId = mess._id;
  }

  const filter = {
    messId,
  };

  // optional filters
  if (status) {
    filter.status = status; // pending, approved, rejected
  }

  if (active !== undefined) {
    filter.isActive = active === "true";
  }

  const members = await Member.find(filter)
    .populate("userId", "fullname email")
    .sort({ createdAt: -1 })
    .select("phone status");
    const count = members.length;

  return res.json(
    new ApiResponse(200, {members, count}, "All members (admin)")
  );

})

const getMyInfo = asyncHandler (async (req,res ) => {
  
  const memberId = req.member._id;
  const member = await Member.findById(memberId);
  return res
  .status(200)
  .json(new ApiResponse(200, member,"Details fetched"))
})

export { createMess,joinedMess,pendingRequests,approveMember,rejectMember,getAllMembers,getVisibleMembers,removedMember,getMyInfo };
