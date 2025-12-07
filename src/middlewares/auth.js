const jwt=require("jsonwebtoken");
const User=require("../models/user");

const userAuth=async(req, res, next)=>{
    try{
        const token=req.cookies.token;
        if(!token) return res.status(401).json({message:"Please Login!"});
        const decodedMsg=jwt.verify(token, process.env.JWT_SECRET);
        const _id=decodedMsg.id;
        const user= await User.findById(_id);
        if(!user){
            throw new Error("user not found, login again");
        }
        req.user=user;
        next();
    }catch(err){
        res.status(400).send({message:err.message});
    }
}

module.exports=userAuth  