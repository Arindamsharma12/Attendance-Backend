import {asyncHandler} from  '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'


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

export {registerUser}