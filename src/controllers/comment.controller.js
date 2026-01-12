import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // validate the 
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    // caluclate skip
    const skip = (pageNumber-1)*limitNumber

    // fetched content
    const comments= await Comment.findById({
        video:videoId,
    }).sort({createdAt:-1})
    .skip(skip)
    .limit(limitNumber)
    .populate("owner","username avatar")

    // return 
    return res.status(200)
    .json(new ApiResponse(200,comments,"video comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    // get comment
    const {content} = req.body

    // get video to which comment is written
    const {videoId} = req.params

    // validate videoId
    if(!isValidObjectId(videoId) ){
        throw new ApiError(400,"invalid videoId ")
    }

    // validate contnet
    if(! isValidObjectId(content)){
        throw new ApiError(400,"content field are required")

    }

    // crete
    const comment = await Comment.create({
        content,
        onwer: req.user._id,
        video:videoId
    })

    return res.status(200)
    .json(new ApiResponse(200,comment,"comment added successfully "))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // identifes specific comment 
    const {commentId} = req.params

    const {content} = req.body

    // validate
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid commetId ")
    }

    // validate content
    if(!content || !content.trim()){
        throw new ApiError(400,"invalid conentet  ")

    }

    // find comment
    const comment = await Comment.findById(commentId)


    // deos comment present
    if(!comment){
        throw new ApiError(400,"comment required ")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"invalid user ")
    }

    // update comment
    comment.content = content
    await comment.save()

    // retrun 

    return res.status(200)
    .json(new ApiResponse(200,comment,"commnet updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    // comment id
    const {commentId} = req.params
    // conetet or comment writtten
    const {content} = req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid commetId ")
    }

    // validate content
    if(!content || !content.trim()){
        throw new ApiError(400,"invalid conentet  ")
    }

    // find comment
    const comment = await Comment.findById(commentId)


    // deos comment present
    if(!comment){
        throw new ApiError(400,"comment required ")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"invalid user ")
    }

    // delete comment
    await comment.deleteOne() 

    // retrun 
    return res.status(200)
    .json(new ApiResponse(200,comment,"commnet deleted successfully"))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }