import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js"

import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// function for generate access and refresh token 
const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh Tokens");
    }
}

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
    console.log("req : ", req.body);
    const { username, email, password, fullName, gender } = req.body;
    
    //Validate and check required field is not empty
    if (!username || !email || !password || !fullName) {
        console.log("All fields are required..");
        throw new ApiError(400, "All fields are required");
    }
    if (Boolean(username.match(/[A-Z]/))) {
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
    const avatarLocalPath = req.files?.avatar || req.files?.avatar[0]?.path;
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
        // coverImageLocalPath = req.files.coverImage[0].path;
        coverImageLocalPath = req.files.coverImage;
    }
    // upload avatar and cover image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath,process.env.FOLDER_NAME);
    let coverImage = "";
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath,process.env.FOLDER_NAME);
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
        avatar: avatar.secure_url,
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

// Login user functionality
const loginUser = asyncHandler(async (req, res) => {
    // get details from frontend
    // validate details requird
    // find user
    // match password
    // generate acessToken and refresh token
    // set both token in cookie while return response
    
    // get user details from frontend
    // const { username, email, password } = req.body;
    console.log("req ; ", req.body);
    const { username, email, password } = req.body;
    
    // const username = req.body.username;
    // const email = req.body.email;
    // const password = req.body.password;
    console.log("Username : ", username);
    console.log("Email : ", email);
    console.log("Pass : ", password);
    // validate details
    if (!username && !email) {
        console.log("Username or email required");
        throw new ApiError(400, "username or email required for login");
    }
    if (!password) {
        console.log(400, "password required for login");
        throw new ApiError(400, "password reuired for login");
    }
    // find user exist or not
    const user = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (!user) {
        console.log("User does not exist");
        throw new ApiError(400, "User does not exist.");
    }
    // match password
    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
        console.log("Invalid user credentials.(password not match.)");
        throw new ApiError(401, "Invalid user credentials");
    }
    //generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    // get login user data for response without password and refresh token
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    
    // for set cookie create an option with http and secure
    const options = {
        httpOnly: true,
        secure: true
    }

    //return response and set cookie with access token and refresh token
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User Logged In Successfully"
                
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // check user authenticaton
    // delete cookie of refresh token and access token
    // delete refreshToken from database
    // return response
    const userId = req.user._id;
    const updateUser = await User.findByIdAndUpdate(
        userId,
        {
            $unset: { refreshToken: 1 },
        },
        {
            new: true
        }
    );
    if (!updateUser) {
        console.log("Logout not successfull ");
        throw new ApiError(401, "Logout not successfull");
    }
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, null, "User Logout Successfull")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // TODO:
    // find refreshtoken from cookie or body
    // decode this refresh token using jwt
    // find user exists or not
    // match incomming refresh token and user refresh token
    // generate new access and refresh token
    // return and set cookie of this new refresh and access token

    // find refreshtoken from cookie or body
    const incommingRefreshToken = req.cookie?.refreshToken || req.body?.refreshToken;
    if (!incommingRefreshToken) {
        console.log("Invalid refresh token.");
        throw new ApiError(400, "Invalid Refresh token");
    }
    try {
        // verify and decode this refresh token
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        // find user exists or not
        const user = await User.findById(decodedToken._id);
        if (!user) {
            console.log("User not found for this token");
            throw new ApiError(400, "User not found for this token");
        }
        // match refresh token with user refresh token
        if (incommingRefreshToken != user.refreshToken) {
            console.log("refresh Token mismatch");
            throw new ApiError(402, "refresh token mismatched");
        }
        // generate access and refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
        const options = {
            httpOnly: true,
            secure:true
        }
        // return response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "Access token refreshed successfully"
                )
            );
        
    } catch (error) {
        console.log("error in generating refreshAccesstoken",error);
        throw new ApiError(401, "Error in generating refreshAccess token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // TODO
    // find login user
    // get old and new password from body
    // match old password
    // set new password
    // return response successfull
    try {
        const userId = req.user?._id;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            console.log(" old and new passoerd required");
            throw new ApiError(402, "old and new password required");
        }
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found");
            throw new ApiError(400, "User not found");
        }
        const ispasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if (!ispasswordCorrect) {
            console.log("Password mismatched");
            throw new ApiError(401, "Password mismatched");
        }
        user.password = newPassword;
        await user.save(); // check here if error occur because {validateBeforeSave:false} not using here

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Password changed successfully"
                )
            )

    } catch (error) {
        console.log("Error while change password",error);
        throw new ApiError(402, "error while change password");
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // TODO
    // get user from auth
    // check user exists or not
    // return response

    // get user from auth -> req.user
    const user = req.user;
    // check user exists or not
    const checkUserExists = await User.findById(user._id);
    if (!checkUserExists) {
        console.log("User not exists");
        throw new ApiError(400, "User not exists");
    }
    // return respose with user data here not send password and refreshToken
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Current user data fetched successfully")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
};