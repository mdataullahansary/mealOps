import mongoose , {Schema}from "mongoose";
import {hash, compare} from "bcrypt";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true, 
        trim : true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    avatar: {
        type: String,
        default: "https://res.cloudinary.com/dgzycz5gj/image/upload/v1700000000/mealops/default-avatar.png"
    },
    password: {
        type: String,
        required: true  
        },

    role: {
        type: String,
        enum: ["member", "admin"],
        default: "member"
    },

    hassMess :{
        type : Boolean,
        default : false     
    },
    
        refreshToken: {
            type: String,
        }

},
 {
    timestamps: true
}
)

userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        return;
    }   
    this.password = await hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({ userId: this._id,
         role: this.role,
            fullname: this.fullname,
            email: this.email,
            phoneNumber: this.phoneNumber
         }, 
         process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
}

userSchema.methods.generateRefreshToken = function(){
    const refreshToken = jwt.sign({ userId: this._id }, 
        process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
    
    return refreshToken;
}

export const User = mongoose.model("User", userSchema)

