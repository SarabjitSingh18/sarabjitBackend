import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js' //validation purpuse 2=>step
import { User } from "../models/user.model.js"// 3step => checking if user exits
import { uploadOnCloudinary } from '../utils/cloudinary.js' //5step--> uploading files on cloudinary method
import { ApiResponse } from "../utils/ApiResponse.js";//9.step=> send the final response
import jwt from 'jsonwebtoken' //this is for decoding the refresh token
import mongoose from "mongoose";


//5. generating access and refresh tokens-->
const generateAccessAndRefreshTokens = async (userId) => {
    //there may be a change of failure please wrap inside trycatch
    try {
        //to generate a token for a user 
        //we have to find for which user we are going to create it
        const user = await User.findById(userId);
        //generate the access and refresh tokens by methods we have created
        //in the user.model.js
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        //after this we have to save the refresh token to the databse also
        //as user we have created down there is a object so add the refreshToken to object
        user.refreshToken = refreshToken
        //you have to save also the changes in refresh token
        //in the save() it asks for validation of password 
        //to ignore this just pass a object and say {validateBeforeSave: false}
        //don't panic this is standard practice
        await user.save({ validateBeforeSave: false })

        //returning the access and refresh token
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")

    }
}
//controls for the registration of the user-->
const registerUser = asyncHandler(async (req, res) => {

    //these are the steps we are going to follow (every step may vary from app to app func to func)

    //get the user details from the frontend or postman
    //validation-not empty
    //check if user already exits: username or from email
    //files are  there or not avatar(compulsary) and cover image
    //upload the files to cloudinary,avatar
    //create a user object --> create a entry in database
    //remove password and refresh token field from response
    //check for user creation
    //return res


    //1.getting the  response from frontend-->

    //destructuring the received data
    const { fullName, email, username, password } = req.body
    // console.log("username:",username ); using the postman raw data we can console log data

    //2. validation-->

    //you can also check the following validations one by one no diff there 
    //but i will make the code smaller
    // if (fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    //second way of error validation
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    //3rd step checking if user exits-->>
    const existedUser = await User.findOne({ //findone is a method in the User model which returns the first found User
        $or: [{ username }, { email }] //dolarsign-or  provides us a help to give our query inside a array in the form of object
    })
    //if username or email already exits stop the process here
    if (existedUser) {
        throw new ApiError(409, "user with email or username already exits")
    }

    //4.files are  there or not avatar(compulsary) and cover image--->>>

    // we know that all the data comes in the req.body
    //but as we previous introduced a multer.middleware--this provides the access of files in req
    //console.log(req.files)//this will provide you a object at first [0] with a path with which the item is stored by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //additional cheking code that can be used to understand the error -->canot read properties of undefined
    //if incase you want to make coverimage a required field for registration
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    //5.upload the files to cloudinary,avatar-->

    //we have a async method in utils/cloudinary which accepts a avatarlocalpath
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //check again the avatar field because if avatar is not there database will crash!!
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //6. now after the uploading the files we have to create a object and pass the entry to database

    const user = await User.create({
        fullName,
        avatar: avatar.url,  //after the insertion of files on cloudinary url
        coverImage: coverImage?.url || "",//as the coverImage is not a required field in our software so we have to
        // check if url of coverImage is there is not then add ""
        email,
        password,
        username: username.toLowerCase() //i want that username in lowercase
    })

    //7.checking for user creation-->
    //additional database call
    const createdUser = await User.findById(user._id).select( //this is a weird syntax we have to write the params that we want to undefine for frontend
        "-password -refreshToken"//8.with this database call we can also perform the removal of password and refreshToken 
    ) //through a database call we can check if user exists

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //9.send the response through the utils/Apiresponse-->>
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is Registed Successfully")

    )


    //this is just a sample response
    // res.status(200).json({
    //     message:"sarabjit api"
    // })
})
//controls for the login of the user-->
const loginUser = asyncHandler(async (req, res) => {
    //Algorithm for login user-->>>
    //1.get the data from the req.body
    //2.check the username or email
    //3. Write the logic to find the user 
    //4.check the password
    //5. if the password is correct provide the access and refresh token
    //6. send the tokens in cookies format

    //1.getting the data from the req.body
    const { email, username, password } = req.body
    //2.cheking either if username or email is given
    if (!username && !email) {
        throw new ApiError(404, "username or email is required")
    }
    //THIS IS THE CODE FOR EITHER EMAIL OR PASSWORD-->
    // if (!(username||email)) {
    //     throw new ApiError(404,"username or email is required")     
    // }

    //3.finding the user -->
    //User created in mongodb(thorugh user.model.js)
    //provides a findOne() -> returns the first found entry
    //$or -> is a mongodb operator accepts a array
    //in which you can pass the search basis in objects
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    //check if user is not in database
    if (!user) {
        throw new ApiError(404, "user doesnot exists found")
    }

    //4.if user exits 
    //for this we have created a  passworduserSchema.methods.isPasswordCorrect("receives the given password to check")
    //in the user.models
    //the methods you have added yourself is not accessed by User.findOne()
    //we have to do it with the instance we created by findOne method in mongoose user

    //checking the password's validity
    const isPasswordValid = await user.isPasswordCorrect(password)//pass the password that you got from req.body
    //if the password is incorrect
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User credentials ")
    }


    //if password is correct -->
    //6.using the generateAccessAndRefreshTokens("required userId") method created above
    //destructuring the access and refresh token from the generateAccessAndRefreshTokens()
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    //7.cookies to user -->
    //through database query
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //to send the cookies to user we have to define a option(object)
    //this option helps us to make cookies changeable by server only
    const options = {
        httpOnly: true,
        secure: true
    }

    //FINAL RESPONSE FROM THE loginUser() controller
    return res
        .status(200)
        //pass the name , value , options in res.cookie()
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                }
                ,
                "user logged in successfully"

            )
        )
})
//controls for the logout of the user-->
const logoutUser = asyncHandler(async (req, res) => {
    //removing the refresh token from the use of findbyIdAndUpdate()
    //findByIdAndUpdate() requires -> userId , what you want to update , {to get the updated value}
    await User.findByIdAndUpdate(
        req.user._id, //userid through middleware //auth.middleware.js
        {
            $set: { //using the set mongodb operator
                refreshToken: undefined //setting the refreshToken undefined
            }
        },
        {
            new: true //this will provide the updated value-> undefined
        }

    )
    //create a response 
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user is logged out"))
})
//as the users access token expires we have to check for the refresh token again and then provide him a new access token
//for this lets write a function how refreshes access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    //we can get the refresh token sent by user through req.cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        //to decode the user given refresh token we can use jwt.verify() method of jwt
        // the refresh token in database is raw 
        // the refresh token coming from the user is encripted
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        //now find the user through a mongo query and in the decoded token we have added only _id check in user.models.js
        const user = await User.findById(decodedToken?._id)
        //check if user is not found
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        //check if user is found 
        //compare the incomingToken and user.refreshToken
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        //if they are equal then use the generateAccessAndRefreshToken() created at top
        const options = {
            httpOnly: true,
            secure: true
        }
        //generating the new tokens efficiently
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")

    }

})
//controls to change the user's password -->
const changeCurrentPassword = asyncHandler(async (req, res) => {
    //getting the user essential inputs to change the password
    const { oldPassword, newPassword } = req.body
    //getting the user from the authmiddleware
    const user = await User.findById(req.user?._id)
    //in the user.models we have created a method called isPasswordCorrect() requires the password as parameter
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    //if the oldPassword is correct update the object member password
    user.password = newPassword
    //we have to save this change in user also 
    await user.save({ validateBeforeSave: false })

    //sending final response
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))
})
//controls to get current user-->
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})
//controls to update accout details--->
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    //find the user->
    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName, //this is same as fullName :fullName
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        )
})
//controls to update avatar file -->
const updateUserAvatar = asyncHandler(async (req, res) => {
    //this is like we have done in register user but we need multiple files there so we have used file not here the case
    const avatarlocalpath = await req.file?.path
    if (!avatarlocalpath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading the avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar image is successfully updated"
            )
        )
})
//controls to update coverpage file -->
const updateUserCoverPage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing ")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the file ")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }

        },
        { new: true }

    ).select("-password")

    res.status(200).json(new ApiResponse(200, user, "cover image updated successfully"))

})


