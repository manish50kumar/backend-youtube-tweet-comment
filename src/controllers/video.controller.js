import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";


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



export {
    getAllVideos,
}