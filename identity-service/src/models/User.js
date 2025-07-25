const mongoose = require('mongoose');
const argon2 = require('argon2');

const userShema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

}, {
    timestamps: true
});

userShema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password)
        } catch (error) {
            return next(error)
        }
    }
});

userShema.methods.comparePassword = async function (userPssword) {
    try {
        return await argon2.verify(this.password, userPssword)
    } catch (error) {
        throw error;
    }
}

userShema.index({ username: "text" });

const User = mongoose.model("User", userShema);
module.exports = User;

