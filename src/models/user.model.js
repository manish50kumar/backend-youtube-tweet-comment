
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"

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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

export const User = mongoose.model("User", userSchema);