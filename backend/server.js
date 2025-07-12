import express from "express"
import dotenv from "dotenv"
import connectionDb from "./config/db.js"
// import routes

dotenv.config()


const app = express()


// routes


app.listen(process.env.PORT, () => {
  connectionDb();
  console.log(`Server is running on port ${process.env.PORT}`)
})
