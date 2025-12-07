const validateEditProfileData=(req)=>{
    const allowedEditFields=["username", "age", "gender", "photoUrl", "about", "skills"];
    const isEditAllowed=Object.keys(req.body).every(key=>allowedEditFields.includes(key));
    return isEditAllowed;
}

module.exports={validateEditProfileData};