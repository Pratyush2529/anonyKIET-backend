const express = require("express");
const app = express();
const connectdb = require("./config/database");


connectdb()
.then(()=>{
    console.log("Database connected");
    app.listen(5000, () => console.log("Server started on port 5000"));
})
.catch(err => console.log(err));