const asyncHandler = (requestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}






//CREATING WITH TRY-CATCH (BOTH WAYS ARE EQUALLY GOOD)


// const asyncHandler = (fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(err.code|| 500).json({
//             success:false,
//             message:err.message
//         })
        
//     }

// }