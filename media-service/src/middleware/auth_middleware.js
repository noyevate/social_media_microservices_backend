const logger = require('../utils/looger');

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'] 

    if(!userId) {
        logger.warn(`Access attempted without userId`);
        return res.status(401).json({
            success: false,
            message: "authentication required. Please login"
        })
    }
    
    req.user = {userId}
    next()
}

module.exports = {authenticateRequest}