//START OF THE JOURNEEY OF AGGREGATION PIPELINES IN MONGODB-->


//creating  a method to show the profile page data
const getUserChannelProfile = asyncHandler(async (req, res) => {
    //getting the username from the params/url
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    //if username exits
    // const channel = await User.aggregate([{},{},{}])
    //aggerate is a function accepts array accepts multiple objects as named 1st pipeline ,2nd pipeline ...
    const channel = await User.aggregate([
        {
            //first pipeline
            //finds the username which is same in db 
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            //second pipeline
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }

        },
        {
            //third pipeline
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //adding the above created pipelines
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }

        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }

        }
    ])
    console.log(channel)
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }
    return res.status(200).json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )



})


//creating  a method to show the user's watch history page data
//lets do something like sd-1 sd-2 fire!!
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                //nesting lookup to get the owner details
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //as we donot need to give all the user-model details we can do this to reduce stress
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }

                    }
                ]


            }
        }

    ])
    console.log(user)
    return res.status(200).json(new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
    ))
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
    updateUserCoverPage,
    getUserChannelProfile,
    getWatchHistory
}

//THIS IS THE RESPONSE WE GET FROM THE POSTMAN-->
// {
//     "statusCode": 200,
//     "data": {
//         "_id": "66b18e7779794b8904a0e37f",
//         "username": "sarv",
//         "email": "sarabsingh@gmail.com",
//         "fullName": "codewithsarv",
//         "avatar": "http://res.cloudinary.com/dmmnekdyq/image/upload/v1722877825/crubntzoktu6ln06ecyd.jpg",
//         "coverImage": "http://res.cloudinary.com/dmmnekdyq/image/upload/v1722877830/letlldijeibbxwbjtpsj.png",
//         "watchHistory": [],
//         "createdAt": "2024-08-06T02:46:15.171Z",
//         "updatedAt": "2024-08-06T02:46:15.171Z",
//         "__v": 0
//     },
//     "message": "User is Registed Successfully",
//     "success": true
// }


//console.log(req.files)
//this is the response of req.files
// avatar: [
//     {
//       fieldname: 'avatar',
//       originalname: 'github-profile-2.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'github-profile-2.jpg',
//       path: 'public\\temp\\github-profile-2.jpg',
//       size: 689438
//     }
//   ],
//   coverImage: [
//     {
//       fieldname: 'coverImage',
//       originalname: '—Pngtree—developers are coding programs on_14867886.png',
//       encoding: '7bit',
//       mimetype: 'image/png',
//       destination: './public/temp',
//       filename: '—Pngtree—developers are coding programs on_14867886.png',
//       path: 'public\\temp\\—Pngtree—developers are coding programs on_14867886.png',
//       size: 3336595
//     }
//   ]
// }















