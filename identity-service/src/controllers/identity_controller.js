const logger = require("../utils/looger");
const {validateRegistration, validateLogin} = require('../utils/validation');
const User = require('../models/User');
const generateTokens = require("../utils/generateToken");
// user registration

const registerUser = async (req, res) => {
    logger.info('registration endpoint..')
    try {
        const { error } = validateRegistration(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const { email, password, username } = req.body

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists",

            })
        }

        user = new User({
            username, email, password
        });
        await user.save();
        logger.warn("User account created..", user._id);

        const { accessToken, refreshToken } = await generateTokens(user);

        return res.status(201).json({
            sucess: true,
            message: "user account created",
            accessToken: `${accessToken}`,
            refreshToken: `${refreshToken}`
        })

    } catch (error) {
        logger.error('registration error occured', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}


// user login

const loginUser = async(req, res) => {
    logger.info("login endpoint hit...");
    try {
        const {error} = validateLogin(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const { email, password } = req.body;
        const user = await User.findOne({email});
        if(!user) {
            logger.warn("Invalid user");
            return res.status(404).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        const isValidPasword = await user.comparePassword(password);
        if(!isValidPasword) {
            logger.warn("Invalid password");
            return res.status(404).json({
                success: false,
                message: "Invalid password"
            })
        }
        const { accessToken, refreshToken } = await generateTokens(user);
        return res.json({
            accessToken: `${accessToken}`,
            refreshToken: `${refreshToken}`,
            userId: user._id
        })  
        

        
    } catch (error) {
        logger.error('login error occured', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}


// refreshtoken



// logout




module.exports = {registerUser, loginUser}