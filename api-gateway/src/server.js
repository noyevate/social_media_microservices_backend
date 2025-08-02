require('dotenv').config()
const express = require('express')
const cors = require('cors');
const redis = require("ioredis");
const helmet = require('helmet')
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require('rate-limit-redis');
const logger = require('./utils/looger');
const proxy = require("express-http-proxy"); 
const errorHandler = require('./middleware/error_handling');
const { validateToken } = require('./middleware/auth_middleware');
const app = express()
const Port = process.env.PORT || 300;
const redisClient = new redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

// rate limiting
const rateLimitOptions = rateLimit({
    windowMs: 8 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`sensitive endpoint rate limit exceeded for address: ${req.ip}`),
            res.status(429).json({
                success: false,
                message: `too many requests: ${req.ip}`
            })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});

app.use(rateLimitOptions)

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

//proxy to connect the routes of the other services (e.g identity service ) to the api gateway
// 

console.log("started here")
const proxyOptions = {
    
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Procy error: ${err.message}`);
        res.status(500).json({
            message: `Internal server error,`,
            error: err.message
        })
    }
}
console.log("finished here")
// 
// setting proxy for the identity service
app.use('/v1/auth/', proxy(process.env.IDENTITY_SERVCE_URL, { 
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Identity Service: ${proxyRes.statusCode}`);
        return proxyResData
    }
})
);

// // setting proxy for the post service
app.use('/v1/posts', validateToken, proxy(process.env.POST_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Post Service: ${proxyRes.statusCode}`);
        return proxyResData
    }
}))


// // setting proxy for the media service
app.use('/v1/media', validateToken, proxy(process.env.MEDIA_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')) {
            proxyReqOpts.headers['Content-Type'] = "application/json" 
        }
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Media Service: ${proxyRes.statusCode}`);
        return proxyResData
    },
    parseReqBody: false
}))

// // setting proxy for the search service
app.use('/v1/search', validateToken, proxy(process.env.SEARCH_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId
        
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Search Service: ${proxyRes.statusCode}`);
        return proxyResData
    },
    parseReqBody: false
}))


app.use(errorHandler);

app.listen(Port, () => {
    logger.info(`API GATEWAY running at port: ${Port} `);
    logger.info(`Identity service running on: ${process.env.IDENTITY_SERVCE_URL} `);
    logger.info(`Post service running on: ${process.env.POST_SERVICE} `);
    logger.info(`Media service running on: ${process.env.MEDIA_SERVICE} `);
    logger.info(`Search service running on: ${process.env.SEARCH_SERVICE} `);
    logger.info(`Redis URL: ${process.env.REDIS_URL} `);
})