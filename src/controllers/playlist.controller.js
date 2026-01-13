import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400,"name and description fields are required")
    }

    // create and save
    const playlist =  await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(200,playlist,"playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    // validate
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid user id")
    }

    const playlists=  await Playlist.findById({
        owner:req.user._id
    }).sort({createdAt:-1})

    return res.status(200)
    .json(new ApiResponse(200,playlists,"playlist fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    // validate
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"user is invalid")
    }

    const playlist = await Playlist.findById(playlistId).populate("video")

    if(!playlist){
        throw new ApiError(400,"playlist does not exist for the id")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist,"playlist fetched for a particular id"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // validadate
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"both fields are required")
    }

    // find playlist
    const playlist =  await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist does not exist")
    }

    // check ownership
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError("User is invaid")
    }

    // check duplicate
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400,"video is already added")
    }

    // add video to the playlist
    playlist.video.push(videoId)
    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(200,playlist,"video is add to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    // validadate 
     if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"both fields are required")
    }

    // find playlist
    const playlist =  await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist does not exist")
    }

    // check ownership
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError("User is invaid")
    }

    // remove video
    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    );

    // Save updated playlist
    await playlist.save();

    // Send response
    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist")
    );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId) ){
        throw new ApiError(400,"playlist are required")
    }

    const playlist = Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    // check. the ownership
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"in valid user")
    }

    // delete
    await playlist.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, playlist, "playlist deleted successyully")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const playlist = Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"playlist not found")
    }

    // check. the ownership
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"in valid user")
    }

    if(name) playlist.name = name
    if(description) playlist.description = description

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "playlist deleted successyully")
    );

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}