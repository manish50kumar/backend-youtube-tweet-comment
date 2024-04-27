import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { isValidObjectId } from "mongoose";


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

// update tweet 
const updateTweet = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get tweet id from params
    // get update tweet content from body
    // check valid tweet id
    // find owner of tweet and convert it into toString() formet, match with user id (to_string()) formet
    // update the content and save into database
    // return response
    
    // get user id from auth
    const userId = req.user?._id;
    // get tweet id from params
    const tweetId = req.params;
    //get update tweet content from body
    const { updatedContent } = req.body;
    // validate tweet id from mongoose method isValidObjectId
    if (!isValidObjectId(tweetId)) {
        console.log("Invalid tweet id");
        throw new ApiError(404, "Invalid Tweet id");
    }
    // validate content
    if (!updatedContent) {
        console.log("Update tweet content required");
        throw new ApiError(404, "Update tweet content required");
    }
    // find tweet owner
    const tweetOwner = await Tweet.findById(tweetId).select("owner");
    if (!tweetOwner) {
        console.log("Tweet owner ot found");
        throw new ApiError(400, "Tweet Owner not found");
    }
    // match tweet owner id with user id
    if (tweetOwner.owner.toString() !== userId.toString()) {
        console.log("Unauthorized to tweet update, tweet owner and user not match ");
        throw new ApiError(403, "Unauthorized to tweet update");
    }

    try {
        // update tweet content
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: updatedContent
                },
            },
            { new: true }
        );
        if (!updatedTweet) {
            console.log("Tweet not update");
            throw new ApiError(402,"Tweet not update")
        }

        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(201, updatedTweet, "Tweet content updated successfully")
            );

    } catch (error) {
        console.log("Error while update tweet",error.message);
        throw new ApiError(404, "Error while update tweet");
    }    
})

//delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get tweet id from params
    // find owner of tweet and match with convert toString()
    // delete all likes of this tweet
    // delete all comment of this tweet
    // delete tweet
    // return successfull response 
    
    // get user id 
    const userId = req.user?._id;
    // get tweet id
    const tweetId = req.params;
    try {
        // find owner of this tweet
        const tweetOwner = await Tweet.findById(tweetId).select("owner");
        if (!tweetOwner) {
            console.log("Tweet not found");
            throw new ApiError(400, "Tweet not found");
        }
        // match tweet owner with user id
        if (tweetOwner.owner.toString() !== userId.toString()) {
            console.log("Unauthorized to delete tweet");
            throw new ApiError(404, "UnAuthorized to delete tweet");
        }

        // delete all likes of this tweet
        await Like.deleteMany({ tweet: tweetId });

        // delete comments of this tweet
        await Comment.deleteMany({ tweet: tweetId });

        // delete tweet
        const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
        if (!deleteTweet) {
            console.log("tweet not found or delete");
            throw new ApiError(405, "tweet not found or delete");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Tweet delete successfully")
            );
    } catch (error) {
        console.log("Error while delete tweet: ", error.message);
        throw new ApiError(500, "Error while delete tweet");
    }
});

// getAllTweet 
const getAllTweets = asyncHandler(async (req, res) => {
    // TODO
    // Find tweets
    // For each tweet, find its likes and owner information.
    // Create a new structure for each tweet that includes:
    // Tweet content and creation time.
    //  Owner's ID and full name.
    // Number of likes for the tweet.
    // Usernames of users who liked the tweet.
    // Number of comment for the tweet
    // name of users and comment content who comment on the tweet

    try {
        const allTweetWithLikesAndComments = await Tweet.aggregate([
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "likes"
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "comments"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                },
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    owner: {
                        _id: "owner", // rename d to match the owner id in users collection
                        fullName: { $arrayElemAt: ["$ownerDetails.fullName", 0] } // Extract the full name from ownerDetails array
                    },
                    createdAt: 1,
                    likes: {
                        $map: {
                            input: "likes",
                            as: "like",
                            in: "$$like.likedBy"
                        }
                    },
                    comments: {  // we can fetch this in comment controller
                        $map: {
                            input: "comments",
                            as: "comment",
                            in: "$$comments.owner"
                        }
                    },
                    commentsContent: {
                        $map: {
                            input: "comments",
                            as: "commentContent",
                            in: "$$comment.content",
                        },
                    },
                },
               
            },
            {
                $lookup: {
                    from: "users",
                    localField: "likes",
                    foreignField: "_id",
                    as: "likedBy"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "comments",
                    foreignField: "_id",
                    as: "commentBy"
                },
            },
            {
                $proect: {
                    _id: 1,
                    content: 1,
                    owner: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    numberOfLikes: { $size: "likes" },
                    likedBy: {
                        _id: 1,
                        fullName: 1,
                    },
                    numberOfComment: { $size: "comments" },
                    comment: {
                        _id: 1,
                        fullname: 1,
                        content: 1,
                    }
                }
            }
        ]);
        
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    allTweetWithLikesAndComments,
                    "All tweet fetched succeffuly")
            );
    } catch (error) {
        console.log("Error while fetching all tweet", error.message);
        throw new ApiError(500, "Error while fetching All tweet");
    }

});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
}



