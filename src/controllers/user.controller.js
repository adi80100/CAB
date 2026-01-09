import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    console.log("email: ",email)

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

    // vlaidatoin
    const existedUser = User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }
    
    const avatarLocalPath=req.files?.avatar[0]?.path
    console.log(req.files)

    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")

    }
    // now put in databse

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

export {registerUser}