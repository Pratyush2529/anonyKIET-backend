const express=require("express");
const userAuth = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const User = require("../models/user");
const profileRouter=express.Router();

profileRouter.get("/profile", userAuth,(req, res) => {
        try{
            const user=req.user;
            res.status(200).json({user});
        }catch(err){
            res.status(400).send("ERROR : "+err.message);
        }
    });



profileRouter.patch("/profile/edit", userAuth, async (req, res)=>{
    try{
        if(!validateEditProfileData(req)) return res.status(400).json({message:"Invalid edit request"});
        const user=req.user;
        const updatedUser=await User.findByIdAndUpdate(user._id, req.body, {new:true});
        res.status(200).json({messgae:"Profile updated successfully", data:updatedUser});
    }catch(err){
        res.status(400).send("ERROR : "+err.message);
    }
})

module.exports=profileRouter