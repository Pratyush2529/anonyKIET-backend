const mongoose=require("mongoose");

const chatSchema=mongoose.Schema({
    name:{
        type:String,
        default:"",
        trim:true
        //empty for private chats
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }],
    description:{
        type:String,
        default:""
        //empty for private chats
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        //
    },
    isGroupChat:{
        type:Boolean,
        default:false
    },
    photoUrl:{
        type:String,
        default:"https://cdn-icons-png.flaticon.com/512/149/149071.png"
    }
},
{
    timestamps:true
});

const Chat=mongoose.model("Chat",chatSchema);
module.exports=Chat;