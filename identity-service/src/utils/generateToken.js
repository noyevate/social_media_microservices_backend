
const jwt = require('jsonwebtoken')
const crypto = require('crypto');
const RefreshToken = require('../models/Refresh_token');

const generateTokens = async(user) => {
    const accessToken =  jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.JWT_SECRET, {expiresIn: "50d"})

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7) // refreshed tokn expires in 7 days

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expireAt: expiresAt
    });

    return{accessToken, refreshToken}
    
}

module.exports = generateTokens;