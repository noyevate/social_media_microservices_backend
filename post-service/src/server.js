require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const postRoutes = require('./routes/post_service_routes');
const errorHandler = require('./middleware/error_handling');
const logger = require('./utils/looger');
const Redis = require("ioredis");

const app = express();
const Port = process.env.PORT || 3002;

mongoose.connect(process.env.mongodbUrl).then(() => logger.info("connected to DB")).catch(e => logger.error("DB connection error", e));
const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet())
app.use(cors())

app.use(express.json())

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next();
})


// Implementing the Ip based limiting 



// routes -> passing the redisclient to routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient
    next()
}, postRoutes);

app.use(errorHandler);


app.listen(Port, () => {
    logger.info(`Post service is running on port: ${Port}`)
})

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, "reason: " , reason)
})

