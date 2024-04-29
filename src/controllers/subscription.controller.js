import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get channel id from params
    // check user id and channel owner id , it shound not match
    // check already subscribed then unsubscribed
    // else create a new entry and subscribed it

    // get user id from auth
    const userId = req.user._id;
    // get channel id from params
    const channelId = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel id");
    }
    // check user id not equal to channel id
    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You can not subscribe your own channel");
    }
    try {
        // check already subscribe or not
        const alreadySubscribed = await Subscription.find({
            channel: channelId, subscriber: userId
        });
        if (alreadySubscribed) {
            // unsubscribed the channel
            await Subscription.findOneAndDelete({
                channel: channelId, subscriber: userId
            });
            // return unsubscribed response
            return res
                .status(200)
                .json(
                    new ApiResponse(200, null, "Channel Unsubscribed")
                );
        } else {
            // create a new entry and subscribe channel
            const subscribe = await Subscription.create({
                subscriber: userId,
                channel: channelId
            });
            // return response subscribed
            return res
                .status(200)
                .json(new ApiResponse(200, subscribe, "Channel Subscribed"));
        }
    } catch (error) {
        console.log("Error while toggling the channel subscription", error);
        throw new ApiError(500, "Error while toggling channel subscription");
    }
});


export {
    toggleSubscription,
}

