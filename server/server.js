const express = require('express');
const http = require('http');
const cors = require('cors');
const socketHandler = require('./sockets'); // Import socketHandler
const multer = require('multer'); // Multer for file uploads
const { MongoClient } = require('mongodb'); // MongoDB native driver
const path = require('path');

// Set up express app
const app = express();
app.use(cors()); // Enable CORS for requests

// Set up MongoDB connection using the native driver
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'chatapp';

async function startMongoClient() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
  }
}

startMongoClient();

// Set up HTTP server and socket.io
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Set up file storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save the file with a timestamp
  }
});
const upload = multer({ storage: storage });

// Route for uploading an image
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Serve static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Pass MongoDB client and DB name to the socket handler
socketHandler.connect(io, client, dbName);

// Set up port and start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
