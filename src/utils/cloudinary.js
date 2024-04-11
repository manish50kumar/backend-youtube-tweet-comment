import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
    secure:true    
})

// upload image or video
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload file on cloudinary
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type: auto
        })
        // file successful upload on cloud
        console.log("upload file on cloudinary url : ", response.url);

        // delete file from local file
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log("Error in upload data to cloudinary : ", error);
        fs.unlinkSync(localFilePath); // delete file from local file
        return null;
    }
}

