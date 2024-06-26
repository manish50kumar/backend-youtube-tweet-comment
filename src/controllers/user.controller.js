import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js"

import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { Subscription } from "../models/subscription.model.js";

import { deleteFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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

// fetch all register user
const getAllUser = asyncHandler(async (req, res) => {
    // TODO
    // fetch all register user  from user model without password and refresh token
    try {
        // fetch all user
        const allUser = await User.find().select("-password -refreshToken");
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, allUser, "All user fetch successfully")
            );
    } catch (error) {
        console.log("Error while fetch all user details", error.message);
        throw new ApiError(500, "Error while fetching all user");
    }

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

const updateAccountDetails = asyncHandler(async (req, res) => {
    // TODO
    //get update fiels from body
    // get user from auth
    // update fields
    // return response successfull

    // get user from auth
    const userId = req.user?._id;
    // get data from body
    const { fullName, email, gender } = req.body;
    // validate data
    if (!fullName || !email || !gender) {
        console.log("All fields are required");
        throw new ApiError(402, "All fields are required");
    }
    // find and update data
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                fullName,
                email,
                gender
            }
        },
        { new: true }
    ).selecte("-password");
    // check user update or not 
    if (!user) {
        console.log("Something went wrong while updating details");
        throw new ApiError(500, "Something went wrong whils updating details");
    }
    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Update details successfully")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    //TODO
    // get user from auth
    // get avatar from temporary save using multer public/temp file
    // get avatar link from user
    // delete avatar from cloudinary
    // upload new avatar on cloudinary
    // update avatar link in database
    // return successfull response

    // get user from auth
    const userId = req.user?._id;
    // avatar local file path
    const avatarLocalPath = req.files?.path;
    if (!avatarLocalPath) {
        console.log("Avatar path required");
        throw new ApiError(400, "Avatar file is required");
    }
    // check user exist
    const user = await User.findById(userId);
    if (!user) {
        console.log("User not exists");
        throw new ApiError(400, "User does not exists");
    }
    // get avatar old link
    const avatarLink = user?.avatar;
    // upload new avatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath, process.env.FOLDER_NAME);
    if (!avatar.url) {
        console.log("Error while upload file on cloudinary");
        throw new ApiError(401, "Error while uploading avatar");
    } else {
        // if upload new avatar successfull then delete old avatar from cloudinary
        const isdelete = await deleteFileFromCloudinary(avatarLink, false);
        if (!isdelete) {
            console.log("Error while delete avatar from cloudinary");
            throw new ApiError(401, "Error while delete avatar from cloudinary");
        }
    }
    // update avatar link in database
    const updateUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: avatar?.secure_url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updateUser) {
        console.log('Error while update avatar');
        throw new ApiError(401, "Error while update avatar");
    }
    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, updateUser, "Avatar update sucessfully")
        );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get cover image local file path
    // get old cover image url
    // upload new cover image 
    // delete old cover image 
    // update cover image url in database
    // return response
    
    // get user id from  auth
    const userId = req.user?._id;
    // get new cover image path
    const coverImageLocalPath = req.files?.path;

    // check user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
        console.log("User does not exist");
        throw new ApiError(400, "User does not exist");
    }

    // get old cover image url
    const coverImageUrl = userExists?.coverImage;
    // upload new cover image on cloudinary
    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath, process.env.FOLDER_NAME);
    if (!newCoverImage.url) {
        console.log("Error while upload cover image on cloudinary");
        throw new ApiError(401, "Error while upload cover image on cloudinary");
    } else {
        // delete old cover image from cloudinary
        const isdelete = await deleteFileFromCloudinary(coverImageUrl, false);
        if (!isdelete) {
            console.log("Error while delete old cover image from cloudinary");
            throw new APiError(401, "Error while delete old cover image from cloudinary");
        }
    }
    // update cover image url
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                coverImage: newCoverImage?.secure_url
            }
        },
        { new: true }
    ).select("-password");
    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image update successfully")
        );

});

