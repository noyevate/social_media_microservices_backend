require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mediaRoutes = require('./routes/media_routes');
const errorHandler = require('./middleware/error_handling');
const logger = require('./utils/looger');
const Redis = require("ioredis");
const { connectRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./event_handlers/media_event_handlers");

const app = express();
const Port = process.env.PORT || 3003;

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


app.use('/api/media', mediaRoutes);
app.use(errorHandler);

async function startServer() {
    
    try {
        await connectRabbitMQ();

        // consume all the events
        await consumeEvent("post.deleted", handlePostDeleted)

        app.listen(Port, () => {
    logger.info(`Media service is running on port: ${Port}`)
})
    } catch (error) {
        logger.error("Failed to connect to server", error);
        process.exit(1)
    }
}

startServer()


// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, "reason: " , reason)
})
