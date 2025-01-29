import mongoose,{Schema} from "mongoose";

const AttendanceSchema = new Schema({
  studentId:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true,
  },
  date:{
    type:String,
    required:true,
  },
  time:{
    type:String,
    required:true
  },
  status:{
    type:String,
    enum:['Present','Absent'],
    default:'Present'
  }
},{timestamps:true})

export const Attendance = mongoose.model("Attendance",AttendanceSchema)