// get channel details where we are visiting this time 
const getUserChannelProfile = asyncHandler(async (req, res) => {
    // TODO
    // get channel id from params
    // use mongoDB aggregate function for join and find details
    // -> details like
    //1.  total subscriber -> first find then count
    //2. total subscribed channel by this channel -> fist find then count
    //3. name , 4. avatar , 5. cover image , 6. username ,7. email , 
    // 9. check are you subscribed or not? 
    // 10. count total number of videos on this channel
    // return response with detalis and total video 
    
    // get channel id from params
    const channelId = req.params;
    // validate this id, is correct mongodb id or not?
    if (!mongoose.isValidObjectId(channelId)) {
        console.log("channel id invalid");
        throw new ApiError(400, "Invalid channel id");
    }

    // find all data using aggregate
    const channel = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {  // first loockup for finding total subscribers
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        {
            $lookup: { // total subscribed channel by this channel
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            },
        },
        {
            $addFields: { // add sum extra for count total subscriber and total subscribedto
                subscribersCount: {
                    $size: "subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "subscribedTo",
                },
                isSubscribed: { // check current user subscribed this channel or not
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: { // store the field which we need 
                fullName: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                
            },
        },

    ]);

    // check channel details
    if (!channel?.length) {
        console.log("Channel not found");
        throw new ApiError(400,"Channel not found")
    }

    // now find total number of videos of this channel
    const numberOfVideos = await Video.countDocuments({ owner: channelId });

    // store hannel details and number of videos in ine variable
    const cahnnelWithNumberOfVideos = {
        ...channel[0],
        numberOfVideos: numberOfVideos
    };

    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, cahnnelWithNumberOfVideos, "Channel profiles details fetched successfully")
        );

})

const getWatchHistory = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth 
    // using mongo aggregate function find this fields
    // 1. join with videos model and find total video id which is matched by user watchHistory
    // 2. find owner name of videos
    // return response
    
    // get user id from auth
    const userId = req.user?._id;

    // find watch history details
    const userWatchHistory = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [  // here we inside the video model that why we take ref from users
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: { // store details of owner of videos (history)
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: { // store all owner of videos history
                            owner: {
                                $first: "owner"
                            },
                        },
                    },
                ],
            },
        },
    ]);

    // validate watch history
    if (!userWatchHistory) {
        console.log("watch history does not fetch.");
        throw new ApiError(400, "Watch history does not fetch ");
    }
    console.log("watch history : ", userWatchHistory); // check what is fetch in history
    // return reponse
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userWatchHistory[0].watchHistory,
                "watch history data fetched successfully"
            )
        );
});

