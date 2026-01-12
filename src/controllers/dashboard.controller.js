import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // get login user
    const channelId = req.user._id

    // count total document
    const totalVideos = await Video.countDocuments({owner:channelId})
    
    // aggreagate total views
    // id has to be null because we want didnot want to group 
    // here we need one final result
    const totalViewResults = await Video.aggregate([
        {
            $match:{
                owner :new mongoose.Types.ObjectId(channelId)
            }
        },{
            $group:{
                _id:null,totalViews:{$sum:"$views"}
            }
        }
    ]);

    const totalViews = totalViewResults[0]?.totalViews || 0;

    const totalSubscribers = await Subscription.countDocuments({channel:channelId})

    // findl all videos
    const channelVideos = Video.find({owner:channelId},{_id:1})
    
    // get only vides ids
    const videoIds = channelVideos.map(video => video._id)

      // Count total likes on all channel videos
    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds }
    });

    // Send all stats as response
    return res.status(200).json(
        new ApiResponse(
        200,
        {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        },
        "Channel stats fetched successfully"
        )
    );

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    // get user - because the channel is created by authehticated user ... which has its own id
    // and thus we directly use req.user._id
    const channelId = req.user._id;

    // get all vides
    const videos = await Video.find({
        owner:channelId
    }).sort({createdAt:-1})

    return res.status(200).
    json(new ApiResponse(
        200,videos,"video fetched successfully"
    ))
})

export {
    getChannelStats, 
    getChannelVideos
    }