const amqp = require("amqplib");
const logger = require('./looger');

// creating an connectingto a channel

let connection = null;
let channel = null;

// creating a unique exchange name
const EXCHANGE_NAME =  'social_media'

async function connectRabbitMQ() {
    logger.info("starting to connect to rabbitMQ...")
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        // create channel
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, "topic", {durable: false});
        logger.info("connected to rabbitMQ...")
        return channel;
    } catch (error) {
        logger.error("Error connecting to rabbitMQ", error);
    }
}


// function to publish event
// async function publishEvent(routingKey, message) {
//     if(!channel) {
//         await connectRabbitMQ()
//     }
//     channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
//     logger.info(`Event published: ${routingKey}`)
// }

async function consumeEvent(routingKey, callback) {
    if(!channel) {
        await connectRabbitMQ()
    }
    const q = await channel.assertQueue("", {exclusive: true});
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    channel.consume(q.queue, (msg) => {
        if(msg !== null) {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            channel.ack(msg)
        }
    });
    logger.info(`Subscribed to events: ${routingKey}`)
    
}





module.exports = {connectRabbitMQ,  consumeEvent}