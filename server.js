// server.js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { maxHttpBufferSize: 1e8 }); // 100MB limit

app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected');
  
  // Default variables
  socket.username = "Anon_" + Math.floor(Math.random() * 1000);
  socket.room = "LOBBY";
  socket.join(socket.room);

  // 1. IDENTITY SETUP (User jab naam bataye)
  socket.on('set identity', (name) => {
    socket.username = name || socket.username;
    socket.emit('system', `> IDENTITY CONFIRMED: ${socket.username}`);
    socket.emit('system', `> CONNECTED TO ENCRYPTED CHANNEL: [${socket.room}]`);
    // Dusro ko batao
    socket.to(socket.room).emit('system', `> NEW CONNECTION DETECTED: ${socket.username}`);
  });

  // 2. CHAT MESSAGE
  socket.on('chat message', (msg) => {
    io.to(socket.room).emit('chat message', { user: socket.username, text: msg });
  });

  // 3. FILE SHARING
  socket.on('upload', (data) => {
    io.to(socket.room).emit('file received', {
        user: socket.username,
        fileName: data.fileName,
        fileType: data.fileType,
        buffer: data.buffer
    });
  });

  // 4. ROOM CHANGING (Private chat ke liye)
  socket.on('join room', (newRoom) => {
    socket.leave(socket.room);
    socket.room = newRoom;
    socket.join(socket.room);
    socket.emit('system', `> FREQUENCY SHIFT: JOINED [${newRoom}]`);
  });

  socket.on('disconnect', () => {
    // Optional: Notify disconnect
  });
});

const listener = server.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
