import mongoose from "mongoose";
import { comment } from "./comment.model";

const likeSchema = mongoose.Schema(
    {
        video:{
            type:mongoose.Types.ObjectId,
            ref:"Video"
        },
        comment:{
            type:mongoose.Types.ObjectId,
            ref:"Comment"
        },
        tweet:{
            type:mongoose.Types.ObjectId,
            ref:"Tweet"
        },
        likedBy:{
            type:mongoose.Types.ObjectId,
            ref:"User"
        },
    },
    {
        timestamps:true
    }
)

export const Like = mongoose.model("Like",likeSchema)