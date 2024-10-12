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


## REST API and Socket.io Events

### REST API Routes:

The majority of communication in this chat application is handled via **Socket.io** for real-time updates. However, there is a REST API route implemented to handle image uploads for chat messages.

#### **`POST /upload-chat-image`**
- **Purpose**: Handles image uploads for the chat.
- **Parameters**:
  - `image`: The image file uploaded by the user, submitted as form data.
- **Return Value**: 
  - Returns the URL of the uploaded image, which can then be included in chat messages.
  - If no file is uploaded, an error message is returned.

### Socket.io Events

#### **connection**
- **Purpose**: Initializes a new connection between the client and the server.
- **Parameters**: None.

#### **joinChannel**
- **Purpose**: Allows a user to join a specific channel.
- **Parameters**:
  - `channelName`: The name of the channel to join.
  - `username`: The username of the joining user.
- **Return Value**: Sends chat history and adds the user to the active user list.

#### **sendMessage**
- **Purpose**: Sends a message to the channel.
- **Parameters**:
  - `channelName`: The name of the channel.
  - `message`: The message content.
  - `username`: The username of the sender.
- **Return Value**: Broadcasts the message to all users in the channel.

#### **deleteChannel**
- **Purpose**: Deletes a channel and all its messages.
- **Parameters**:
  - `channelName`: The name of the channel to delete.
- **Return Value**: Shows all users that the channel has been deleted.







## Client-Server Interaction

### 1. **Joining a Channel**
- **Client**: When a user selects a channel, the `joinChannel` event is emitted.
- **Server**: Adds the user to the channel, sends the chat history, and broadcasts the updated user list.
- **Client Update**: Updates the UI with the chat history and highlights the active channel.

### 2. **Sending a Message**
- **Client**: Emits the `sendMessage` event with the message and channel details.
- **Server**: Broadcasts the message to all users in the channel and saves it to the database.
- **Client Update**: The new message is appended to the chat window in real time.

### 3. **Deleting a Channel**
- **Client**: Emits the `deleteChannel` event when an admin deletes a channel.
- **Server**: Removes the channel from the database and notifies all users.
- **Client Update**: The channel is removed from the sidebar, and users are redirected to another channel.

## Client-Server Interaction and Data Management

In this project, the client (Angular) and server (Node.js/Express) are responsible for distinct parts of the system. Below is the breakdown of responsibilities between the client and server:

### Client (Angular)
- **UI/UX Management**: The client is responsible for rendering the user interface, handling user input, and managing the state of the application on the front end. For example, the `ChatComponent` manages the display of messages, users, and channels.
- **Routing**: Angular routes like `/login` and `/chat` control navigation between different parts of the app. When a user navigates to `/chat`, the `ChatComponent` is loaded and starts listening for real-time updates.
- **Real-Time Updates**: The client listens for real-time events (such as `joinChannel`, `newMessage`, `userJoined`) from the server using Socket.io. These events trigger updates in the Angular components, like displaying the latest chat messages or active users in a channel.
- **Sending Data to Server**: The client sends data to the server, such as login credentials or chat messages, either via HTTP (for REST API calls) or Socket.io (for real-time communication). For example, when a user sends a message, it emits a `sendMessage` event to the server.
- **Handling Responses**: The client processes responses from the server, like chat history or the updated list of users in a channel, and updates the UI dynamically based on this data. The `ChatComponent` listens for server events and updates the display with the latest messages or user status.

### Server (Node.js/Express)
- **Data Persistence**: The server stores persistent data like users, channels, and messages in MongoDB. For example, when a new message is sent, the `saveMessageToDB` function stores that message in the database, and when a user joins a channel, the `activeUsers` global variable is updated to track users in that channel.
- **Global Variables**: The server uses global variables, such as `activeUsers`, to track the current users in each channel. This variable is updated in real-time as users join or leave channels, and it ensures the list of active users is always up to date.
- **File Changes (MongoDB)**: The server interacts with MongoDB to store and retrieve data such as chat messages, user details, and channel information. For example:
  - When a message is sent, it is stored in MongoDB using the `saveMessageToDB` function.
  - When a user joins a channel, the server retrieves the chat history for that channel from MongoDB using the `getMessagesFromDB` function.
- **REST API**: The server provides REST API endpoints for specific tasks like image uploads. For example, the `/upload-chat-image` route allows users to upload images, returning the URL of the uploaded image to be used in chat messages.
- **Real-Time Communication**: The server uses Socket.io to handle real-time communication. For example, when a client joins a channel, the server emits the `chatHistory` event to that user and broadcasts a `userJoined` message to other users in the same channel.
- **User and Channel Management**: The server processes operations like creating groups, adding users to channels, and sending messages. For example, when an admin creates a new channel, the server updates MongoDB with the new channel information and broadcasts the updated list of channels to all clients.



