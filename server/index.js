const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());

const http = require('http');//
const server = http.createServer(app);//
const { Server } = require("socket.io");// 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  } //needs to be done!
});// io is a new instance of Server

const fileFilter = function(req, file, cb) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif"
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('wrong filetype')
    error.code = 'LIMIT_FILE_TYPES'
    cb(error, false)
  }

  cb(null, true)
}

const MAX_SIZE = 200000;

const upload = multer({
  dest: './client/src/assets',
  fileFilter,
  limits: {
    fileSize: MAX_SIZE
  }
})
 
app.post('/upload', upload.single('file'), (req, res, next) => {
  const old_file_path = req.file.path;
  const new_file_path = old_file_path + '.jpeg';
  fs.renameSync(old_file_path, new_file_path);
  res.send(new_file_path)
})


io.on('connection', (socket) => {
  console.log('a user connected');

  io.to(socket.id).emit('send id', {
    id: socket.id
  });

  socket.on('new message', (msg) => {
    io.emit('new message', {
      messageType: msg.messageType,
      message: msg.message,
      user: msg.user,
      id: socket.id,
      date: new Date().toLocaleTimeString().slice(0,4) + new Date().toLocaleTimeString().slice(7)
    })
  });

  socket.on('new image', (msg) => {
    io.emit('new image', {
      messageType: msg.messageType,
      message: msg.message,
      user: msg.user,
      id: socket.id,
      date: new Date().toLocaleTimeString().slice(0,4) + new Date().toLocaleTimeString().slice(7)
    })
  })
  
  socket.on('disconnect', () => {
        console.log('user disconnected');
  });
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});