const getUserDetails = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get all details of user without password and refresh token
    //fetch number of tweets and tweets array
    // fetch number of comment and comment array
    // fetch number of videos uploaded by user and videos array
    // fetch number of playlist and  playlist array created by user
    // fetch number of subscribers
    // fetch channel which is subscribed by user
    // fetch likes on users comment , tweet , videos
    // group likes based on content (comment , tweet , video)
    // constructed the final response with grouped likes
    // prepare response object
    // return response

    // get user id from auth
    const userId = req.user?._id;
    // fetch all details without password and refresh token
    const user = await User.findById(userId).select("-password -refreshToken");
    // validate user
    if (!user) {
        console.log("User does not found");
        throw new ApiError(400, "User does not found");
    }

    // fetch number of tweeets and tweet array
    const tweetsCount = await Tweet.countDocuments({ owner: userId });
    const tweets = await Tweet.find({ owner: userId });

    // fetch number of comment and comment array
    const commentsCount = await Tweet.countDocuments({ owner: userId });
    const comments = await Tweet.find({ owner: userId });

    // fetch number of videos and videos upload by user
    const videosCount = await Video.countDocuments({ owner: userId });
    const videos = await Video.find({ owner: userId });

    // fetch number of playlist and playlist array created by user
    const playlistsCount = await Playlist.countDocuments({ owner: userId });
    const playlists = await Playlist.find({ owner: userId });

    // fetch number of subscribers
    const subscriptions = await Subscription.find({ channel: userId });
    const subscribersCount =  subscriptions.length;

    // fetch channel the user has subscribed to
    const channelsSubscribed = await Subscription.find({ subscriber: userId });

    // fetch like on user's comment , tweet , videos
    const likesOnUserContent = await Like.find({
        $or: [
            { comment: { $in: comments.map((c) => c._id) } },
            { tweet: { $in: tweets.map((t) => t._id) } },
            { video: { $in: videos.map((v) => v._id) } },
        ],
    }).populate({
        path: "comment",
        select: "content owner",
        populate: {
            path: "owner",
            select: "fullName",
        },
    }).populate({
        path: "tweet",
        select: "content owner",
        populate: {
            path: "owner",
            select: "fullName",
        },
    }).populate({
        path: "video",
        select: "title owner",
        populate: {
            path: "owner",
            select: "fullName",
        },
    }).populate(
        "likedBy", "fullName"
    ).select("-_id -__v -createdAt -updatedAt");

    // Group likes based on content (comment , tweets , videos)
    const groupedLikes = {};
    likesOnUserContent.forEach((like) => {
        const contentId =
            like.comment ?
                like.comment._id :
                like.tweet ?
                    like.tweet._id :
                    like.video ?
                        like.video._id :
                        null;
        // check content id
        if (!contentId) {
            return;
        }
        // if no like on this content then initilize empty array
        if (!groupedLikes[contentId]) {
            groupedLikes[contentId] = [];
        }
        // push all likes by on each content (video tweet comment)
        groupedLikes[contentId].push(like.likeBy);
    });

    // construct the final response with grouped likes
    const finalFormattedLikesOnUserContent = Object.entries(groupedLikes).map(
        ([contentId, likedByArray]) => {
            const likeObj = likesOnUserContent.find(
                (like) => {
                    (like.comment && like.comment._id.toString() === contentId) ||
                        (like.tweet && like.tweet._id.toString() === contentId) ||
                        (like.video && like.video._id.toString() === contentId)
                }
            );
            return {
                ...likeObj.toObject(), // convert mongoose object to plain object
                likedBy: likedByArray,
            };
        }
    );

    // prepare the response object 
    const userDetails = {
        user: user,
        comments: {
            count: commentsCount,
            data: comments
        },
        tweets: {
            count: tweetsCount,
            data: tweets,
        },
        videos: {
            count: videosCount,
            data: videos,
        },
        playlists: {
            count: playlistsCount,
            data: playlists,
        },
        subscriptions: {
            subscriber: subscribersCount,
            subscribedTo: channelsSubscribed,
        },
        likesOnUserContent: finalFormattedLikesOnUserContent,
    };

    // return response 
    return res
        .status(200)
        .json(
            new ApiRespone(
                200,
                userDetails,
                "User details fetched successfully"
            )
        );
});

// Remove user 
const removeUser = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // check user exists or not
    // delete all like and comment on tweet and after delete all tweets
    // delete all videos -> for write a function for delete all video related data(comment,like)
    // delete playlist and its related data -> write a function pass all playlist id
    // delete all comment and elated data -> write a functon send all comment id
    // delete all like of this user -> diect deleteMany mangoose model method
    // delete all subscription -> write clean up function for this
    // delete avatar and cover image from cloudinary
    // delete user from database
    // return successfull response

    try {
        //get user from auth
        const userId = req.user?._id;
        // check user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            console.log("User not found");
            throw new ApiError(400, "User not found");
        }

        // delete all likes associated with user's tweets
        const userTweets = await Tweet.find({ owner: userId }, "_id");
        const tweetsIds = userTweets.map((tweet) => tweet._id);
        // delete all like 
        await Like.deleteMany({ tweet: { $in: tweetsIds } });
        // delete all tweet associated with user
        await Tweet.deleteMany({ owner: userId });

        // delete user's videos and related data
        const videos = await Video.find({ owner: userId });
        await deleteVideosAndRelatedData(videos);// function for delete videos and related data

        // delete user's playlist and its related data
        const playlists = await Playlist.find({ owner: userId });
        await deletePlaylistAndRelatedData(playlists);// function for delete playlist and related data

        // delete user's comment and its related data
        const comments = await Comment.find({ owner: userId });
        await deleteCommentAndRelatedData(comments);// function for delete comment and related data

        // delete all like associated with user
        await Like.deleteMany({ likedBy: userId });

        // clean up subscriptions
        await cleanupSubscriptions(userId); // function for delete subscriber and channel which is related by this user

        // delete  user avatar and cover image form cloudinary
        console.log("Avatar Url delete :", userExists.avatar);
        console.log("Cver image Url delete :", userExists.coverImage);
        // delete from cloudinary
        await deleteFileFromCloudinary(userExists.avatar, false);
        await deleteFileFromCloudinary(userExists.coverImage, false);

        // finally delete the user
        await User.findByIdAndDelete(userId);

        // return response
        return res
            .status(200)
            .json(200, null, "User removed successfully");
            
    } catch (error) {
        console.log("Error while removing user", error.message);
        throw new ApiError(402, "Error while removing user");
    }
});

