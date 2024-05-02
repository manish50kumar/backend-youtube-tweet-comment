import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// create playList
const createPlaylist = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // name and description from body
    // check already playlist exist in this user
    // return response

    // get user from auth
    const userId = req.user._id;
    // get name and description from body
    const { name, description } = req.body;
    // validate name , description
    if (!name || !description) {
        console.log("All fields are required");
        throw new ApiError(400, "All fields are required");
    }
    const playlistExist = await Playlist.find({ name: name, owner: userId });
    if (playlistExist) {
        console.log("playlist already exists");
        throw new ApiError(402, "Playlist already exists");
    }
    try {
        // create new playlist
        const newPlaylist = await Playlist.create({
            name: name,
            description: description,
            owner: userId
        });
        if (!newPlaylist) {
            console.log("new playlist has not created");
            throw new ApiError(400, "new playlist has not created");
        }
        // response 
        return res
            .status(200)
            .json(
                new ApiResponse(200, newPlaylist, "Playlist created successfully")
            );
    } catch (error) {
        console.log("Error while create playlist");
        throw new ApiError("Error while creating playlist");
    }
});




export {
    createPlaylist,
}

