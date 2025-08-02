require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/error_handling');
const logger = require('./utils/looger');
const Redis = require("ioredis");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require('./routes/search_routes');
const { handlePostCreatedEvent, handlePostdeleteEvent } = require("./event_heandlers/event_handler");

const app = express();
const Port = process.env.PORT || 3004;

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
});

// Implementing the Ip based limiting 


app.use('/api/search', searchRoutes);
app.use(errorHandler);

async function startServer() {
    logger.info(`Search. service is running on port: ${Port}`)
    try {
        await connectRabbitMQ();
        // consume event
        await consumeEvent("post.created", handlePostCreatedEvent);
        await consumeEvent("post.deleted", handlePostdeleteEvent)
        app.listen(Port, () => {
    logger.info(`Search service is running on port: ${Port}`)
})
    
    } catch (error) {
        logger.error("Failed to connect to server", error);
        process.exit(1)
    }
}

startServer();