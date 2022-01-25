const socket = require('socket.io');
const WebSocketService = require('../services/WebSocketService');

module.exports = (server) => {
  const io = socket(server);

  console.log('Socket.io initialized!');

  io.on('connection', (client) => {

    console.log('Socket.io connected!');

    client.on('disconnect', () => {
      console.log('Socket.io disconnected!');
    });
  });
};