// Helper function for delete video and its related data
async function deleteVideosAndRelatedData(videos) {
    // TODO
    // take all video id 
    // delete all likes of each video
    // extracts all comment and its like
    // delete all comment and comment's likes of each video
    // delete video and thumbnail from cloudinary
    try {
        // Extracts video ids
        const videoIds = videos.map((video) => video._id);

        // delete likes associated with videos
        await Like.deleteMany({ video: { $in: videoIds } });

        // find all comment of video
        const comments = await Comment.find({ video: { $in: videoIds } });
        // extracts comments ids
        const commentIds = comments.map((comment) => comment._id);

        // delete all like associated with comment
        await Like.deleteMany({ comment: { $in: commentIds } });

        // delete the comments
        await Comment.deleteMany({ _id: { $in: commentIds } });

        // delete videos , thumbnail, video link from mongoDB and its related data
        await Promise.all(
            videos.map(async (video) => {
                await deleteFileFromCloudinary(video.videoFile, true);
                await deleteFileFromCloudinary(video.thumbnail, false);
                await Video.findByIdAndDelete(video._id);
            })
        );

    } catch (error) {
        console.log("Error while deleting videos and its related data",error.message);
        throw error;
    }
}

// helper function for delete playlist and its related data
async function deletePlaylistAndRelatedData(playlists) {
    // TODO
    // Extract all playlis ids
    //extract all video
    // delete all video using function deleteVideoAndRelatedData
    // delete playlist

    try {
        // extract all playlist ids
        const playlistIds = playlists.map((playlist) => playlist._id);

        // Retrieve videos associated with the playlists
        const videos = await Video.find({ playlist: { $in: playlistIds } }); // check here if error occer
        // here in video model no any playlist field check here if error occur

        // Delete related data for all videos and delete video
        // Delete related data for each video using Promise.all to ensure all deletions are completed in parallel
        await Promise.all(
            videos.map(async (video) => {
                await deleteVideosAndRelatedData(video);
            })
        );

        // delete the playlist themselves
        await Playlist.deleteMany({ _id: { $in: playlistIds } });

    } catch (error) {
        console.log("Error while deleting playlist and its related data", error.message);
        throw error;
    }
};

// Helper function for delete comment and its related data
async function deleteCommentAndRelatedData(comments) {
    // TODO
    // find comment id
    // delete all like of this comment
    // delete this comment
    
    try {
        // find comment id 
        const commentIds = comments.map((comment)=>comment._id);

        // delete all the like of this comment
        await Like.deleteMany({ comment: {$in:commentIds} });

        // delete comment
        // await Comment.findByIdAndDelete(commentId);
        await Comment.deleteMany({ _id: { $in: commentIds } });
    } catch (error) {
        console.log("Error while delete comment and its related data : ", error.message);
        throw error;
    }
}

// Helper function for cleanup subscription
async function cleanupSubscriptions(userId) {
    // TODO
    // delete all channel subscribe to
    // delete all subscriber 
    
    try {
        // find subscriptions where user is a subscriber and delete them
        await Subscription.deleteMany({ subscriber: userId });

        // find subscription where user is channel owner and delete them
        await Subscription.deleteMany({ channel: userId });
    } catch (error) {
        console.log("Error while clean up subscription : ", error.message);
        throw error;
    }
};

export {
    registerUser,
    loginUser,
    logoutUser,
    getAllUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    getUserDetails,
    removeUser
};