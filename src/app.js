//starting the creating of app.js
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

//creating the app from express
const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))

app.use(express.json({
    limit:"16kb"  
}))
app.use(express.urlencoded({
    extended:true, 
    limit:"16kb"
}))
//this is a indication of the public folder for assets
app.use(express.static("public"))
//this is just a cookie parser to use crud operations on cookies
app.use(cookieParser())


//routes import

import userRouter from './routes/user.routes.js'

//routes declaration
//as we have created userRouter outside in another file (user.routes) we have to use a middle ware 
//this middleware will throw the control to the userRouter whenever /users is visited

// app.use("/users",userRouter) //this will work good but
// without std practice -->url will look like -> http://localhost:8000/users/register


//a standard practice is to define the version of api also

app.use("/api/v1/users",userRouter)
//with std practiceurl will look like -> http://localhost:8000/api/v1/users/register


export {app} 