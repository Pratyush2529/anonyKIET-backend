const mongoose=require("mongoose");

const messageSchema=mongoose.Schema({
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        refPath:"ConversationType",
        required:true,
    },
    conversationType:{
        type:String,
        required:true,
        enum:{
            values:["private","group"],
            message:`{VALUE} is not a valid conversation type`
        }
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    message:{
        type:String,
        required:true
    }
},
{
    timestamps:true
});

const Message=mongoose.model("Message",messageSchema);
module.exports=Message;