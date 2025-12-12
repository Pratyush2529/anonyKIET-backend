const mongoose=require("mongoose");
const { trim } = require("validator");

const messageSchema=mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        required:true
    },
    content:{
        type:String,
        required:true,
        trim:true
    }
},
{
    timestamps:true
});

const Message=mongoose.model("Message",messageSchema);
module.exports=Message;