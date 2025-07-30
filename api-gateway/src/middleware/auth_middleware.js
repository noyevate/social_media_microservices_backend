const logger = require("../utils/looger");
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if(!token) {
        logger.warn('Access attempt without valid token!')
        return res.status(401).json({
            message: "Authentication required",
            success: false

        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        logger.info(`${token}`)
        if(err) {
            logger.warn(`Invalid token: ${err}`)
            return res.status(429).json({
                message: `Invalid token: ${err}`,
                success: false
            })
        }
        req.user = user;
        next();
    })
}

module.exports = {validateToken}