const express=require("express");
const userRouter=express.Router();
const Chat=require("../models/chat");
const userAuth = require("../middlewares/auth");


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