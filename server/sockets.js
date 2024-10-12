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
    return await usersCollection.findOne({ username }); // Find a user by username
  }

  // Save a new message to a specific channel in the group (MongoDB)
  async function saveMessageToDB(channelName, newMessage) {   
    const group = await groupsCollection.findOne({ 'channels.name': channelName }); // Find the group with the channel

    if (group) {
      await groupsCollection.updateOne( // Update the group with the new message
        { 'channels.name': channelName }, // Find the group with the specific channel
        { $push: { 'channels.$.messages': newMessage } }  // Add the new message to the channel
      );
      console.log('Message saved to the database.');  // Log success message
    } else {
      console.error(`Channel ${channelName} not found in any group.`);  // Log error message
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
    return await groupsCollection.find({}).toArray(); // Find all groups and convert to array
  }

  // Create a new group in the database
  async function createGroupInDB(groupName) {
    const group = {
      name: groupName,  // Set the group name
      channels: []  // Initialize the group with an empty channels array
    };
    await groupsCollection.insertOne(group);  // Insert the new group into the database
    console.log(`Group "${groupName}" created.`); // Log success message
  }

  // Delete a group from the database
  async function deleteGroupFromDB(groupName) {
    await groupsCollection.deleteOne({ name: groupName });  // Delete the group by name
    console.log(`Group "${groupName}" deleted from the database.`); // Log success message
  }

  // Create a new channel within a group in the database
  async function createChannelInDB(groupName, channel) {
    await groupsCollection.updateOne(   // Update the group with the new channel
      { name: groupName },          // Find the group by name
      { $addToSet: { channels: channel } }  // Add the channel to the group
    );
    console.log(`Channel "${channel.name}" created in group "${groupName}".`);  // Log success message   
  }

  // Delete a channel from a group in the database
  async function deleteChannelFromDB(channelName) { 
    await groupsCollection.updateOne( // Update the group by removing the channel
      { 'channels.name': channelName }, // Find the group with the specific channel
      { $pull: { channels: { name: channelName } } }  // Remove the channel from the group
    );
    console.log(`Channel "${channelName}" deleted from the database.`); // Log success message
  }

  // Add a user to a specific channel in the group (MongoDB)
  async function addUserToChannel(channelName, username) {
    const group = await groupsCollection.findOne({ 'channels.name': channelName }); // Find the group with the channel
    if (group) {  // If the group exists
      await groupsCollection.updateOne( // Update the group with the new user
        { 'channels.name': channelName }, // Find the group with the specific channel
        { $addToSet: { 'channels.$.users': { username: username } } }  // Add the user if not already present
      );
      console.log(`User ${username} added to channel "${channelName}".`); // Log success message
    } else {
      console.error(`Channel ${channelName} not found in any group.`);  // Log error message
    }
  }

  // Broadcast the updated list of groups and channels to all connected clients
  async function broadcastGroups() {
    const groups = await getGroupsFromDB(); // Fetch the updated list of groups
    io.emit('groupList', groups);  // Send the list of groups to all users
  }

  // Broadcast the active users in a specific channel
  function broadcastActiveUsers(channelName) {
    const users = activeUsers[channelName] || []; // Get the active users in the channel
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
            socket.emit('userSaved', { success: true, username: user.username }); // Send success message
        } catch (error) { // Catch any errors that occur  
            console.error('Error saving user:', error); // Log the error
            socket.emit('userSaved', { success: false, error: error.message }); // Send error message 
        }
    });

    // Fetch a user by username
    socket.on('getUser', async (username) => {  
        try {
            const user = await getUser(username); // Fetch the user from MongoDB
            socket.emit('userDetails', user);  // Send the user details back to the client
        } catch (error) {
            console.error('Error fetching user:', error); // Log the error
        }
    });

    // Handle creating a new group
    socket.on('createGroup', async (groupName) => { 
        try {
            const existingGroup = await groupsCollection.findOne({ name: groupName }); // Check if the group already exists   
            if (existingGroup) {
                console.error(`Group "${groupName}" already exists.`);  // Log error message
                socket.emit('groupCreationError', 'Group already exists');  // Send error message to client
                return;
            }
            await createGroupInDB(groupName); // Create the new group in MongoDB
            await broadcastGroups();  // Notify all users about the new group
        } catch (error) {
            console.error('Error creating group:', error);  // Log the error
        }
    });

    // Handle deleting a group
    socket.on('deleteGroup', async (groupName) => {
        try {
            await deleteGroupFromDB(groupName); // Delete the group from MongoDB
            await broadcastGroups();  // Notify all users about the deleted group
        } catch (error) {
            console.error('Error deleting group:', error);  // Log the error
        }
    });

    // Handle creating a new channel
    socket.on('createChannel', async ({ groupName, channel }) => {  
        try {
            await createChannelInDB(groupName, channel);  // Create the new channel in MongoDB
            await broadcastGroups();  // Notify all users about the new channel
        } catch (error) {
            console.error('Error creating channel:', error);  // Log the error
        }
    });

    // Handle deleting a channel
    socket.on('deleteChannel', async (channelName) => {   
        try {
            await deleteChannelFromDB(channelName); // Delete the channel from MongoDB
            await broadcastGroups();  // Notify all users about the deleted channel
        } catch (error) {
            console.error('Error deleting channel:', error);  // Log the error
        }
    });

    // Add a user to a channel
    socket.on('addUserToChannel', async ({ channelName, username }) => {
        try {
            await addUserToChannel(channelName, username);  // Add the user to the channel in MongoDB
        } catch (error) {
            console.error('Error adding user to channel:', error);  // Log the error
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
            if (activeUsers[previousChannel]) { // Remove the user from the active users list
                activeUsers[previousChannel] = activeUsers[previousChannel].filter(user => user !== username);  // Filter out the current user
                broadcastActiveUsers(previousChannel);  // Update users in the previous channel
                io.to(previousChannel).emit('userLeft', { // Notify other users in the channel
                    username,
                    message: `${username} has left the channel.`  // Send a message that the user has left
                });
            }
        }

        // Join the new channel
        socket.join(channelName); 
        console.log(`User ${username} joined channel: ${channelName}`); // Log the user joining the channel

        // Add the user to the active users list for the new channel
        if (!activeUsers[channelName]) {
            activeUsers[channelName] = [];
        }
        if (!activeUsers[channelName].includes(username)) { // Add the user if not already in the list
            activeUsers[channelName].push(username);  // Add the user to the active users list
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

        const newMessage = {  // Create a new message object
            user: user || 'Anonymous',  // Set the user or default to 'Anonymous'
            message,  // Set the message
            channelName,  // Set the channel name
            timestamp: new Date(),  // Set the current date
        };

        await saveMessageToDB(channelName, newMessage);  // Save the message to MongoDB

        // Broadcast the message to all clients in the specific channel
        io.to(channelName).emit('newMessage', newMessage);
    });

    // Send the current list of groups when a user connects
    socket.on('requestGroups', async () => {  
        const groups = await getGroupsFromDB(); // Fetch the list of groups
        socket.emit('groupList', groups); // Send the list of groups to the user
    });

    // Broadcast the updated list of groups and channels to all connected clients
    async function broadcastGroups() {
        const groups = await getGroupsFromDB(); // Fetch the updated list of groups
        io.emit('groupList', groups);  // Send the list of groups to all users
    }

    // Broadcast the active users in a specific channel
    function broadcastActiveUsers(channelName) {  
        const users = activeUsers[channelName] || []; // Get the active users in the channel
        io.to(channelName).emit('activeUsers', users);  // Send active users list to the channel
    }

    // Handle disconnect and notify others
    socket.on('disconnect', () => { 
        console.log('A user disconnected.');  // Log the user disconnection

        // Remove the user from the active users list for the channel
        if (currentUser && currentChannel && activeUsers[currentChannel]) {
            activeUsers[currentChannel] = activeUsers[currentChannel].filter(user => user !== currentUser);
            broadcastActiveUsers(currentChannel);  // Broadcast the updated active users list

            // Notify other users in the channel that the user has left
            io.to(currentChannel).emit('userLeft', {  
                username: currentUser,
                message: `${currentUser} has left the channel.` // Send a message that the user has left
            });
        }
    });
});
}
