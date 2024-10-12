const express = require('express'); // Import express
const http = require('http');    // Import http
const cors = require('cors');   // Import cors
const socketHandler = require('./sockets'); // Import socketHandler
const { MongoClient } = require('mongodb'); // MongoDB native driver
const multer = require('multer');   // Import multer
const path = require('path');      // Import path

// Set up express app
const app = express();
app.use(cors()); // Enable CORS for requests

// Set up static directory for serving uploaded images
app.use('/uploads', express.static('uploads'));

// Set up MongoDB connection using the native driver
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'chatapp';

// Function to start the MongoDB client and connect to the database
async function startMongoClient() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
  }
}

startMongoClient(); // Start the MongoDB client

// Set up Multer for file uploads
const storage = multer.diskStorage({  
  destination: function (req, file, cb) {  // Set destination for uploaded files
    cb(null, 'uploads/');  // Save images to the 'uploads' directory
  },
  filename: function (req, file, cb) {  // Set file name for uploaded files
    cb(null, Date.now() + path.extname(file.originalname));  // Append timestamp to file name
  }
});

const upload = multer({ storage: storage });  // Set up multer with the storage configuration

// Handle image upload route
app.post('/upload-chat-image', upload.single('image'), (req, res) => {
  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;  // URL for the uploaded image
    res.json({ filePath: imageUrl });  // Send back the image URL
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

// Set up HTTP server and socket.io
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:4200", 
    methods: ["GET", "POST"]
  }
});

// Pass MongoDB client and DB name to the socket handler
socketHandler.connect(io, client, dbName);

// Set up port and start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
