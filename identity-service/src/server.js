require('dotenv').config();

const mongoose = require('mongoose')
const logger = require('./utils/looger')
const express = require('express')
const app = express()
const helment = require('helmet')
const cors = require('cors')
const {RateLimiterRedis} = require("rate-limiter-flexible");
const Redis = require("ioredis")
const {rateLimit} = require("express-rate-limit")
const {RedisStore} = require('rate-limit-redis') 
const routes = require('./routes/identity-service')
const errorHandler = require('./middleware/error_handling')
const Port = process.env.PORT 


// connect to Mongodb
mongoose.connect(process.env.mongodbUrl).then(() => logger.info("connected to DB")).catch(e => logger.error("DB connection error", e));

const redisClient = new Redis(process.env.REDIS_URL)



// middleware
app.use(helment())
app.use(cors())

app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next();
})

// DDOS protection
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit execeeded for address: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "too many requests"
        })
    })
})

// ip based rate limit for sensitive endpoints

const sensitiveEndpointLimiter = rateLimit({
     windowMs: 8 * 60*1000,
     max: 20,
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
})

// apply sensitiveEndpointLimiter to routes
app.use('/api/auth/register', sensitiveEndpointLimiter);


// Routes

app.use('/api/auth', routes);


// error handler
app.use(errorHandler);


app.listen(Port, () => {
    logger.info(`Identity service is running on port: ${Port}`)
})

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, "reason: " , reason)
})
