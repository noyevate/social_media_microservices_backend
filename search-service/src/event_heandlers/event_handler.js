const { Search } = require("../models/Search");
const logger = require("../utils/looger");


async function handlePostCreatedEvent(event) {
    try {
        const newSearchPost = new Search({
            postId: event.postId,
            userId: event.userId,
            content: event.content,
            createdAt: event.createdAt
        });
        await newSearchPost.save();
        logger.info(`Search Post created: ${event.postId}, ${newSearchPost._id.toString()}`)
        
    } catch (error) {
        logger.error(error, "Error handling post created event")
    }
}

async function handlePostdeleteEvent(event) {
    logger.info("triggered the delet post event...")
    try {
        const {postId} = event
        const deleteSearchPost = await Search.findOneAndDelete({postId: postId});
        if (!deleteSearchPost) {
            logger.warn("no post was found")
            res.json({
                message: "no post was found."
            })
        }
        logger.info(`post deleted successfully ${postId}` )

    } catch (error) {
        logger.error(error, "Error handling post created event")
    }
}



module.exports = { handlePostCreatedEvent , handlePostdeleteEvent}