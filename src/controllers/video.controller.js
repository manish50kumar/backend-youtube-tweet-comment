import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { uploadOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";


// get all videos
const getAllVideos = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get page, limit , query, sortBy,sortType from req.query
    // prepare option for pagination
    // prepareing option for filtering
    // perform database query on video for find
    
    // get user id from auth
    const userId = req.user?._id;
    // get page,limit,query,sortBy,sortType from req.query
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
    // prepare option for filtering
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy
            ? { [sortBy]: sortType === "desc" ? -1 : 1 }
            : { createdAt: -1 }
    };
    // prepare condition for filtering
    const conditions = {};
    if (query) {
        // add condition for searching by title,description etc
        conditions.title = { $regex: query, $options: "i" };// case-insensitive search for title
        // add condition for searching for description
        conditions.description = { $regex: query, $options: "i" }; // case-insensiive search for title

    }
    // add user id in conditions
    if (userId) {
        conditions.owner = userId;
    }
    // perform the database query
    const videos = await Video.aggregatePaginate(conditions, options);
    if (!videos) {
        console.log("Error while fetching video from database");
        throw new ApiError(400, "Error while fetching videos for database");
    }
    for (let video of videos.docs) {
        const likes = await Like.find({ video: video._id }).populate("likedBy", "fullName username");
        videos.likes = likes.map((like) => like.likedby);
        // populate owner field
        const owner = await User.findById(video.owner).select("fullName username");
        videos.owner = owner;
    }
    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "All videos fetched successfully")
        );
});

// publish a video
const publishAVideo = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get title , description from body
    // get video and thumbnail and upload on cloudinary
    // create a video database model
    // return response

    // get user id from auth
    const userId = req.user._id;
    // get title and description from body
    const { title, description } = req.body;
    if (!title || !description) {
        console.log("title and description required");
        throw new ApiError(400, "title and description required");
    }

    // get video and thumbnail file local path
    // const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const videoFileLocalPath = req.files?.videoFile;
    const thumbnailLocalPath = req.files?.thumbnail;
    if (!videoFileLocalPath || !thumbnailLocalPath) {
        console.log("video and thumnail paths are required");
        throw new ApiError(400, "video and thumbnail paths are required");
    }
    // upload on cloudinary
    const videoFile = await uploadOnCloudinary(videoFileLocalPath, process.env.FOLDER_NAME);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, process.env.FOLDER_NAME);
    if (!videoFile) {
        throw new ApiError(403, "Error while video upload on cloudinary");
    }
    if (!thumbnail) {
        throw new ApiError(403, "Error while thumbnail upload on cloudinary");
    }
    // find duration on video
    const videoDuration = videoFile.duration;
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoDuration,
        owner: userId
    });
    if (!video) {
        console.log("Error while save data on datadase");
        throw new ApiError("Error while save data on database");
    }
    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video published successfully")
        );

});


// get video by video id
const getVideoById = asyncHandler(async (req, res) => {
    // TODO
    // get userID from auth
    // get video id from params
    // find video like and comment
    // add user watch history
    // increase views number by in video view
    // return response

    // get user id fro auth
    const userId = req.user._id;
    // get video id from params
    const videoId = req.params;
    if (isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id");
    }
    // find video and populate name and username of owner 
    const video = await Video.findById(videoId)
        .populate({
            path: "owner",
            select: "fullName username"
        });
    if (!video) {
        throw new ApiError("Video not found");
    }
    // find like and comment on this video
    const numberOfLikes = await Like.countDocuments({ video: videoId });
    const numberOfComment = await Comment.countDocuments({ video: videoId });

    // update watch history of user
    await User.findByIdAndUpdate(
        userId,
        {
            $addToSet: { watchHistory: videoId }
        },
        { new: true }
    );

    // update video view
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        { new: true }
    );
    // store number of likes and comment with video object
    const videoWithNumberOfLikesAndComments = {
        ...video.toObject(),
        numberOfLikes,
        numberOfComment
    };
    // return response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                videoWithNumberOfLikesAndComments,
                "found video from id successfully")
        );

});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
}