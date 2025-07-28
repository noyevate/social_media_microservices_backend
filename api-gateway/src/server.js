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





const app = express()

const Port = process.env.PORT || 300;

const redisClient = new redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

// rate limiting
const rateLimiter = rateLimit({
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

app.use(rateLimiter)

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit execeeded for address: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "too many requests"
        })
    })
});

//proxy to connect the routes of the other services (e.g identity service ) to the api gateway
// 

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
// 
// setting proxy for the identity service
app.use('v1/auth/', proxy(process.env.IDENTITY_SERVCE_URL, {
    ...proxy,
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
app.use(errorHandler);

app.listen(Port, () => {
    logger.info(`API GATEWAY running at port: ${Port} `);
    logger.info(`Identity service running on: ${process.env.IDENTITY_SERVCE_URL} `);
    logger.info(`Redis URL: ${process.env.REDIS_URL} `);
})