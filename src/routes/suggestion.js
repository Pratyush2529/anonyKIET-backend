const express = require("express");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const User = require("../models/user");
const userAuth = require("../middlewares/auth");

const suggestionRouter = express.Router();

// GET /users/suggestions?limit=10
suggestionRouter.get("/users/suggestions", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = 4;

    // 1) Find all DM chats where I'm a member
    const myDmChats = await Chat.find({
      members: userId,
      isGroupChat: false,
    }).select("members");

    // 2) Build excluded ids: me + all DM partners
    const excludedIds = new Set([userId.toString()]);

    myDmChats.forEach((chat) => {
      chat.members.forEach((m) => {
        excludedIds.add(m.toString());
      });
    });

    const excludedObjectIds = Array.from(excludedIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // 3) Aggregate on User: exclude those ids, pick random users
    const suggestions = await User.aggregate([
      {
        $match: {
          _id: { $nin: excludedObjectIds },
        },
      },
      { $sample: { size: limit } },
      {
        $project: {
          password: 0, // hide sensitive fields
          emailId: 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: suggestions.length,
      users: suggestions,
    });
  } catch (err) {
    console.error("users/suggestions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch suggestions" });
  }
});

module.exports = suggestionRouter;
