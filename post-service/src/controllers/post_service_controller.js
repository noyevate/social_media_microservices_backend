const logger = require('../utils/looger');
const { validateCreatePost } = require('../utils/validation');
const Post = require('../models/Post')


const createPost = async(req, res) => {
    logger.info("create post endpoint hit..")
    try {
        const { error } = validateCreatePost(req.body)
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const {content, mediaIds} = req.body;
        const newPost = new Post({
            user: req.user.userId,
            content: content,
            mediaIds: mediaIds || []
        });
        await newPost.save();
        logger.info("Post created successfully", newPost);
        res.status(201).json({
            success: true,
            message: "post created successfully"
        })
    } catch (error) {
        logger.error('error creating post', error);
        return res.status(500).json({
            success: false,
            message: "error creating post"
        })
    }
}


const getallPost = async(req, res) => {
    try {
        
    } catch (error) {
        logger.error('error getting all post', error);
        return res.status(500).json({
            success: false,
            message: "error getting all post"
        })
    }
}


const getPost = async(req, res) => {
    try {
        
    } catch (error) {
        logger.error('error getting post', error);
        return res.status(500).json({
            success: false,
            message: "error getting post"
        })
    }
}

const deletePost = async(req, res) => {
    try {
        
    } catch (error) {
        logger.error('error deleting post', error);
        return res.status(500).json({
            success: false,
            message: "error deleting post"
        })
    }
}


module.exports = {createPost, getallPost, getPost, deletePost}