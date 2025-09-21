import express from "express";
import dotenv from "dotenv"
const app = express()

dotenv.config();

const PORT = process.env.PORT || 3001


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})