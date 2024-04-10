
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index:true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index:true
    },
    password: {
        type: String,
        required: [true,"Password is required!!"],
        
    },
    fullName: {
        type: String,
        required: true,
        trim:true
    },
    avatar: {
        type: String, // cloudinary url
        required:true
    },
    coverImage: {
        type: String, // cloudinary url
        required:true
    },
    watchHistory: {
        type: mongoose.Schema.Types.ObjectId, // object id reference of video model
        ref:"Video"
    },
    refreshToken: {
        type:String,
    }
})

export const User = mongoose.model("User", userSchema);