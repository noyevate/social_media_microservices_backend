const logger = require("../utils/looger");

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || "internal server error"
    });
}

module.exports = errorHandler;