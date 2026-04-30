import mongoose, {Schema} from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mess",
    },
    date: {
      type: Date,
      required: true,
    },
    mealType : {
      type : String,
      enum : ["lunch", "dinner"],
      require : true
    },
    item : {
        type : String,
        require :true
    }
  },
  { timestamps: true }
);

export const Menu = mongoose.model("Menu", menuSchema);