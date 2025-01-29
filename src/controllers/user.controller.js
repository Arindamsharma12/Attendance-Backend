import {asyncHandler} from  '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req,res)=>{
  /*
    Registeration algo

    1. take studId,name,phone,photo,email,password
    2. validation - not empty
    3. if already exists (studId)
    4. check for photo
    5. upload photo on cloudinary
    6. create user object 
    7. remove password and refresh token
    8.check for user creation
    9. return res

  */

  const {studentId,fullname,email,password,phone} =  req.body;
  // console.log("Email: ",email)
  if(
    [fullname,email,password,studentId].some((field)=>field?.trim() === "")
  ){
    throw new ApiError(400,"All fields are required")
  }

  const existedUser = await User.findOne({
    $or:[{email},{studentId}]
  })

  if(existedUser){
    throw new ApiError(409,"User with email or student id already exists")
  }

  // console.log(req.files)

  const photoLocalPath = req.files?.photo[0]?.path
  if(!photoLocalPath){
    throw new ApiError(400,"Photo file is required")
  }

  const photo = await uploadOnCloudinary(photoLocalPath);

  if(!photo){
    throw new ApiError(400,"Photo file is required")
  }
  console.log("PHOTO URL: ",photo.url)

  const user = await User.create({
    studentId,
    fullname,
    photo_url: photo.url,
    email,
    password,
    phone,
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering a user")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully")
  )

})

const loginUser = asyncHandler(async(req,res)=>{
  // req.body -> data
  // studentId or email
  // find user
  // check password
  // access and refresh token generate
  // send cookies
  // return res
  const {studentId,email,password} = req.body;

  if(!studentId && !email){
    throw new ApiError(400,"Student Id or email is required")
  }

  const user = await User.findOne({
    $or:[
      {studentId},
      {email}
    ]
  })

  if(!user){
    throw new ApiError(404,"User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    secure:true,
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,
        accessToken,
        refreshToken
      },
      "User logged in successfully"
    )
  )
})

const logoutUser = asyncHandler(async (req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true,
    }
  )
  const options = {
    httpOnly:true,
    secure:true,
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User logged out successfully")
  )
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
    const options = {
      httpOnly:true,
      secure:true,
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "Access Token Refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(400,error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordValid = await user.isPasswordCorrect(oldPassword)
  
  if(!isPasswordValid){
    throw new ApiError(400,"Invalid Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})
  return res.status(200)
  .json(
    new ApiResponse(200,{},"Password Changed Successfully")
  )
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(
    200,
    req.user,
    "Current user fetched successfully"
  )
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
   const {fullname,email} = req.body
   if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {new:true,}
  ).select("-password")
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user,
      "Account details updated successfully"
    )
  )
})

const updateUserPhoto = asyncHandler(async(req,res)=>{
  const photoLocalPath = req.file?.path
  if(!photoLocalPath){
    throw new ApiError(400,"Photo file is missing")
  }
  const photo = await uploadOnCloudinary(photoLocalPath)
  if(!photo.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{photo_url:photo.url}
    },
    {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user,
      "Photo updated successfully"
    )
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserPhoto
}