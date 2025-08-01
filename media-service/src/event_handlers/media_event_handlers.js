const Media = require("../models/Media");
const { deleteMediaFromCoudinary } = require("../utils/cloudinary");
const logger = require("../utils/looger");



const handlePostDeleted = async(event) => {
    console.log(event, "Event-Event-Event");
    const {postId, mediaIds} = event;

    try {
        const mediafile = await Media.find({_id: {$in: mediaIds}});
        for(const media of mediafile) {
            await deleteMediaFromCoudinary(media.publicId)
            await Media.findByIdAndDelete(media._id);
            logger.info(`Media file ${media._id} with Post ${postId} deleted`)
        }
        loger.info(`Media file with post deleted successfully`)
        
    } catch (error) {
        logger.error(error, "Error occuredwhile deleting the media file")
    }

};



module.exports = {handlePostDeleted}