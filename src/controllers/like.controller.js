import mongoose, {connect, isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    
    // validate video id
    if(!isValidObjectId(videoId)){
        throw new ApiResponse(400,"in valid video Id")
    }

    // check if user has already liked the video
    const existingLike = Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })

    // if like - dilike or unlike
    if(existingLike){
        await existingLike.deleteOne()

        return res.status(200)
        .json(new ApiResponse(200,null,"Video unliked successfully"))
    }
    

    // if liked is not then create a liked for the particular
    await Like.create({
        video:videoId,
        likedBy:req.user._id
    })

    return res.status(200)
    .json(new ApiResponse(200,null,"video liked successfully"));


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    // comment id validate
    if(!isValidObjectId(commentId)){
        throw new ApiResponse(400,"in valid video Id")
    }

    // check if already liked
    const existingLike=await Like.findOne({
        comment : commentId,
        likedBy:req.user._id
    })

    if(existingLike){

        // if liked from first ... dislike
        await existingLike.deleteOne()

        return res.status(200)
        .json(200,null,"comment is liked from first")
    }

    // if not like then liked it by creating it
    await Like.create({
        comment:commentId,
        likedBy:req.user._id
    })

    return res.status(200)
    .json(200,null,"comment liked successfully")

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    // vlaidate the tweet id
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"in valid tweet Id")
    }

    // existing like
    const existingLike = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user._id
    })

    if(existingLike){

        // /if liked from first then dislike
        await existingLike.deleteOne()


        return res.status(200)
        .json(200,"tweet liked from first")
    }

    //if not liked from first then liked it by creating it
    await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    })

    return res.status(200)
    .json(200,null,"tweet liked successfully") 


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    // give all the videos that are liked by logged in user 
    // vides fields exist
    const likedVideos = Like.findOne({
        
        likedBy:req.user._id,
        video:{$ne:null}
    }).populate("video")
    .sort({createdAt:-1});


    return res.status(200)
    .json(200,likedVideos,"Liked Vides fetced successfully")


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}