import express from "express";
import dotenv from "dotenv"
import mongoose from "mongoose"
const app = express()

dotenv.config();

const PORT = process.env.PORT || 3001
const URL = process.env.MONGODB_URI

try{
mongoose.connect(URL);
console.log("connected to mongoDB");
}
catch(error){
console.log("Error : ",error);
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})