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
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse skills (multipart/form-data sends strings)
      if (updates.skills) {
        updates.skills = JSON.parse(updates.skills);
      }

      // Cloudinary upload (MEMORY → STREAM)
      if (req.file) {
        // Delete old image if exists
        if (user.photoUrl?.publicId) {
          await cloudinary.uploader.destroy(user.photoUrl.publicId);
        }

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: "profile_pics",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        updates.photoUrl = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
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
      console.error("PROFILE UPDATE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);



module.exports=profileRouter