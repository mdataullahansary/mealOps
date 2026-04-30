import mongoose, { Schema } from "mongoose";

const mealSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    messId: {
      type: Schema.Types.ObjectId,
      ref: "Mess",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },

    lunch: {
      type: Boolean,
      default: false,
    },

    dinner: {
      type: Boolean,
      default: false,
    },

    override: {
      type: Boolean,
      default: false, // user manually changed
    }
  },
  { timestamps: true }
);
mealSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Meal = mongoose.model("Meal", mealSchema)