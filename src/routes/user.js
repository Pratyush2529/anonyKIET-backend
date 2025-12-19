const express=require("express");
const userRouter=express.Router();
const Chat=require("../models/chat");
const userAuth = require("../middlewares/auth");
const User = require("../models/user");


userRouter.get("/user/chats", userAuth, async(req, res)=>{
    try{
        const user=req.user;
        const chats=await Chat.find({
            members:user._id
        }).sort({updatedAt:-1});
        res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
    }catch(err){
    console.error("error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
    }
})


userRouter.get("/user/groupChats", userAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const chats = await Chat.find({
      members: userId,    // user is in members array
      isGroupChat:true     
    })
      .sort({ updatedAt: -1 }) // newest active chats first
      .populate("members", "username photoUrl"); // optional

    res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (err) {
    console.error("error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
});

userRouter.post("/user/block", userAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUserId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Find user to block
    const targetUser = await User.findOne({ username });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-blocking
    if (targetUser._id.equals(currentUserId)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    // Add to blocked list (idempotent)
    const updatedUser=await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { blockedUsers: targetUser._id } },
      { new: true }
    );

    return res.json({ message: "User blocked successfully", data:updatedUser});

  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


userRouter.post("/user/unblock", userAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const currentUserId = req.user._id;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Find target user
    const targetUser = await User.findOne({ username });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-unblocking (harmless but logical)
    if (targetUser._id.equals(currentUserId)) {
      return res.status(400).json({ message: "Invalid operation" });
    }

    // Remove from blocked list
    const updatedUser=await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { blockedUsers: targetUser._id } },
      { new: true }
    );

    return res.json({ message: "User unblocked successfully", data:updatedUser });

  } catch (err) {
    console.error("Unblock user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports=userRouter