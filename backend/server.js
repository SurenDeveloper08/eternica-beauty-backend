const app = require('./app')
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');
const connectDatabase = require('./config/database');

connectDatabase();

const server = app.listen(process.env.PORT, () => {
    console.log(`My Server listening to the port: ${process.env.PORT} in  ${process.env.NODE_ENV} `)
})

const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to unhandled rejection error');
    server.close(() => {
        process.exit(1);
    })
})

process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to uncaught exception error');
    server.close(() => {
        process.exit(1);
    })
})



