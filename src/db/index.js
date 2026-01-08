import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        const connectionIstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n Mongodb connection !! host:${connectionIstance.connection.host}`)

    } catch (error) {
        console.log("Mongoodb connection error",error);
        process.exit(1);
    }
}

export default connectDB
