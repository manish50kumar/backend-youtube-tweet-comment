import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";


// create tweet controller functionality
const createTweet = asyncHandler(async (req, res) => {
    //TODO
    // get tweet content from body
    // get user id from auth
    // store in database
    // return response
    try {
        // get user id from auth
        const userId = req.user?._id;
        // get content from body
        const content = req.body;
        // validate content
        if (!content) {
            console.log("Content is required");
            throw new ApiError(400, "Conent is required");
        }
        // create tweet and store in database
        const tweet = await Tweet.create({
            content,
            owner: userId
        })
        if (!tweet) {
            console.log("Something went wrong while create tweet");
            throw new ApiError(401, "Something went wrong while create tweet");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, tweet, "tweet created successfully")
            );
    } catch (error) {
        console.log("Error while create tweet", error.message);
        throw new ApiError(401, "Error while create tweet");
    }
});

//get user tweet functionality
const getUserTweets = asyncHan(async (req, res) => {
    // TODO
    // get user from auth
    // find all user tweet
    // find each tweet like and comment
    // store in single object
    // return response 
    try {
        // get user from auth
        const userId = req.user?._id;
        // get all user tweet
        const userTweets = await Tweet.find({ owner: userId });
        if (userTweets.length == 0) {
            return res.status(200).json(new ApiResponse(200, 0, "User has no any tweet"));
        }

        // initilize object to store number of likes and liked by users for each tweet
        const numberOfLikesOnTweet = {};
        const likedBy = {};
        // initilize object to store number of comment, comment content, comment by(owner of comment)
        const numberOfCommentsOnTweet = {};
        const commentByWithContent = {};
        
        for (const tweet of userTweets) {
            // populate the owner details of each tweet
            await tweet.populate("owner", "fullName");
            // find likes for current tweet
            const likes = await Like.find({ tweet: tweet._id }).populate(
                "likedBy","fullName"
            )
            // store the number of likes and liked by user for current tweet
            numberOfLikesOnTweet[tweet._id] = likes.length;
            likedBy[tweet._id] = likes.map((like) => like.likedBy.fullName);

            // find comment for current user
            const comments = await Comment.find({ tweet: tweet._id }).populate(
                "owner","fullName"
            )
            //store the number of comment , comment by and comment content for current tweet
            numberOfCommentsOnTweet[tweet._id] = comments.length;
            commentByWithContent[tweet._id] = comments.map((comment) => ({
                commentBy: comment.owner.fullName,
                 content: comment.content
            }))
        }

        //create an array to store the tweets with additional information
        const tweetsWithLikesAndComments = tweets.map((tweet) => ({
            ...tweet.toObject(),
            numberOfLikes: numberOfLikesOnTweet[tweet._id],
            likedBy: likedBy[tweet._id],
            numberOfComment: numberOfCommentsOnTweet[tweet._id],
            commentByWithContent: commentByWithContent[tweet._id]
        }));

        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    tweetsWithLikesAndComments,
                    "user tweets fetched successfully")
            );
    } catch (error) {
        console.log("Error while find tweet of this user : ", error.message);
        throw new ApiError(401, "Error while find tweet of this user");
    }
});


export {
    createTweet,
    getUserTweets,
}



