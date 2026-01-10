import mongoose, { Schema } from "mongoose";

const subscriptionSchmea = new mongoose.Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId, // one who is subscribing
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId, // one to whom he is subscribing
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const  Subscription = mongoose.model("Subscription",subscriptionSchmea);