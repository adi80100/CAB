import mongoose, { model } from "mongoose";
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchmea = new mongoose.Schema(
    {
        content:{
            type:String,
            required:true
        },
        video:{
            type:mongoose.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }

    },{
        timestamps:true
    }
)
commentSchmea.plugin(mongooseAggregatePaginate)
export const comment = mongoose.model("Comment",commentSchmea)
