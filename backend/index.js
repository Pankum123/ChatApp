import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose";
import cors from "cors"

import userRoute from "./routes/user.route.js";
const app = express()

app.use(express.json());

app.use(cors());


dotenv.config();
const PORT = process.env.PORT || 4003
const URL = process.env.MONGODB_URI

try{
mongoose.connect(URL);
console.log("connected to mongoDB");
}
catch(error){
console.log("Error : ",error);
}


app.use("/user",userRoute); 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

