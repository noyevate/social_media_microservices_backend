const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/looger")



const uploadMedia = async (req, res) => {
    logger.info("Starting media upload...")

    try {
        if(!req.file) {
            logger.error('No file found. Try adding a file and try again...');
            return res.status(400).json({
                sucess: false,
                message:'No file found. Try adding a file and try again...'
            });
        } 

        const {originalname, mimetype, buffer} = req.file;
        const userId = req.user.userId; 
        logger.info(`File details: name: ${originalname}, type: ${mimetype}`);
        logger.info('Uploading to cloudinary starting...');
        
        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
        logger.info(`Cloudinary Upload successfull. publicID: - ${cloudinaryUploadResult.public_id} -`);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUploadResult.secure_url,
            userId

        });
        await newlyCreatedMedia.save();
        res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
            message: "Media upload was successfull"
        })
    } catch (error) {
        logger.error('error while uploading media file', error);
        return res.status(500).json({
            success: false,
            message: "error while uploading media file"
        })
    }
}

module.exports = { uploadMedia }