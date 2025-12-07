const express=require("express");
const authRouter=express.Router();
const Otp=require("../models/otp");
const User=require("../models/user");
const {sendMail}=require("../utils/mail");
const jwt=require("jsonwebtoken");

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(user){
    return jwt.sign(
        {_id:user._id, emailId:user.emailId},
        process.env.JWT_SECRET,
        {expiresIn:"7d"}
    );
}

authRouter.post("/send-otp", async (req, res)=>{
    try{
        const {emailId}=req.body;
        if(!emailId) return res.status(400).json({message:"Email is required"});
        const otp=generateOtp();
        await Otp.deleteMany({emailId});
        await Otp.create({emailId, otp});
        await sendMail({
            to:emailId,
            subject:"OTP for loggin in to anonyKIET",
            html:`<h2>Your OTP is: ${otp}</h2><p>Valid for 2 minutes.</p>`
        });
        res.json({message:"OTP sent successfully"});
    }catch(err){
    console.error(err);
    res.status(500).json({message:err.message});        
    }
});

authRouter.post("/verify-otp", async(req, res)=>{
    try{
        const {emailId, otp}=req.body;
        if(!emailId ||!otp) return res.status(400).json({message:"Email and OTP are required"});
        const otpDoc=await Otp.findOne({emailId});
        if(!otpDoc) return res.status(400).json({message:"OTP expired or invalid"});
        if(otpDoc.otp!==otp) return res.status(400).json({message:"Incorrect OTP"});

        let user = await User.findOne({emailId});
        let isNewUser = false;
        if(!user) {
            isNewUser=true;
            const tempUsername= "user_"+Date.now().toString();
            user=await User.create({emailId, username:tempUsername});
    }
        await Otp.deleteMany({emailId});
        const token=createToken(user);
        res.cookie("token", token, {
            httpOnly:false,
            sameSite:"lax"
        });
        const statusCode=isNewUser?201:200;
        return res.status(statusCode).json({isNewUser, user})
    }catch(err){
        res.status(500).json({message:err.message});
    }
})
module.exports=authRouter