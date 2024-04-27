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

// toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get comment id from params
    // validate comment id
    // check already like or not 
    // if already like then unlike the comment
    // else create new like and save it
    
    try {
        // get user id
        const userId = req.user?._id;
        // get comment id from params
        const commentId = req.params;
        // validate comment id
        if (!isValidObjectId(commentId)) {
            console.log("Invalid comment id");
            throw new APiError(400, "Invalid comment id");
        }
        // check comment exst or not
        const commentExist = await Comment.findById({ _id: commentId });
        if (!commentExist) {
            console.log("Comment does not found");
            throw new ApiError(400, "Comment not found");
        }
        // check already like or not
        const alreadyLike = await Like.findByIdAndDelete({ comment: commentId, likedBy: userId });
        if (alreadyLike) {
            // if already like thn return a unlike response
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Comment Unlike Successfully"));
        } else {
            // if like not preasent then create a new like and save it
            const newLike = new Like({ comment: commentId, likedBy: userId });
            const saveLike = await newLike.save();
            // return successfull like response
            return res
                .status(201)
                .json(new ApiResponse(201, saveLike, "Comment liked successfully"));
        }
    } catch (error) {
        console.log("Error while toggling comment like", error.message);
        throw new ApiError(500, "Error While toggling comment like");
    }
})

// toggle tweet like
const toggleTweetLike = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get tweet id from params
    // validate tweet id
    // check tweet exist or not
    // check already like or not if yes then unlike it
    // else create new like 

    try {
        // get user id from auth
        const userId = req.user?._id;
        // get tweet id from params
        const tweetId = req.params;
        // validate tweet id
        if (!isValidObjectId(tweetId)) {
            console.log("Invalid tweet id");
            throw new ApiError(400, "Invalid tweet id");
        }
        // check tweet exist or not
        const tweetExist = await Tweet.findById({ _id: tweetId });
        if (!tweetExist) {
            console.log("Tweet does not exist");
            throw new ApiError(400, "Tweet does not exist");
        }
        // check already like or not
        const alreadyLike = await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId });
        if (alreadyLike) {
            // already like then return a unlike response
            return res.status(200).json(new ApiResponse(200, null, "Tweet unliked successfull"));
        } else {
            // already not like
            // then create a new like and save it
            const newLike = new Like({ tweet: tweetId, likedBy: userId });
            const saveLike = await newLike.save();
            // return successfull like response
            return res
                .status(201)
                .json(new ApiResponse(201, saveLike, "Tweet liked successfully"));
        }

    } catch (error) {
        console.log("Error while toggling Tweet like");
        throw new ApiError(500, "Erro while toggling Tweet Like");
    }

});

// get user liked videos
const getUserLikedVideos = asyncHandler(async (req, res) => {
    // TODO
    // get user from auth
    // find all liked video and populate it to find video's owner
    // check if user not like any video then return not liked video response

    try {
        // get user id from auth
        const userId = req.user?._id;
        // find all liked  and populate video for video like
        const likedVideos = await
            Like.find({ likedBy: userId })
                .populate({
                    path: "video", // found only video details of like
                    populate: {
                        path: "owner",
                        select: "username fullName"
                    }
                }).populate({
                    path: "likedBy",
                    select: "username fullName"
                });
        // filtered liked video to store only video 
        const filteredLikedVideos = likedVideos.filter(
            (entry) => entry.video !== null && entry.video !== undefined);  // check here for &&
        
        // find the length if 0 then no any liked video
        if (filteredLikedVideos.length === 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "No Liked Videos Found"));
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponse(200, filteredLikedVideos, "Liked Videos retrived successfully"));
    } catch (error) {
        console.log("Error while get user liked videos");
        throw new ApiError("Error while get user's liked videos");
    }

});

// get user liked comments
const getUserLikedComments = asyncHandler(async (req, res) => {
    // TODO
    // get user from auth
    // find all liked comment and populate it to find comment's owner
    // check if user not like any comment then return not liked comment response

    try {
        // get user id from auth
        const userId = req.user?._id;
        // find all liked  and populate comment for comment like
        const likedComments = await
            Like.find({ likedBy: userId })
                .populate({
                    path: "comment", // found only comment details of like
                    populate: {
                        path: "owner",
                        select: "username fullName"
                    }
                }).populate({
                    path: "likedBy",
                    select: "username fullName"
                });
        // filtered liked comment to store only comment 
        const filteredLikedComments = likedVideos.filter(
            (entry) => entry.comment !== null && entry.comment !== undefined);  // check here for &&

        // find the length if 0 then no any liked comment
        if (filteredLikedComments.length === 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, null, "No Liked Comment Found"));
        }
        // return response
        return res
            .status(200)
            .json(new ApiResponse(200, filteredLikedComments, "Liked Comment retrived successfully"));
    } catch (error) {
        console.log("Error while get user liked comments");
        throw new ApiError("Error while get user's liked comments");
    }

});


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getUserLikedVideos,
    getUserLikedComments,
}