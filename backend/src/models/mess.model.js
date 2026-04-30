import mongoose ,{Schema} from "mongoose";

const messSchema = new Schema(
    {
    name: {
        type: String,
        required: true,
        trim: true, 
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",    
},
messCode: {
    type: String,
    unique: true,
},
fund: {
    balance: {
      type: Number,
      default: 0
    },

    totalCollected: {
      type: Number,
      default: 0
    },

    totalSpent: {
      type: Number,
      default: 0
    },
    totalRefunded: { 
      type: Number, 
      default: 0
     }
  }

},
 {
    timestamps: true
})

export const Mess = mongoose.model("Mess", messSchema)