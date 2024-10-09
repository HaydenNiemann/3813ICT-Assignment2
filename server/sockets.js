const { MongoClient } = require('mongodb');

module.exports.connect = function (io, client, dbName) {
  const db = client.db(dbName);

  // MongoDB collections for users and groups
  const usersCollection = db.collection('users');
  const groupsCollection = db.collection('groups');

  // Object to keep track of active users in each channel
  const activeUsers = {};

  // Save a user to the users collection (MongoDB)
  async function saveUser(user) {
    await usersCollection.updateOne(
      { username: user.username }, // Look for an existing user by username
      { $set: user },              // Update user details
      { upsert: true }             // Insert the user if they don't exist yet
    );
    console.log(`User ${user.username} saved to the database.`);
  }

  // Retrieve a user from the users collection (MongoDB)
  async function getUser(username) {
    return await usersCollection.findOne({ username });
  }

  // Save a new message to a specific channel in the group (MongoDB)
  async function saveMessageToDB(channelName, newMessage) {
    const group = await groupsCollection.findOne({ 'channels.name': channelName });

    if (group) {
      await groupsCollection.updateOne(
        { 'channels.name': channelName },
        { $push: { 'channels.$.messages': newMessage } }
      );
      console.log('Message saved to the database.');
    } else {
      console.error(`Channel ${channelName} not found in any group.`);
    }
  }

  // Retrieve chat history from the database for a specific channel
  async function getMessagesFromDB(channelName) {
    const group = await groupsCollection.findOne({ 'channels.name': channelName });
    if (group) {
      const channel = group.channels.find(ch => ch.name === channelName);
      return channel ? channel.messages : [];
    } else {
      return [];
    }
  }

  // Fetch all groups and their channels from the database
  async function getGroupsFromDB() {
    return await groupsCollection.find({}).toArray();
  }

  // Create a new group in the database
  async function createGroupInDB(groupName) {
    const group = {
      name: groupName,
      channels: []  // Initialize the group with an empty channels array
    };
    await groupsCollection.insertOne(group);
    console.log(`Group "${groupName}" created.`);
  }

  // Delete a group from the database
  async function deleteGroupFromDB(groupName) {
    await groupsCollection.deleteOne({ name: groupName });
    console.log(`Group "${groupName}" deleted from the database.`);
  }

  // Create a new channel within a group in the database
  async function createChannelInDB(groupName, channel) {
    await groupsCollection.updateOne(
      { name: groupName },
      { $addToSet: { channels: channel } }  // Add the channel to the group
    );
    console.log(`Channel "${channel.name}" created in group "${groupName}".`);
  }

  // Delete a channel from a group in the database
  async function deleteChannelFromDB(channelName) {
    await groupsCollection.updateOne(
      { 'channels.name': channelName },
      { $pull: { channels: { name: channelName } } }
    );
    console.log(`Channel "${channelName}" deleted from the database.`);
  }

  // Add a user to a specific channel in the group (MongoDB)
  async function addUserToChannel(channelName, username) {
    const group = await groupsCollection.findOne({ 'channels.name': channelName });
    if (group) {
      await groupsCollection.updateOne(
        { 'channels.name': channelName },
        { $addToSet: { 'channels.$.users': { username: username } } }  // Add the user if not already present
      );
      console.log(`User ${username} added to channel "${channelName}".`);
    } else {
      console.error(`Channel ${channelName} not found in any group.`);
    }
  }

  // Broadcast the updated list of groups and channels to all connected clients
  async function broadcastGroups() {
    const groups = await getGroupsFromDB();
    io.emit('groupList', groups);  // Send the list of groups to all users
  }

  // Broadcast the active users in a specific channel
  function broadcastActiveUsers(channelName) {
    const users = activeUsers[channelName] || [];
    io.to(channelName).emit('activeUsers', users); // Send active users list to the channel
  }

  // Handle Socket.io connections and events
  io.on('connection', (socket) => {
    console.log('A user connected.');

    let currentUser = null;
    let currentChannel = null;

    // Save a user when the saveUser event is triggered
    socket.on('saveUser', async (user) => {
      try {
        await saveUser(user);  // Save the user in MongoDB
        socket.emit('userSaved', { success: true, username: user.username });
      } catch (error) {
        console.error('Error saving user:', error);
        socket.emit('userSaved', { success: false, error: error.message });
      }
    });

    // Fetch a user by username
    socket.on('getUser', async (username) => {
      try {
        const user = await getUser(username);
        socket.emit('userDetails', user);  // Send the user details back to the client
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    });

    // Handle creating a new group
    socket.on('createGroup', async (groupName) => {
      try {
        const existingGroup = await groupsCollection.findOne({ name: groupName });
        if (existingGroup) {
          console.error(`Group "${groupName}" already exists.`);
          socket.emit('groupCreationError', 'Group already exists');
          return;
        }
        await createGroupInDB(groupName);
        await broadcastGroups();  // Notify all users about the new group
      } catch (error) {
        console.error('Error creating group:', error);
      }
    });

    // Handle deleting a group
    socket.on('deleteGroup', async (groupName) => {
      try {
        await deleteGroupFromDB(groupName);
        await broadcastGroups();  // Notify all users about the deleted group
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    });

    // Handle creating a new channel
    socket.on('createChannel', async ({ groupName, channel }) => {
      try {
        await createChannelInDB(groupName, channel);
        await broadcastGroups();  // Notify all users about the new channel
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    });

    // Handle deleting a channel
    socket.on('deleteChannel', async (channelName) => {
      try {
        await deleteChannelFromDB(channelName);
        await broadcastGroups();  // Notify all users about the deleted channel
      } catch (error) {
        console.error('Error deleting channel:', error);
      }
    });

    // Add a user to a channel
    socket.on('addUserToChannel', async ({ channelName, username }) => {
      try {
        await addUserToChannel(channelName, username);
      } catch (error) {
        console.error('Error adding user to channel:', error);
      }
    });

    // Handle joining a channel and send chat history
    socket.on('joinChannel', async ({ channelName, username }) => {
      const previousChannel = currentChannel;  // Store previous channel before switching
      currentUser = username;  // Store the current user
      currentChannel = channelName;  // Store the current channel

      // Only leave the previous channel if it's different from the new one
      if (previousChannel && previousChannel !== channelName) {
        socket.leave(previousChannel);  // Leave the previous channel
        if (activeUsers[previousChannel]) {
          activeUsers[previousChannel] = activeUsers[previousChannel].filter(user => user !== username);
          broadcastActiveUsers(previousChannel);  // Update users in the previous channel
          io.to(previousChannel).emit('userLeft', {
            username,
            message: `${username} has left the channel.`
          });
        }
      }

      // Join the new channel
      socket.join(channelName);
      console.log(`User ${username} joined channel: ${channelName}`);

      // Add the user to the active users list for the new channel
      if (!activeUsers[channelName]) {
        activeUsers[channelName] = [];
      }
      if (!activeUsers[channelName].includes(username)) {
        activeUsers[channelName].push(username);
      }
      broadcastActiveUsers(channelName);  // Broadcast the updated active users list

      // Fetch chat history for the channel and send it to the user
      const chatHistory = await getMessagesFromDB(channelName);
      socket.emit('chatHistory', chatHistory);

      // Broadcast to other users that someone has joined
      io.to(channelName).emit('userJoined', {
        username,
        message: `${username} has joined the channel.`
      });
    });

    // Handle sending a message in a channel
    socket.on('sendMessage', async ({ channelName, message, user }) => {
      if (!message || !channelName) {
        return console.error('Invalid message or channel name');
      }
    
      const newMessage = {
        user: user || 'Anonymous',
        message,
        channelName, // Include the channel name in the message for identification
        timestamp: new Date(),
      };
    
      await saveMessageToDB(channelName, newMessage);  // Save the message to MongoDB
      
      // Broadcast the message to all clients in the specific channel
      io.to(channelName).emit('newMessage', newMessage);
    });
    

    // Send the current list of groups when a user connects
    socket.on('requestGroups', async () => {
      const groups = await getGroupsFromDB();
      socket.emit('groupList', groups);
    });

    // Handle disconnect and notify others
    socket.on('disconnect', () => {
      console.log('A user disconnected.');

      // Remove the user from the active users list for the channel
      if (currentUser && currentChannel && activeUsers[currentChannel]) {
        activeUsers[currentChannel] = activeUsers[currentChannel].filter(user => user !== currentUser);
        broadcastActiveUsers(currentChannel);  // Broadcast the updated active users list

        // Notify other users in the channel that the user has left
        io.to(currentChannel).emit('userLeft', {
          username: currentUser,
          message: `${currentUser} has left the channel.`
        });
      }
    });
  });
};