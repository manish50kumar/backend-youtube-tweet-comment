import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { response } from "express";

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

// getUserplaylist
const getUserplaylists = asyncHandler(async (req, res) => {
    // TODO
    // get user from params
    // find all playlist of this user
    // return response
    try {
        // get user from params
        const userId = req.params;
        if (!isValidObjectId(userId)) {
            throw new ApiError(404, "Invalid User id");
        }
        const playlists = await Playlist({ owner: userId }).populate(
            {
                path: "videos",
                select: "-owner -createdAt -updatedAt -__v"
            }
        );
        if (!playlists) {
            throw new ApiError(404, "Playlists have not found");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, playlists, "Playlists found successfully")
            );
    } catch (error) {
        console.log("Error while finding user's playlist");
        throw new APiError(404, "Error while finding user's playlist");
    }
});

// get laylist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    // TODO
    // get playlist from params
    // find playlist
    // return response

    try {
        // get playlist from params
        const playlistId = req.params;
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist id");
        }
        // find playlist
        const playlist = await Playlist.findById(playlistId).populate(
            {
                path: "videos"
            }
        );
        if (!playlist) {
            throw new APiError(400, "Playlist not found");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, playlist, "Playlist found successfully")
            );
    } catch (error) {
        console.log("Error while find playlist by id");
        throw new ApiResponse("Error while find playlist by id");
    }
});

// add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // TODO
    // get video id , playlist id from params
    // get user id from auth
    // compare playlist owner and userid for authorize
    // check video and playlist exist
    // update playlist to push video id in playlist's videos
    // return response

    try {
        // get user id from auth
        const userId = req.user._id;
        // get video id , playlist id from params
        const { videoId, playlistId } = req.params;
        // validate ids
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video id");
        }
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist id");
        }
        // check playList exist
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(400, "Playlist does not exist");
        }
        if (playlist.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorize to add video in this playlist");
        }
        // check video exist
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(400, "video does not exist");
        }
        // update playlist to push video
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: { videos: videoId }
            },
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiErrro(400, "video is not added in this playlist")
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "video is added in this playlist successfully"
                )
            );

    } catch (error) {
        console.log("Error while add video in this playlist");
        throw new ApiError(400, "Error while add video in this playlist");
    }
});

// remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get video id and playlist id from params
    // match playlist owner and video owner with user for authorize
    // remove video from playlist
    // return response

    try {
        // get user id from auth
        const userId = req.user._id;
        // get video id nad playlist id from params
        const { videoId, playlistId } = req.params;
        if (!isValidObjectId(videoId)) {
            throw new ApiError(404, "Invalid Video id");
        }
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(404, "Invalid Playlist id");
        }
        // playlist exist and owner match
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(400, "playlist not found");
        }
        if (playlist.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You are not authorize to remove video");
        }
        
        // remove video from playlist 
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: { videos: videoId }
            },
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiError(400, "video is not removed from playlist");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedPlaylist,
                    "Video removed successfully"
                )
            );
    } catch (error) {
        console.log("Error while remove video from this playlist");
        throw new ApiError(500, "Error while remving video from playlist");
    }
});

// delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get playlist from params
    // match owner of this playlist with user
    // delete playlist
    // return response

    try {
        // get user id from auth
        const userId = req.user._id;
        // get playlist from params
        const playlistId = req.params;
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid playlist ID");
        }
        // find playlist owner and match
        const playlistOwner = await Playlist.findById(playlistId).select("owner");
        if (!playlistOwner) {
            throw new ApiError(400, "playlist not found");
        }
        // match owner with user
        if (playlistOwner.owner.toString() !== userId.toString()) {
            throw new ApiError(402, "You are authorize to delete playlist");
        }
        // delete playlist
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        if (!deletedPlaylist) {
            throw new ApiError("playlist not deleted");
        }
        // return response
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "playlist delete successfully")
            );
    } catch (error) {
        console.log("Error while delete playlist : ", error.massage);
        throw new ApiError(500, "Error while delete playlist");
    }
});

// update playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    // TODO
    // get user id from auth
    // get playlist id from params
    // get name , description from body
    // match playlist owner with user
    // update details
    // return response

    try {
        // get user id from auth
        const userId = req.user._id;
        // get playlist id from params
        const playlistId = req.params;
        // get new name , description from body
        const { name, description } = req.body;
        // validate playlist id
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid Playlist id");
        }
        // vaildate name & description
        if (!name || !description) {
            throw new ApiError(400, "Name and Description required");
        }
        // find playlist owner and match with user
        const playlist = await Playlist.findById(playlistId).select("owner");
        if (!playlist) {
            throw new ApiError(400, "playlist not found");
        }
        if (playlist.owner.toString() !== userId.toString()) {
            throw new ApiError(402, "You are not authorize to update this playlist");
        }
        // update playlist
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name: name,
                    description: description
                }
            },
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiError(404, "playlist not update");
        }
        // return response
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    updatedPlaylist,
                    "playlist updated successfully"
                )
            );
    } catch (error) {
        console.log("Error while updating playlist: ", error.message);
        throw new ApiError(500, "Error while updating playlist");
    }
});

export {
    createPlaylist,
    getUserplaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

