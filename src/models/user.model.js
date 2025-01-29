import mongoose,{Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const UserSchema = new Schema({
  studentId:{
    type:String,
    required:true,
    unique:true
  },
  name:{
    type:String,
    required:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
  },
  phone:{
    type:String,
  },
  photo_url:{
    type:String,
    required:false
  },
  face_encoding:{
    type:[number],
    required:true,
  },
  role:{
    type:String,
    enum:['student','teacher','admin'],
    default:'student'
  },
  password:{
    type:String,
    required:[true,'Password is required']
  },
  refreshToken:{
    type:String,
    required:true
  },
},{timestamps:true})

UserSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next();
    
  this.password = bcrypt.hash(this.password,10);
  next()
})

UserSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password,this.password)
}

UserSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id:this._id,
      studentId:this.studentId,
      email:this.email,
      name:this.name,
      role:this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
UserSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User =mongoose.model("User",UserSchema)