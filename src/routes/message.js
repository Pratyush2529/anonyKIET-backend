const express = require("express");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const Message = require("../models/message");
const userAuth = require("../middlewares/auth");

const messageRouter = express.Router();

messageRouter.get("/messages/:chatId", userAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    // Ensure user is a member of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: userId,
    });

    if (!chat) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // Fetch messages + populate sender
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 }) // oldest -> newest (important for UI)
      .populate("senderId", "username photoUrl emailId");

    // Normalize response shape to match socket payload
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      chatId: msg.chatId,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: {
        _id: msg.senderId._id,
        username: msg.senderId.username,
        photoUrl: msg.senderId.photoUrl,
        emailId: msg.senderId.emailId,
      },
    }));

    res.status(200).json({
      messages: formattedMessages,
    });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = messageRouter;
