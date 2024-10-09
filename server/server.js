const express = require('express');
const http = require('http');
const cors = require('cors');
const socketHandler = require('./sockets'); // Import socketHandler
const { MongoClient } = require('mongodb'); // MongoDB native driver

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

// Pass MongoDB client and DB name to the socket handler
socketHandler.connect(io, client, dbName);

// Set up port and start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
