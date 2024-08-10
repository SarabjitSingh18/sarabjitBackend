import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"; //importing essentials

//how to connect mongoose to mongodb-->
const connectDB  = async ()=>{
    try {
     const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
     //console.log(connectionInstance)
     console.log(`\n MONGODB CONNECTED SUCCESSFULLY :: DB HOST : ${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.log(`Mongodb connection Failed devSarv`,error);
        process.exit(1)// this is a node functionality to deal with current error failure
        
    }
}


export default connectDB;