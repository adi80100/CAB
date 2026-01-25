import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // conver page to number
    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    // skip 
    const skip = (pageNumber-1)*limitNumber

    // if query exist search
    if(query){
        filter.$or=[
            {title:{$regex:query,$options:"i"}},
            {description:{$regex:query,$options:"i"}}
        ];
    }

    // if userId exist,filter videos by owner
    if(userId && isValidObjectId(userId)){
        filter.owner = userId;
    }

    if(sortBy){
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1
    }
    else{
        sortOptions.createdAt=-1
    }

    // fetch video
    const videos = Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNumber)
    .populate("video","username avatar")


    return res.status(200)
    .json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    // validadate title and description
    if(!title || !description){
        throw new ApiError()
    }
    // extract local path
    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    // check  if they exist
    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError()
    }

    // upload video to cloudinary
    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    // check if they upload on cluoudinary
    if(!videoUpload || thumbnailUpload){
        throw new ApiError()
    }

    // to publish the video 
    const video = await Video.create({
        videoFile:videoUpload.url,
        thumbnail:thumbnailUpload.url,
        title,
        description,
        duration:videoUpload.duration || 0,
        owner:req.user._id
    });

    return res.status(200)
    .json(new ApiResponse(201,video,"video publish or uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError()
    }

    const video  = await Video.findById(videoId)
    .populate("owner","username avatar")
    
    // if video exist
    if(!video){
        throw new ApiError()
    }

    video.views +=1
    await video.save()

    return res.status(200).json(
    new ApiResponse(200, video, "Video fetched successfully")
  );

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError()
    }

    // find video
    const video = await Video.findById(videoId)

    // if video does not exist
    if(!video){
        throw new ApiError()
    }

    // check ownernship
    if(!video.owner.toString()!==req.user._id.toString()){
        throw new ApiError()
    }

    // now  update field
    if(title) video.title = title;
    if(description) video.description = description;

    // if new thumbnail upload 
    if(req.file?.path){
        const thumbnailUpload = await uploadOnCloudinary(req.file.path)
        video.thumbnail = thumbnailUpload.url;
    }

    // save
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // validate the video
    if(!isValidObjectId(videoId)){
        throw new ApiError()
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError()
    }

    // check owner
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError()
    }

    await video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError()
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError()
    }

    // check owner
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError()
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res.status(200).json(
    new ApiResponse(200, video, "Publish status updated")
  );

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}