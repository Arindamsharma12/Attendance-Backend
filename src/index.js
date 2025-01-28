// require('dotenv').config({path:'./env'})
import connectDB from './db/index.js'
import dotenv from 'dotenv'

dotenv.config({
  path:'./env'
})


connectDB();


/*
import express from 'express'
const app = express();

(async ()=>{
  try{
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on('error',(error)=>{
      console.log("Error: ",error)
      throw error
    })

    app.listen(process.env.PORT,()=>{
      console.log(`App is running on http://localhost:${process.env.PORT}`)
    })

  } catch(error){
    console.log("Error: ",error)
  }
})()
*/

