const express = require("express");
const app = express();
const connectdb = require("./config/database");
const dotenv = require("dotenv");
const cookieParser=require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const roomRouter = require("./routes/rooms");
dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use("/", authRouter);
app.use("/", profileRouter)
app.use("/", roomRouter)

connectdb()
.then(()=>{
    console.log("Database connected");
    app.listen(5000, () => console.log("Server started on port 5000"));
})
.catch(err => console.log(err));