//require('dotenv').config({path:"./env"}) //but this line breaks our consistency but it gives no error
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo Connection Error :::",err)

})


//THIS THE FIRST APPROACH TO CONNECT MONGODB WHICH IS VERY GOOD BUT WE HAVE A BETTER APPROACH (PRODUCTION GRADE)-->

// import express from "express"
// const app = express()
// ;(async()=>{
//     try {
//     await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",(err)=>{
//         console.log("Application database failed",err)
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`)
//     })
        
//     } catch (error) {
//         console.error("Error: ",error)
//         throw err
        
//     }
// })() //iife (imetiately invoked function)