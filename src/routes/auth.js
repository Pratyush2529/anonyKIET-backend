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

authRouter.post("/sendOtp", async (req, res)=>{
    try{
        const {emailId}=req.body;
        if(!emailId) return res.status(400).json({message:"Email is required"});
        const otp=generateOtp();
        await Otp.deleteMany({emailId});
        await Otp.create({emailId, otp});
        await sendMail({
    to: emailId,
    subject: "Your anonyKIET Login Code",
    html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">anonyKIET</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Your Login Code</h2>
                                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 24px;">
                                        Use the code below to complete your login to anonyKIET. This code is valid for the next 2 minutes.
                                    </p>
                                    
                                    <!-- OTP Box -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                        <tr>
                                            <td align="center" style="background-color: #f8f9fa; border: 2px dashed #e0e0e0; border-radius: 8px; padding: 30px;">
                                                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    ${otp}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 20px;">
                                        If you didn't request this code, please ignore this email or contact support if you have concerns.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 18px;">
                                        © ${new Date().getFullYear()} anonyKIET. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `
});
        res.json({message:"OTP sent successfully"});
    }catch(err){
    console.error(err);
    res.status(500).json({message:err.message});        
    }
});

authRouter.post("/verifyOtp", async(req, res)=>{
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

authRouter.post("/logout", async(req, res)=>{
    try{
        res.clearCookie("token");
        res.send("Logout ho gya ji!!");
    }catch(err){
        res.status(400).send("ERROR: "+err.message)
    }
})

module.exports=authRouter