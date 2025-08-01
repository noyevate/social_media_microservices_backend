const express = require('express')
const {uploadMedia, getAllMedia} = require('../controllers/media_controller')
const multer = require('multer');
const logger = require('../utils/looger');
const {authenticateRequest} = require('../middleware/auth_middleware')


const router = express.Router();

// configure multer for file upload
const upload = multer({
    storage : multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).single('file')

router.post("/upload", authenticateRequest, (req, res, next) => {
    upload(req, res, function(err) {
        if(err instanceof multer.MulterError) {
            logger.error("Multer error while uploading: ", err)
            return res.status(400).json({
                message: `Multer error while uploading: ${err}`,
                error: err.message,
                stack: err.stack
            })
        } else if(err) {
            logger.error("unknown error while uploading: ", err)
            return res.status(500).json({
                message: `unknown error while uploading: ${err}`,
                error: err.message,
                stack: err.stack
            })
        }
        if(!req.fle) {
            logger.warn("No file found")
            return res.status(500).json({
                message: `No file found` 
            })
        } 
        next()
    })
}, uploadMedia);


router.get('/get', authenticateRequest, getAllMedia)






module.exports = router;