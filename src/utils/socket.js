const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const socketIO = require("socket.io");
const mongoose = require("mongoose");

const Chat = require("../models/chat");
const Message = require("../models/message");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "https://anonykiet.vercel.app",
      // origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
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

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        _id: payload._id,
        emailId: payload.emailId,
      };

      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      next(new Error("Authentication failed"));
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
        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) return;

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
      console.log(`User ${userId} left chat ${chatId}`);
    });

    // ============================
    // SEND MESSAGE
    // ============================
    socket.on("sendMessage", async ({ chatId, content }, ack) => {
      // console.log("sendMessage received:", { chatId, content });
      try {
        const chat = await Chat.findById(chatId).populate("members");
        const isBlocked =
          chat.members[0].blockedUsers.includes(chat.members[1]._id) ||
          chat.members[1].blockedUsers.includes(chat.members[0]._id);

        if (isBlocked) {
          return ack?.({ error: "User is blocked" });
        }
        if (!chatId || !content?.trim()) {
          return ack({ success: false, reason: "Invalid payload" });
        }

        // const chat = await Chat.findOne({
        //   _id: chatId,
        //   members: userId,
        // });

        if (!chat) {
          return ack({ success: false, reason: "Not a chat member" });
        }

        const message = await Message.create({
          chatId: new mongoose.Types.ObjectId(chatId),
          senderId: new mongoose.Types.ObjectId(userId),
          content: content.trim(),
        });

        const populatedMessage = await message.populate(
          "senderId",
          "username photoUrl emailId"
        );

        // ✅ FIXED: Changed 'chatId' to 'chat' to match frontend expectations
        io.to(chatId.toString()).emit("newMessage", {
          _id: populatedMessage._id,
          chatId,  // ✅ Changed from 'chatId' to 'chat'
          content: populatedMessage.content,
          createdAt: populatedMessage.createdAt,
          sender: {
            _id: populatedMessage.senderId._id,
            username: populatedMessage.senderId.username,
            photoUrl: populatedMessage.senderId.photoUrl,
            emailId: populatedMessage.senderId.emailId,
          },
        });
        console.log(content);

        ack({ success: true });
      } catch (err) {
        console.error("sendMessage error:", err.message);
        ack({ success: false, reason: "Server error" });
      }
    });

    // ============================
    // TYPING INDICATORS (OPTIONAL)
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
  });

  return io;
};

module.exports = initializeSocket;