# Chat Application (Phase 2) - Assignment 3813ICT

## Git Repository Organization and Usage

The Git repository for this project is set up to keep things organized. It’s structured like this:

### Branches:
- **`master`**: The stable branch that contains the most recent, tested version of the application. All final code is updated here after testing.


### Commit Frequency fix this:
- Frequent commits after completing a small piece of functionality or bug fix.
- Clear and descriptive commit messages such as "Added socket functionality" or "Fixed messages showing twice bug"

### Repository Structure:
- **Frontend (Angular)**: Stored in `src/app/`. Each Angular component and service is in its own folder to maintain modularity.
- **Backend (Node.js/Express)**: Stored in the `server/` directory. Key files include:
  - `server.js`: Initializes the server and sets up the main routes.
  - `sockets.js`: Manages real-time communication via Socket.io.
  - Multer setup is integrated directly in `server.js` for handling image uploads. (I was not successful it getting this to work)





## Data Structures

### User Object:
Represents a user in the system.
- **`username`**: Unique identifier for the user.
- **`password`**: User password stored securely, using hash hashed.
- **`role`**: The role of the user (`User`, `GroupAdmin`, `SuperAdmin`).

### Group Object:
Represents a collection of users and channels.
- **`id`**: Unique identifier for the group.
- **`name`**: Name of the group.
- **`channels`**: Array of channels within the group.
- **`users`**: Array of users in the group.

### Channel Object:
Represents a communication channel within a group.
- **`name`**: Name of the channel.
- **`users`**: Array of users in the channel.

### Message Object:
Represents a message within a channel.
- **`user`**: The user who sent the message.
- **`message`**: The text content of the message.
- **`imageUrl`**: Optional field that stores the URL of an attached image.
- **`timestamp`**: The date and time the message was sent.





## Angular Architecture

The application follows a modular Angular architecture with distinct components, services, models, and routes to enhance maintainability.

### Components:
- **`ChatComponent`**: Manages chat functionality, including creating/joining channels and sending messages (both text and images).
- **`LoginComponent`**: Handles user login and registration processes.

### Services:
- **`SocketService`**: Handles real-time communication between the front end and the server using Socket.io.

### Models:
- **`User`**: Defines the structure for users, including their username, role, and groups.
- **`Group`**: Defines the structure for groups, including group ID, name, channels, and users.
- **`Channel`**: Defines the structure for channels, including name and users.

### Routes:
- **`/login`**: Route for user login and registration.
- **`/chat`**: Route for the chat interface where users can interact in real time.





## Node Server Architecture

The Node.js server is structured to manage backend tasks efficiently, divided into specific files and functions.

### Files:
- **`server.js`**: Initializes the server, handles image uploads, and sets up routes.
- **`sockets.js`**: Manages Socket.io events for real-time chat functionality and handles database operations for users, groups, and channels.

### Modules:
- **`express`**: Handles HTTP requests and routing.
- **`socket.io`**: Manages real-time, bi-directional communication.
- **`cors`**: Enables cross-origin requests between the client and server.
- **`mongodb`**: Manages MongoDB connections for storing data.
- **`multer`**: Manages image uploads for the chat (I was not successful it getting this to work).

### Key Functions:

#### **server.js**:
- **`startMongoClient()`**: Establishes a connection to the MongoDB database.
- **`socketHandler.connect()`**: Initializes Socket.io for real-time communication.

#### **sockets.js**:
- **`saveMessageToDB()`**: Saves a message to the MongoDB database for a specific channel.
- **`getMessagesFromDB()`**: Retrieves chat history from the database for a specific channel.
- **`createGroupInDB()`**: Creates a new group in the database with an empty channels array.
- **`deleteGroupFromDB()`**: Deletes a group and its channels from the database.
- **`createChannelInDB()`**: Adds a new channel to an existing group in the database.
- **`deleteChannelFromDB()`**: Deletes a channel and its associated messages from the data store.
- **`addUserToChannel()`**: Adds a user to a specific channel within a group and updates the active users list.

### Socket.io Event Handlers:

The following Socket.io event handlers manage real-time communication between the client and server, handling user interactions, group and channel management, and message broadcasting.

#### **sockets.js**:
- **`saveUser()`**: Saves or updates a user's details in MongoDB when the `saveUser` event is triggered.
- **`getUser()`**: Fetches a user’s details from MongoDB when the `getUser` event is triggered.
- **`createGroup()`**: Creates a new group in MongoDB when the `createGroup` event is triggered.
- **`deleteGroup()`**: Deletes an existing group from MongoDB when the `deleteGroup` event is triggered.
- **`createChannel()`**: Adds a new channel to an existing group in MongoDB when the `createChannel` event is triggered.
- **`deleteChannel()`**: Deletes a channel and its associated messages from MongoDB when the `deleteChannel` event is triggered.
- **`addUserToChannel()`**: Adds a user to a specific channel in MongoDB when the `addUserToChannel` event is triggered.
- **`joinChannel()`**: Allows users to join a channel, updates the active user list, and retrieves chat history when the `joinChannel` event is triggered.
- **`sendMessage()`**: Sends a message to the specified channel, saves it in MongoDB, and broadcasts the message to other users when the `sendMessage` event is triggered.
- **`disconnect()`**: Handles user disconnection by removing the user from the active user list and updating other users in the channel when the `disconnect` event is triggered.