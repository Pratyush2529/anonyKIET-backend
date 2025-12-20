const express = require("express");
const app = express();
const connectdb = require("./config/database");
const dotenv = require("dotenv");
const cookieParser=require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const chatRouter = require("./routes/chat");
const userRouter = require("./routes/user");
const http=require("http");
const initializeSocket = require("./utils/socket");
const cors = require("cors");
const suggestionRouter = require("./routes/suggestion");
const messageRouter = require("./routes/message");
const PORT = process.env.PORT;

dotenv.config();

app.use(cors({
    origin:"https://anonykiet.vercel.app",
    credentials:true
}));

app.use(express.json());
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", profileRouter)
app.use("/", chatRouter)
app.use("/", suggestionRouter)
app.use("/", userRouter)
app.use("/", messageRouter)

const server=http.createServer(app);
initializeSocket(server);

connectdb()
.then(()=>{
    console.log("Database connected");
    server.listen(PORT, () => console.log("Server started on port 5000"));
})
.catch(err => console.log(err));