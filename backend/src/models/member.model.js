import mongoose ,{Schema} from "mongoose";
import { Mess } from "./mess.model.js";

const memberSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        messId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mess",
        },

            isAdmin:{
                type: Boolean,
                default: false
            },

        phone : {
            type: String,
            required: true
        },
        
        roleInMess: {
            type: String,
            enum: ["member", "manager"],
            default: "member"
        },
        isActive: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected","removed"],
            default: "pending",
            required : true
        },

        balance: {
            type: Number,
            default: 0
        },
        mealPreference: {
            type : String,
            enum : ["active", "paused"]
        }
    },
    {timestamps: true}
)

export const Member = mongoose.model("Member", memberSchema)