import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    // api_key: process.env.CLOUDINARY_API_KEY,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_NAME,
    
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
    secure:true    
})

// upload image or video
const uploadOnCloudinary = async (localFilePath,folder) => {
    console.log("Local Path  : ", localFilePath)
    const path = localFilePath[0]?.path;
    try {     

        if (!localFilePath) return null;
        let options = { folder };
        options.resource_type = "auto";
        
        
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(path, options);
        // file successful upload on cloud
        console.log("upload file on cloudinary url : ", response.url);

        // delete file from local file
        fs.unlinkSync(path);
        return response;

    } catch (error) {
        console.log("Error in upload file to cloudinary : ", error);
        fs.unlinkSync(path); // delete file from local file
        return null;
    }
}

const deleteFileFromCloudinary = async (url,isVideo) => {
    try {
        if (!url) {
            console.log("Url is compulsory for delete a file from cloudinary.");
            return;
        } 
        // find public id from the url it is a name of file
        const public_Id = url.split('/').pop().split('.')[0];
        // check resource type
        const resourceType = isVideo ? 'video' : 'image';
        // delete from cloudinary
        await cloudinary.uploader.destroy(public_Id, {
            resource_type: resourceType
        });
        // successfull delete file from cloudinary
        console.log(`File delete from cloudinary it's url ${url}`);
    } catch (error) {
        console.log("Error while upload file on cloudinary : ", error.message);
        return;
    }
}


export {uploadOnCloudinary,deleteFileFromCloudinary}
