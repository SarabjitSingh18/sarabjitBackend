import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
//this middleware is used to check user's current stage 
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        //by the req.cookies we can check if access token is there or not
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token)
        if (!token) {
            throw new ApiError(401, "unauthorised request");
        }
        //we have to decode the got token also by the help of jwt
        //the verify() in jwt requires two params firstly token to decode and the accesstokensecret that is only available by the creator so only creator can create
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        //if user is not found->
        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }

        //if user is there-->
        //most imp thing add a new object in the req 
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message|| "Invalid accesss token")
    }
})