const logger = require('../utils/looger');
const { validateCreatePost } = require('../utils/validation');
const Post = require('../models/Post');
const { publishEvent } = require('../utils/rabbitmq');


// invalidatingthe cache so that subsequent posts will be available in the 

async function invalidatePostCache(req, input) {
    const cachedKey = `post:${input}`
    await req.redisClient.del(cachedKey)


    const keys = await req.redisClient.keys("posts:*");
    if(keys.length > 0) {
        await req.redisClient.del(keys)
    }
}


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
        // rabbitMq expose event to save post in search database too
        await publishEvent("post.created", {
            postId: newPost._id.toString(),
            userId: newPost.user.toString(),
            content: newPost.content,
            createdAt: newPost.createdAt
        })


        // invalidate the redis cache.
        await invalidatePostCache(req, newPost._id.toString()) 
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
    logger.info("get all post endpoint hit..")
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.page) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `post:${page}:${limit}`;
        const cachePosts = await req.redisClient.get(cacheKey);

        if(cachePosts) {
            return res.json(JSON.parse(cachePosts))
        }

        const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit);
        const total = await Post.countDocuments()
        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total
        }
        // save post in redis cache
        await req.redisClient.setex(cacheKey, 100, JSON.stringify(result));
        res.json(result);

    } catch (error) {
        logger.error('error getting all post', error);
        return res.status(500).json({
            success: false,
            message: "error getting all post"
        })
    }
}


const getPost = async(req, res) => {
    logger.info("get single post endpoint hit..")
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachePost = await req.redisClient.get(cacheKey);

        if(cachePost) {
            return res.json(JSON.parse(cachePost))
        }

        const singlePost = await Post.findById(postId);
        if(!singlePost) {
            return res.status(404).json({
                message: "Post not found",
                status: false
            });
        }
        await req.redisClient.setex(cachePost, 3600, JSON.stringify(singlePost));
        res.json(singlePost)
        
    } catch (error) {
        logger.error('error getting post', error);
        return res.status(500).json({
            success: false,
            message: "error getting post"
        })
    }
}

const deletePost = async(req, res) => {
    logger.info("delete single post endpoint hit..")
    try {
        const postId = req.params.id;
        const deleteSinglePost = await Post.findOneAndDelete({
            _id: postId,
            user: req.user.userId
        })
         
        if(!deleteSinglePost) {
            return res.status(404).json({
                message: "Post not found",
                status: false
            });   
        }
        // publis post delete method ->
        await publishEvent("post.deleted", {
            postId: deleteSinglePost._id.toString(),
            userId: req.user.userId,
            mediaIds: deleteSinglePost.mediaIds
        })

        await invalidatePostCache(req, postId)
        logger.error('Post deleted successfully', postId);
        return res.status(201).json({
            message: "Post deleted successfully",
            status: true
        })
    } catch (error) {
        logger.error('error deleting post', error);
        return res.status(500).json({
            success: false,
            message: "error deleting post"
        })
    }
}


module.exports = {createPost, getallPost, getPost, deletePost}