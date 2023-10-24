const mongoose = require("mongoose");

const url = process.env.MONGO_URI


mongoose.set('strictQuery', false);


mongoose.connect(url,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(() =>{
    console.log("mongodb connected");
})
.catch(() =>{
    console.log("failed to connect");
    process.exit(1);
})


const LoginSchema = new mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    ID:{
        type:String,
        required:true
    },
    psd:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    }
})


const SignUpcollection = new mongoose.model("SignUpcollection",LoginSchema)

module.exports = SignUpcollection