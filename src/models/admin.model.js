import mongoose,{Schema} from 'mongoose'

const adminSchema = new Schema({
  faculty:{
    type:Schema.Types.ObjectId,
    ref:'User'
  },
  class:{
    type:Schema.Types.ObjectId,
    ref:'Class'
  }
},{timestamps:true})

export const Admin = mongoose.model("Admin",adminSchema)