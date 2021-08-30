const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

const http = require("http");
const server = http.createServer(app); 
const { Server } = require("socket.io"); 
const io = new Server(server, {
  cors: {
    origin: "https://arcane-castle-17364.herokuapp.com/",
    methods: ["GET", "POST"],
  },
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("wrong filetype");
    error.code = "LIMIT_FILE_TYPES";
    cb(error, false);
  }

  cb(null, true);
};

const directory = "server/public/assets"
if (!fs.existsSync(directory)){
    fs.mkdirSync(directory, { recursive: true });
}
fs.readdir(directory, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(directory, file), (err) => {
      if (err) throw err;
    });
  }
});

const MAX_SIZE = 200000;
const upload = multer({
  dest: "server/public/assets",
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
});

let files;
app.post("/api/upload", upload.single("file"), (req, res, next) => {
  const old_file_path = req.file.path;
  const new_file_path = old_file_path + ".jpeg";
  fs.renameSync(old_file_path, new_file_path);
  files = new_file_path;
  res.send(new_file_path);
});

// Handle production
if (process.env.NODE_ENV === "production") {
  // Static folder
  app.use(express.static(__dirname + "/public/"));

  // Handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));
}

io.on("connection", (socket) => {
  const randomHue = Math.floor(Math.random() * 357);
  const background = `hsl(${randomHue}, 87%, 91%)`;

  io.to(socket.id).emit("send id", {
    id: socket.id,
  });

  socket.on("new message", (msg) => {
    io.emit("new message", {
      messageType: msg.messageType,
      message: msg.message,
      user: msg.user,
      id: socket.id,
      background,
      date:
        new Date().toLocaleTimeString().slice(0, 4) +
        new Date().toLocaleTimeString().slice(7),
    });
  });

  socket.on("new image", (msg) => {
    console.log(msg.message);
    io.emit("new image", {
      messageType: msg.messageType,
      message: msg.message,
      user: msg.user,
      id: socket.id,
      background,
      date:
        new Date().toLocaleTimeString().slice(0, 4) +
        new Date().toLocaleTimeString().slice(7),
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(PORT);

