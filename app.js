const express = require("express");
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})

const io = require("socket.io")(server);

let socketsConnected = new Set()

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socketsConnected.add(socket.id);

    io.emit('clients-total', socketsConnected.size);

    // Add error handling
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    // Add a ping mechanism to keep the connection alive
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // Log when the client reconnects
    socket.on('reconnect', (attemptNumber) => {
        console.log('Client reconnected after', attemptNumber, 'attempts:', socket.id);
    });

    // Move the message event handler inside onConnected
    socket.on('message', (data) => {
        console.log(data);
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', data);
    });

    socket.on('stop-typing', (data) => {
        socket.broadcast.emit('user-stop-typing', data);
    });
});

// Periodically clean up any stale connections
setInterval(() => {
    io.sockets.emit('ping');
    console.log('Current connected clients:', socketsConnected.size);
}, 30000); // Every 30 seconds

app.use(express.static(path.join(__dirname, "public")));


