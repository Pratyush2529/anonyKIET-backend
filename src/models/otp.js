const mongoose = require("mongoose");

const otpSchema=mongoose.Schema({
    emailId:{
        type:String,
        required:true
    },
    otp:String,
    createdAt:{
        type:Date,
        default:Date.now,
        expires:120
    }
});

const Otp=mongoose.model("Otp",otpSchema);
module.exports=Otp;