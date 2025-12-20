const express=require("express");
const userAuth = require("../middlewares/auth");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const { validateEditProfileData } = require("../utils/validation");
const User = require("../models/user");
const upload = require("../middlewares/upload");
const profileRouter=express.Router();

profileRouter.get("/profile", userAuth,(req, res) => {
        try{
            const user=req.user;
            res.status(200).json({user});
        }catch(err){
            res.status(400).send("ERROR : "+err.message);
        }
    });



profileRouter.patch(
  "/profile/edit",
  userAuth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
        return res.status(400).json({ message: "Invalid edit request" });
      }
      const userId = req.user._id;
      const updates = req.body;


      const user = await User.findById(userId);


      // Parse skills
      if (updates.skills) {
        updates.skills = JSON.parse(updates.skills);
      }

      // Cloudinary upload
      if (req.file) {
        if (user.photoUrl?.publicId) {
    await cloudinary.uploader.destroy(user.photoUrl.publicId);
  }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pics",
        });

        updates.photoUrl = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        // Remove temp file
        fs.unlinkSync(req.file.path);
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: err.message });
    }
  }
);


module.exports=profileRouter