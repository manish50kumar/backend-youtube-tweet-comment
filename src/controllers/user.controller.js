import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js"

import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res, next) => {
    // get user details from backend
    // validate details
    // check user already exits or not
    // upload avatar on cloudinary
    // upload cover image on cloudinary
    // hash the password
    // create an entry on mongoDb
    // save the register details
    // remove password and refresh token from response data

    // get userDetails from frontend
    const [username, email, password, fullName, gender] = req.body;
    
    //Validate and check required field is not empty
    if (!username || !email || !password || !fullName) {
        console.log("All fields are required..");
        throw new ApiError(400, "All fields are required");
    }
    if (!Boolean(username.match(/[A-Z]/))) {
        console.log("In Username uppercase letter exits");
        throw new ApiError(401, "username can not contain uppercase letter");
    }

    // check username or email already exist 
    const UserNameExist = await User.findOne({ username: username });
    if (UserNameExist) {
        console.log("UserName exists Please user another username.");
        throw new ApiError(401, "username already exists please use another username");
    }
    const userEmailExist = await User.findOne({ email: email });
    if (userEmailExist) {
        console.log("Email exists Please user another email.");
        throw new ApiError(401, "Email already exists please use another email");
    }
    // find local path of avatar image on cloudnary
    const avatarLocalPath = req.files?.avatar && req.files?.avater[0]?.path;
    if (!avatarLocalPath) {
        console.log("Avatar image required");
        throw new ApiError(400, "Avatar Image required");
    }
    // find cover image local path
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // upload avatar and cover image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = "";
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }
    if (!avatar) {
        console.log("Avatar Link required . Avatar has not uploaded on cloudinary.");
        throw new ApiError(400, "Avatar link requird. Avatar has not uploaded on cloudinary.");
    }
    // create user for upload on mongoDB model
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,  // this is hash in model pre save functionality
        fullName,
        gender: gender || "",
        avater: avater.secure_url,
        coverImage: coverImage?.secure_url || "",
    });
    if (!user) {
        console.log("User not created");
        throw new ApiError(400, "User not created.");
    }
    // find the created user for response without passord and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        console.log("something went wrong while registering the user");
        throw new ApiError(500, "User not Registered.");
    }
    // send respond of successfull register user

    return res.
        status(200).
        json(new ApiResponse(200, createdUser, "User Registered Successfully"));

});