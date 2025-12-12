const express=require("express");
const userAuth = require("../middlewares/auth");
const Chat = require("../models/chat");
const User=require("../models/user");
const roomRouter=express.Router();

roomRouter.post("/room/create",userAuth, async (req, res)=>{
    try{
        const roomName=req.body.name;
        const isRoomExisting=await Chat.findOne({name:roomName});
        if(isRoomExisting) return res.status(400).json({message:"Room already exists"});
        const user=req.user;
        const createdBy=user._id;
        const createrUsername=user.username
        const members=user._id;
        const {name, description, photoUrl}=req.body;
        const isGroupChat=true;
        const room=await Chat.create({name, description, members, createdBy, photoUrl, isGroupChat});
        const rooms=user.rooms;
        rooms.push(room._id);
        await User.findByIdAndUpdate(user._id, {rooms}, {new:true});
        res.status(201).json({message:"Room successfully created by " + createrUsername, data:room});
    }catch(err){
        res.status(400).send("ERROR : "+err.message);
    }
})


roomRouter.patch("/room/:roomId/join", userAuth, async(req, res)=>{
    try{
        const {roomId}=req.params;
        const user=req.user;
        const _id=user._id;
        const room=await Chat.findById(roomId);
        if(!room) throw new Error("Room not found");
        const alreadyInRoom=room.members.map(_id=>_id.toString()).includes(_id.toString());
        if(alreadyInRoom) return res.status(400).json({message:"You are already in the room"});
        const members=room.members;
        members.push(_id);
        const rooms=user.rooms;
        rooms.push(roomId);
        const updatedRoom=await Chat.findByIdAndUpdate(roomId, {members}, {new:true});
        await User.findByIdAndUpdate(_id, {rooms}, {new:true});
        res.status(201).json({message:room.name + " room successfully joined by " + user.username, data:updatedRoom});

    }catch(err){
     res.status(400).send("ERROR : "+err.message);   
    }
})

module.exports=roomRouter