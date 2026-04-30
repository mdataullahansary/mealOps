import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (filePath) => {
    try {
        if(!filePath) return null;
        const result = await cloudinary.uploader.upload(filePath, { folder: "mealops" });
        console.log("Image uploaded to Cloudinary:", result);
        fs.unlinkSync(filePath);    
        return result.secure_url;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        throw error;
    }
};  

