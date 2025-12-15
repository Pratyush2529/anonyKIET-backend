const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const socketIO = require("socket.io");
const mongoose = require("mongoose");

const Chat = require("../models/chat");
const Message = require("../models/message");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // ============================
  // SOCKET AUTH MIDDLEWARE
  // ============================
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.token;

      if (!token) return next(new Error("No auth token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        _id: payload._id,
        emailId: payload.emailId,
      };

      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  // ============================
  // SOCKET CONNECTION
  // ============================
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log("Socket connected:", userId);

    // ============================
    // JOIN CHAT ROOM
    // ============================
    socket.on("joinChat", async ({ chatId }) => {
      try {
        if (!chatId) return;

        const chat = await Chat.findOne({
          _id: chatId,
          members: userId,
        });

        if (!chat) return;

        socket.join(chatId.toString());
        console.log(`User ${userId} joined chat ${chatId}`);
      } catch (err) {
        console.error("joinChat error:", err.message);
      }
    });

    // ============================
    // LEAVE CHAT ROOM
    // ============================
    socket.on("leaveChat", ({ chatId }) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
    });

    // ============================
    // SEND MESSAGE
    // ============================
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!chatId || !content?.trim()) return;

        // Verify membership
        const chat = await Chat.findOne({
          _id: chatId,
          members: userId,
        });

        if (!chat) return;

        // Persist message
        const message = await Message.create({
          chatId: new mongoose.Types.ObjectId(chatId),
          senderId: new mongoose.Types.ObjectId(userId),
          content: content.trim(),
        });

        const populated = await message.populate(
          "senderId",
          "username photoUrl"
        );

        const payload = {
          _id: populated._id,
          chatId: chatId,
          content: populated.content,
          createdAt: populated.createdAt,
          sender: {
            _id: populated.senderId._id,
            username: populated.senderId.username,
            photoUrl: populated.senderId.photoUrl,
          },
        };

        // Emit only to chat room
        io.to(chatId.toString()).emit("newMessage", payload);
      } catch (err) {
        console.error("sendMessage error:", err.message);
      }
    });

    // ============================
    // TYPING INDICATOR
    // ============================
    socket.on("typing", ({ chatId }) => {
      if (!chatId) return;
      socket.to(chatId.toString()).emit("userTyping", {
        userId,
      });
    });

    socket.on("stopTyping", ({ chatId }) => {
      if (!chatId) return;
      socket.to(chatId.toString()).emit("userStoppedTyping", {
        userId,
      });
    });

    // ============================
    // DISCONNECT
    // ============================
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", userId);
    });
socket.on("leaveChat", ({ chatId }) => {
  if (!chatId) return;
  socket.leave(chatId.toString());
  console.log("Left chat room:", chatId.toString());
});

  });

  return io;
};

module.exports = initializeSocket;
