import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

// toggle video like
const toggleVideoLike = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get video id from params
    // find if already liked then delete
    // else create a new like 
    // return response
    
    try {
        // get user id from auth
        const userId = req.user?._id;
        // get video id from params
        const videoId = req.params;
        // validate video id
        if (!isValidObjectId(videoId)) {
            console.log("Invalid video id");
            throw new ApiError(400, "Invalid Video Id");
        }
        // check video exist or not
        const videoExist = await Video.findById(videoId);
        if (!videoExist) {
            console.log("Video does not exist");
            throw new ApiError(400, "Video does not exist");
        }
        // if already like on this video then unlike it
        const alreadyLike = await Like.findOneAndDelete({ video: videoId, likedBy: userId });
        if (alreadyLike) {
            //return a response to unlike the video
            return res
                .status(200)
                .json(new ApiResponse(201, null, "Video Unliked successfully"));
        } else {
            //if not found already like on this video create a new like and save it
            const newLike = new Like({ video: videoId, likedBy: userId });
            const saveLike = await newLike.save();
            //return a successfull response to liked
            return res
                .status(200)
                .json(new ApiResponse(201, saveLike, "Video Liked Successfully"));
        }
    } catch (error) {
        console.log("Error while toggling video like");
        throw new ApiError(500, "Error while toggling video like");
    }
});



export {
    toggleVideoLike,
}