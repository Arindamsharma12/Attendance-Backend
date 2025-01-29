import mongoose,{Schema} from "mongoose";

const classSchema = new Schema({
  classId:{
    type:String,
    required:true,
    unique:true,
  },
  subjectName:{
    type:String,
    required:true,
  },
  teacher:{
    type:String,
    required:true,
  },
  schedule:[
    {
      day:{type:String,required:true},
      time:{type:String,required:true}
    }
  ],
  students:[
    {
      type:Schema.Types.ObjectId,
      ref:'User'
    }
  ]
})

export const Class = mongoose.model("Class",classSchema)