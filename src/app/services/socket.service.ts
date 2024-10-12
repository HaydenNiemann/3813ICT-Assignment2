import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  // Join a channel with the provided channel name and username
  joinChannel(channelName: string, username: string): void {  // join a channel
    this.socket.emit('joinChannel', { channelName, username }); // Emit the joinChannel event
  }

  // Send a message to a specific channel (text or image)
  sendMessage(messageData: { channelName: string; message: string; user: string | null; imageUrl?: string }): void {  // send a message
    this.socket.emit('sendMessage', messageData); // Emit the sendMessage event
  }

  // Listen for incoming messages in the channel
  getMessages(callback: (message: any) => void): void { // get messages
    this.socket.off('newMessage');  // Remove existing listener to avoid duplicates
    this.socket.on('newMessage', (message) => callback(message));  // Add a fresh listener
  }

  // Get the chat history for the current channel
  getChatHistory(callback: (history: any[]) => void): void {  // get chat history
    this.socket.on('chatHistory', (history) => callback(history));  // Listen for chatHistory event
  }

  // Delete a channel
  deleteChannel(channelName: string): void {  // delete a channel
    this.socket.emit('deleteChannel', channelName); // Emit the deleteChannel event
  }

  // Request the list of channels
  getChannels(callback: (groups: any[]) => void): void {  // get channels
    this.socket.emit('requestChannels');  // Emit the requestChannels event
    this.socket.on('channelList', (groups: any[]) => {  // Listen for channelList event
      callback(groups); // Invoke callback with fetched channels
    });
  }

  // Create a new group
  createGroup(groupName: string): void {  // create a group
    this.socket.emit('createGroup', groupName); // Emit the group creation event
  }

  // Delete an existing group
  deleteGroup(groupName: string): void {    // delete a group
    this.socket.emit('deleteGroup', groupName); // Emit the group deletion event
  }

  // Listen for updated group list
  onGroupListUpdated(callback: (groups: any[]) => void): void { // listen for updated group list
    this.socket.on('groupList', (groups: any[]) => {  // Listen for groupList event
      callback(groups); // Invoke callback with updated groups
    });
  }

  // Create a new channel within a group
  createChannel(data: { groupName: string; channel: { name: string; description?: string } }): void { // create a channel
    this.socket.emit('createChannel', data); // Emit the channel creation event
  }

  // Add a user to a specific channel
  addUserToChannel(channelName: string, username: string): void { // add a user to a channel
    this.socket.emit('addUserToChannel', { channelName, username });  // Emit the addUserToChannel event
  }

  // Request the list of groups
  getGroups(callback: (groups: any[]) => void): void {  // get groups
    this.socket.emit('requestGroups');  // Emit the requestGroups event
    this.socket.on('groupList', (groups: any[]) => {  // Listen for groupList event
      callback(groups); // Invoke callback with fetched groups
    });
  }

  // Save the user to the database (MongoDB)
  saveUser(user: any): void {
    this.socket.emit('saveUser', user); // Emit the saveUser event to save the user in MongoDB
  }

  // Listen for users joining or leaving a channel and trigger the callback with the appropriate message
  onUserJoinOrLeave(callback: (message: string) => void): void {  // listen for user join or leave
    this.socket.on('userJoined', (data: any) => { // Listen for userJoined event
      const message = `${data.username} has joined the channel.`; // Prepare the message
      callback(message);  // Invoke the callback with the message
    });

    this.socket.on('userLeft', (data: any) => { // Listen for userLeft event
      const message = `${data.username} has left the channel.`; // Prepare the message
      callback(message);  // Invoke the callback with the message
    });
  }
}
