const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const Message = require("../models/message");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173", // your Vite URL
      credentials: true,
    },
  });

  // auth middleware
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.token;

      if (!token) return next(new Error("No auth token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id, emailId: payload.emailId };
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.user);

    // join chat room
    socket.on("joinChat", ({ chatId }) => {
      if (!chatId) return;
      socket.join(chatId.toString());
      console.log("Joined chat room:", chatId.toString());
    });

    // send message
    socket.on("sendMessage", async ({ chatId, content }) => {
      try {
        if (!chatId || !content?.trim()) return;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isMember = chat.members
          .map((m) => m.toString())
          .includes(socket.user.id.toString());
        if (!isMember) return;

        const msg = await Message.create({
          chatId: new mongoose.Types.ObjectId(chatId),
          senderId: new mongoose.Types.ObjectId(socket.user.id),
          content: content.trim(),
        });

        const populated = await msg.populate(
          "senderId",
          "username photoUrl"
        );

        const payload = {
          _id: populated._id,
          chatId,
          content: populated.content,
          createdAt: populated.createdAt,
          sender: {
            _id: populated.senderId._id,
            username: populated.senderId.username,
            photoUrl: populated.senderId.photoUrl,
          },
        };

        io.to(chatId.toString()).emit("newMessage", payload);
      } catch (err) {
        console.error("sendMessage error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.user?.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
