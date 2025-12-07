const mongoose=require("mongoose");

const roomSchema=mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    membersIds:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }],
    description:{
        type:String,
        default:"this is a default description of the room",
        trim:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    photoUrl:{
        type:String,
        default:"https://cdn-icons-png.flaticon.com/512/149/149071.png"
    }
},
{
    timestamps:true
})

const Room=mongoose.model("Room",roomSchema);
module.exports=Room;