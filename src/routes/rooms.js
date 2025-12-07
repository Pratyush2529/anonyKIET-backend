const express=require("express");
const Room = require("../models/room");
const userAuth = require("../middlewares/auth");
const User = require("../models/user");
const roomRouter=express.Router();

roomRouter.post("/room/create",userAuth, async (req, res)=>{
    try{
        const roomName=req.body.name;
        const isRoomExisting=await Room.findOne({name:roomName});
        if(isRoomExisting) return res.status(400).json({message:"Room already exists"});
        const user=req.user;
        const createdBy=user._id;
        const createrUsername=user.username
        const membersIds=user._id;
        const {name, description, photoUrl}=req.body;
        const room=await Room.create({name, description, membersIds, createdBy, photoUrl});
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
        const room=await Room.findById(roomId);
        if(!room) throw new Error("Room not found");
        const alreadyInRoom=room.membersIds.map(_id=>_id.toString()).includes(_id.toString());
        if(alreadyInRoom) return res.status(400).json({message:"You are already in the room"});
        const membersIds=room.membersIds;
        membersIds.push(_id);
        const rooms=user.rooms;
        rooms.push(roomId);
        const updatedRoom=await Room.findByIdAndUpdate(roomId, {membersIds}, {new:true});
        await User.findByIdAndUpdate(_id, {rooms}, {new:true});
        res.status(201).json({message:room.name + " room successfully joined by " + user.username, data:updatedRoom});

    }catch(err){
     res.status(400).send("ERROR : "+err.message);   
    }
})

module.exports=roomRouter