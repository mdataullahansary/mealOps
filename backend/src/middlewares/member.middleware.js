import { Member } from "../models/member.model.js";
import { ApiError } from "../utils/apiError.js";


export const requireActiveMember = async (req, _, next) => {
  const user = req.user
  console.log('Verifying Active member..');
  
  
  
  // if(!user.hasMess) {
  //   throw ApiError(401, "You not part of any Mess")
  // }
  const member = await Member.findOne({
    userId: req.user._id,
     status: 'approved',
     isActive: true,
  });
   
  if (!member) {
    throw new ApiError(403, "Not approved in mess");
  }

  req.member = member
  req.messId = member.messId

  next();
};