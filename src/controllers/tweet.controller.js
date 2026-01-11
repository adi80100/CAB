
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import  ApiError  from "../utils/apiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // take or extracct content
    const {content} = req.body

    // validate content and remove white spacess
    if(!content || !content.trim()){
        throw new ApiError(400,"Tweet content is required")
    }

    // create and store content is mongodb
    const tweet = await Tweet.create({
        content,
        owner : req.user._id
    })

    // return success response
    return res.status(200)
    .json(200,tweet,"Tweet created successfuly")


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // get user id
    const {userId} = req.params

    // validate mongodb objectId
    if(!isValidObjectId(userId)){
        throw new ApiError(200,"Invalid user id ")
    }

    // fetch or get all the tweets and sort for latest tweet
    const tweets = await Tweet.find({owner:userId}).sort({createdAt:-1})

    return res.status(200)
    .json(new ApiResponse(200,tweets,"User tweet fetched successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    // extract tweet
    const {tweetId} = req.params

    // extract or get content
    const {content} = req.body

    // validate tweetId check if it is valid tweet id
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }

    // validate content
    if(!content || !content.trim()){
                throw new ApiError(400,"Tweet content is requried")

    }

    // find tweet by id
    const tweet = await Tweet.findById(tweetId)

    // if tweet does not exts throw error
    if(!tweet) {
        throw new ApiError(400,"Tweet not found")
    }

    // those who created it can only update it
    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"Invlaid user , you are not allowed to change the content")
    }

    // update conent
    tweet.content = content
    await tweet.save()

    return res.status(200)
    .json(new ApiResponse(200,tweet,"tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    // get tweet ID
    const {tweetId} = req.params

    // validate tweet ID
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is inValid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"tweet not found for the particular user")
    }

    // only the creattor could delte the tweet
    if(tweet.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"YOu are not allowed to change the content")
    }

    // delete the conetent across it
    await tweet.deleteOne()

    // return 
    return res.status(400)
    .json(new ApiResponse(200,null,"tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
