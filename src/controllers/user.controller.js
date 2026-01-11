import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // save in database
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return{accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and acceess token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    
    // get user data from fronteend
    // validate the dataa - not empty
    // check if user already exist : username,email
    // check for images,avatar
    // create user object -create entry in db
    // remove password and refresh token from response 
    // check for user creation 
    // return res

    const {fullName,email,username,password} = req.body
    // console.log("email: ",email)

    // vailiadation - we can do this but to lengthy to make it for each field
    // if(fullName===""){
    //     throw new ApiError(400,"fullname is required")
    // }

    // take using array
    if(
        [fullName,email,password,username].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are reqired")
    }

    // vlaidatoin - chcks if any of the value is repeated
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }
    
    const avatarLocalPath=req.files?.avatar[0]?.path
    console.log(req.files)

    // const coverImageLocalPath=req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")

    }

    // now put in databse - after creating databse it will genereate one id=._id 
    // for each field or particular user unnique id is created
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        username:username.toLowerCase(),
        password
    })

    const createdUser  = await User.findById(user._id).select("-password -refreshTokens")

    if(!createdUser){
        throw new Error(500,"Something went wrong during registration")
    }

    // now once all complete
    // return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Register Successfully")
    )
})

const loginUser = asyncHandler(async(req,res)=>{

    // input data frontend
    const {username ,email,password} = req.body;
    console.log("email: ",email)
    // username or email
    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }
    // if(!(username || email)){
    //     throw new ApiError(400,"username or email is required");
    // }
    // find the user
    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User do not exist")
    }
    // password and check - when if user exist check password
    const isPasswordValid =await user.isPasswordCorrect(password)

    // if password is wrong
    if(!isPasswordValid){
        throw new ApiError(401,"Password incorrect")
    }


    // access and refresh token 
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookie
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user:loggedInUser,accessToken,refreshToken
                    },
                    "user login successfully"
                )
            )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user Logged Out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomingRefreshToken){
            throw new ApiError(400,"Unauthorized request")
        }
    
        const decodedToken= jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(400,"invalid refresh token")
        } 
    
        // check krr both refreshtoken in database and enterd by user
        if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(400,"refresh token is expired or used")
    
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} =await generateAccessAndRefreshToken(user._id)
        return res.status(200)
        .cookie("accesToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .josn(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "Access Token refresh token successfulyy"
            )
        ) 
    } catch (error) {
        throw new ApiError(200,"Something went wrong in refreshtoken")
    }

})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body
    // const {oldPassword,newPassword,confPass} = req.body
// if(!(oldPassword === newPassword)) {
// throw new 
// }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect=user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfullyy"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetcehd successfully")
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName,email} = req.body

    if(!(fullName || email)){
        throw new ApiError(400,"all fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email,
            }
    },
    {new:true}).select("-password ")

    return res.status(200)
    .json(
        new ApiResponse(
            200,user,"account details updated"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading file on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar updated successfuly"))

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading file on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"cover Image updated successfuly"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(401,"does not conatined url linked/username is missing")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false,

                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
    ])
    if(!channel?.length){
        throw new eeror(404,"User does not exist")

    }
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel faed successfully"))

    
})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Tyes.ObjectId(req.user._id)

            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",  
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },{

                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]

            }
        },
        {

        }
    ])

    return res.status(200)
    .json(200,user[0].watchHistory,"watch history feteced successfully")



})
 

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}