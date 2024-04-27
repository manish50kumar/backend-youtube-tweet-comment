import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";


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



export {
    createTweet,
}



