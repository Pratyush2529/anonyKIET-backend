const express=require("express");
const userAuth = require("../middlewares/auth");
const Chat = require("../models/chat");
const chatRouter=express.Router();

chatRouter.get("/chat/:targetUserId",userAuth, async (req, res)=>{
    try{
        const {targetUserId}=req.params;
        const userId=req.user._id;
        let chat = await Chat.findOne({
            members:{$all:[userId, targetUserId]}
        }).populate(
            {
                path:"members",
                select:["username", "emailId"]
            }
        );
        if(!chat){
            chat=new Chat({
                members:[userId, targetUserId],
                createdBy:userId
            });
            await chat.save()
        }
        res.json(chat);
    }catch(err){
        res.status(400).send("ERROR : "+err.message);
    }
})


// chatRouter.patch("/room/:roomId/join", userAuth, async(req, res)=>{
//     try{
//         const {roomId}=req.params;
//         const user=req.user;
//         const _id=user._id;
//         const room=await Chat.findById(roomId);
//         if(!room) throw new Error("Room not found");
//         const alreadyInRoom=room.members.map(_id=>_id.toString()).includes(_id.toString());
//         if(alreadyInRoom) return res.status(400).json({message:"You are already in the room"});
//         const members=room.members;
//         members.push(_id);
//         rooms.push(roomId);
//         const updatedRoom=await Chat.findByIdAndUpdate(roomId, {members}, {new:true});
//         res.status(201).json({message:room.name + " room successfully joined by " + user.username, data:updatedRoom});

//     }catch(err){
//      res.status(400).send("ERROR : "+err.message);   
//     }   
// })


chatRouter.delete("/chat/:chatId", userAuth, async(req, res)=>{
    try{
        const {chatId}=req.params;
        await Chat.findByIdAndDelete(chatId);
        res.status(200).send("Chat deleted successfully");
    }catch(err){
        res.status(400).send("ERROR : "+err.message);
    }
})

chatRouter.get("/chats/myChats", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      members: userId,
    })
      .populate("members", "username emailId photoUrl blockedUsers")
      .sort({ updatedAt: -1 }); // recent chats first (ChatList UX)

    const formattedChats = chats.map((chat) => {
      let chatName = chat.name;
      let chatPhoto = chat.photoUrl;

      const otherUser = chat.members.find(
        (member) => member._id.toString() !== userId.toString()
      );
      // PRIVATE CHAT LOGIC
      if (!chat.isGroupChat) {

        chatName = otherUser?.username || "Unknown User";
        chatPhoto =
          otherUser?.photoUrl ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      }

const isUserBlocked = req.user.blockedUsers.includes(otherUser._id) || otherUser.blockedUsers.includes(req.user._id);


      return {
        _id: chat._id,
        name: chatName,
        isGroupChat: chat.isGroupChat,
        members: chat.members.map((member) => ({
          _id: member._id,
          username: member.username,
          email: member.emailId,
        })),
        photoUrl: chatPhoto,
        isBlocked:isUserBlocked,
        description: chat.description || "",
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      chats: formattedChats,
    });
  } catch (err) {
    console.error("Fetch chats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




module.exports=chatRouter