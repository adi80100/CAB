import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    // validadate
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel Id")
    }

    // donot subscribe to itself
    if(req.user._id.toString() === channelId){
        throw new ApiError(400,"you cannot subscribe yourself")
    }

    // check if already subscribed
    const existingSubscription =  await Subscription.findById({
        subscriber:req.user._id,
        channel:channelId
    })

    if(existingSubscription){

        // unsubscribe
        await existingSubscription.deleteOne()


        return res.status(200)
        .json(new ApiResponse(400,null,"user is unsubscribed"))
    }

    await existingSubscription.create({
        subscriber:req.user._id,
        channel:channelId
    })

        return res.status(200)
        .json(new ApiResponse(400,null,"user or channel is subscribed"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel Id")
    }

    const subscribers = Subscription.findById({
        channel : channelId
    }).populate("subscriber","username avatar")
    .sort({createdAt:-1})

    return res.status(200)
    .json(new ApiResponse(200,subscribers,"list of all the subscribers"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"invalid channel Id")
    }

    const subscribedChannels =await Subscription.findById({
        subscriber:subscriberId
    }).populate("channel","username avatar")
    .sort({createdAt:-1})

    return res.status(200).json(
        new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}