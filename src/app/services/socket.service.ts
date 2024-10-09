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
  joinChannel(channelName: string, username: string): void {
    this.socket.emit('joinChannel', { channelName, username });
  }

  // Send a message to a specific channel
  sendMessage(channelName: string, message: string, user: string | null): void {
    this.socket.emit('sendMessage', { channelName, message, user });
  }

  // Listen for incoming messages in the channel
  getMessages(callback: (message: any) => void): void {
    this.socket.off('newMessage');  // Remove existing listener to avoid duplicates
    this.socket.on('newMessage', (message) => callback(message));  // Add a fresh listener
  }

  // Get the chat history for the current channel
  getChatHistory(callback: (history: any[]) => void): void {
    this.socket.on('chatHistory', (history) => callback(history));
  }

  // Delete a channel
  deleteChannel(channelName: string): void {
    this.socket.emit('deleteChannel', channelName);
  }

  // Request the list of channels
  getChannels(callback: (groups: any[]) => void): void {
    this.socket.emit('requestChannels');
    this.socket.on('channelList', (groups: any[]) => {
      callback(groups);
    });
  }

  // Create a new group
  createGroup(groupName: string): void {
    this.socket.emit('createGroup', groupName); // Emit the group creation event
  }

  // Delete an existing group
  deleteGroup(groupName: string): void {
    this.socket.emit('deleteGroup', groupName);
  }

  // Listen for updated group list
  onGroupListUpdated(callback: (groups: any[]) => void): void {
    this.socket.on('groupList', (groups: any[]) => {
      callback(groups);
    });
  }

  // Create a new channel within a group
  createChannel(data: { groupName: string; channel: { name: string; description?: string } }): void {
    this.socket.emit('createChannel', data); // Emit the channel creation event
  }

  // Add a user to a specific channel
  addUserToChannel(channelName: string, username: string): void {
    this.socket.emit('addUserToChannel', { channelName, username });
  }

  // Request the list of groups
  getGroups(callback: (groups: any[]) => void): void {
    this.socket.emit('requestGroups');
    this.socket.on('groupList', (groups: any[]) => {
      callback(groups); // Invoke callback with fetched groups
    });
  }

  // Save the user to the database (MongoDB)
  saveUser(user: any): void {
    this.socket.emit('saveUser', user); // Emit the saveUser event to save the user in MongoDB
  }

  // Listen for users joining or leaving a channel and trigger the callback with the appropriate message
  onUserJoinOrLeave(callback: (message: string) => void): void {
    this.socket.on('userJoined', (data: any) => {
      const message = `${data.username} has joined the channel.`;
      callback(message);
    });

    this.socket.on('userLeft', (data: any) => {
      const message = `${data.username} has left the channel.`;
      callback(message);
    });

    

  }
}
