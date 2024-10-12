import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

interface Group { // Define Group, Channel, and User interfaces
  name: string;
  channels: Channel[];
}

interface Channel {
  name: string;
  users: User[];
}

interface User {
  username: string;
  role?: string;
  groups?: string[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messagecontent: string = '';  // Initialize message content
  messages: { text?: string; imageUrl?: string }[] = []; // Initialize messages array (text or image) 
  userRole: string | null = ''; // Initialize user role
  username: string | null = ''; // Initialize username

  newGroupName: string = '';  // Initialize new group name
  newChannelName: string = '';  // Initialize new channel name
  selectedGroup: Group | null = null; // Initialize selected group
  selectedChannel: Channel | null = null; // Initialize selected channel
  userToAdd: string | null = '';  // Initialize user to add to channel

  groups: Group[] = []; // Initialize groups array
  userChannels: Channel[] = []; // Initialize user-specific channels
  users: User[] = [];   // Initialize users array
  isCreatingChannel: boolean = false; // Initialize channel creation mode

  selectedImage: string | ArrayBuffer | null = null;  // Initialize selected image

  constructor(private socketService: SocketService, private router: Router) {}  // Inject socket service and router

  ngOnInit(): void {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');  // Get current user from session storage

    this.userRole = currentUser.role; // Set user role
    this.username = currentUser.username; // Set username

    if (!this.userRole) { // Redirect to login if user role is null
      this.router.navigate(['/login']); // Redirect to login page
    }

    // Fetch groups when the component is initialized
    this.socketService.getGroups((groups: Group[]) => {
      this.groups = groups; // Set groups from the server
      this.userChannels = this.getUserChannels(); // Update user-specific channels
    });

    // Listen for updated group data
    this.socketService.onGroupListUpdated((groups: Group[]) => {  // Listen for groupList event
      this.groups = groups; // Update groups on the frontend when there's a change
    });

    // Listen for system messages (user joins or leaves)
    this.socketService.onUserJoinOrLeave((message: string) => { // Listen for userJoinOrLeave event
      this.messages.unshift({ text: message }); // Push the system message to the top of the message list
    });

    // Load users from local storage
    this.users = JSON.parse(localStorage.getItem('users') || '[]');
  }

  getUserChannels(): Channel[] {  // Function to get user-specific channels
    const channels: Channel[] = [];   // Initialize channels array  
    this.groups.forEach(group => {  // Iterate over groups
      group.channels.forEach(channel => { // Iterate over channels in each group
        if (channel.users.some(user => user.username === this.username)) {  // Check if the user is in the channel
          channels.push(channel); // Add the channel to the user-specific channels array
        }
      });
    });
    return channels;
  }

  selectGroup(group: Group): void { // Function to select a group
    this.selectedGroup = group; // Set the selected group
    this.selectedChannel = null; // Reset selected channel
  }

  selectChannel(channel: Channel): void { // Function to select a channel
    if (this.username) {  // Check if the user is logged in
      this.selectedChannel = channel;  // Set the selected channel
      this.messages = [];  // Clear previous messages

      // Join the selected channel
      this.socketService.joinChannel(channel.name, this.username);

      // Fetch chat history specific to this channel
      this.socketService.getChatHistory((history: any[]) => { // Fetch chat history
        const sortedHistory = history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());  // Sort by timestamp
        this.messages = sortedHistory.map(msg => ({ text: `${msg.user}: ${msg.message}`, imageUrl: msg.imageUrl }));  // Map messages
      });

      // Listen for new messages in this channel only
      this.socketService.getMessages((message: any) => {  
        if (this.selectedChannel?.name === message.channelName) { // Check if the message is for the selected channel
          this.messages.unshift({ text: `${message.user}: ${message.message}`, imageUrl: message.imageUrl }); // Add the message to the top
        }
      });
    }
  }

  // Function for handling image selection
  onImageSelected(event: any): void {
    const file = event.target.files[0]; // Get the selected file
    if (file) { // Check if a file is selected
      const reader = new FileReader();  // Initialize file reader
      reader.onload = () => { // Handle file load
        this.selectedImage = reader.result;  // Store base64 image
        console.log("Base64 image data:", this.selectedImage); // Debugging
      };
      reader.readAsDataURL(file); // Read the file as data URL
    }
  }

  // Function for sending message (text or image)
  sendMessage(): void {
    if (this.selectedChannel) { // Check if a channel is selected
      if (this.messagecontent.trim()) { // Check if message content is not empty
        // Send text message
        this.socketService.sendMessage({  
          channelName: this.selectedChannel.name, // Send message to the selected channel
          message: this.messagecontent, // Send the message content
          user: this.username,  // Send the username
          imageUrl: undefined // No image URL
        });
        this.messagecontent = ''; // Clear input after sending
      } else if (this.selectedImage) {  // Check if an image is selected
        console.log("Sending image message:", this.selectedImage); // Debugging

        // Send image message
        this.socketService.sendMessage({    
          channelName: this.selectedChannel.name, // Send message to the selected channel
          message: '', // No text, just the image
          user: this.username,  // Send the username
          imageUrl: this.selectedImage as string  // Send base64 image
        });

        // Clear the image after sending
        this.selectedImage = null;
      }
    }
  }

  createGroup(): void {   // Function to create a group
    if (this.newGroupName.trim()) { // Check if group name is not empty
      const groupExists = this.groups.some(group => group.name.toLowerCase() === this.newGroupName.trim().toLowerCase()); // Check if group already exists
      if (groupExists) {  // Check if group already exists
        alert('A group with this name already exists. Please choose a different name.');  // Alert if group already exists
        return;
      }

      this.socketService.createGroup(this.newGroupName.trim()); // Emit event to server
      this.newGroupName = ''; // Clear input
    }
  }

  createChannel(): void { // Function to create a channel
    if (this.selectedGroup && this.newChannelName.trim()) { // Check if group and channel name are not empty
      const channelExists = this.selectedGroup.channels.some( // Check if channel already exists
        channel => channel.name.toLowerCase() === this.newChannelName.trim().toLowerCase()  // Check if channel name already exists
      );
      if (channelExists) {  // Check if channel already exists
        alert('A channel with this name already exists. Please choose a different name.');  // Alert if channel already exists
        return; // Alert if channel already exists
      }

      const newChannel: Channel = { // Create a new channel object
        name: this.newChannelName.trim(), // Set channel name
        users: [] // Initialize with empty users array
      };

      // Emit the createChannel event to the server
      this.socketService.createChannel({ groupName: this.selectedGroup.name, channel: newChannel });  // Emit event to server

      this.newChannelName = ''; // Clear channel name input
      this.isCreatingChannel = false; // Reset the channel creation mode
    }
  }

  addUserToChannel(): void {  // Function to add a user to a channel
    if (this.selectedChannel && this.userToAdd) { // Check if channel and user are selected
      const user = this.users.find(u => u.username === this.userToAdd); // Find the user in the users array
      if (user) { // Check if user exists
        if (!this.selectedChannel.users.some(u => u.username === user.username)) {    // Check if user is not already in the channel
          this.selectedChannel.users.push(user);  // Add user to the channel
          this.saveGroups();  // Save groups to local storage
          this.socketService.addUserToChannel(this.selectedChannel.name, user.username); // Emit to server
          alert(`${user.username} has been added to the channel.`); // Alert user has been added
        } else {
          alert(`${user.username} is already in this channel.`);  // Alert user is already in the channel
        }
      }
    }
  }

  removeGroup(group: Group): void { // Function to remove a group
    this.groups = this.groups.filter(g => g !== group); // Remove the group from the list
    this.socketService.deleteGroup(group.name); // Persist the deletion on the backend
    this.selectedGroup = null; // Reset selected group
  }

  removeChannel(group: Group, channel: Channel): void { // Function to remove a channel
    group.channels = group.channels.filter(c => c !== channel); // Remove the channel from the group
    this.saveGroups(); // Save updated groups after removal
    this.socketService.deleteChannel(channel.name); // Inform backend to delete the channel

    if (this.selectedChannel === channel) {
      this.messages = []; // Clear messages if the selected channel is deleted
      this.selectedChannel = null; // Reset selected channel
    }
  }

  removeUserFromChannel(user: User): void { // Function to remove a user from a channel
    if (this.selectedChannel) { // Check if a channel is selected
      this.selectedChannel.users = this.selectedChannel.users.filter(u => u.username !== user.username);  // Remove the user from the channel
      this.saveGroups(); // Save updated groups after user removal
    }
  }

  banUserFromChannel(user: User): void {  // Function to ban a user from a channel
    this.removeUserFromChannel(user); // Remove the user from the channel
    alert(`${user.username} has been banned from the channel.`);  // Alert user has been banned
  }

  saveGroups(): void {  // Function to save groups to local storage
    localStorage.setItem('groups', JSON.stringify(this.groups)); // Save groups to local storage
  }

  saveUsers(): void { // Function to save users to local storage
    localStorage.setItem('users', JSON.stringify(this.users)); // Save users to local storage
  }

  logout(): void {  // Function to log out
    sessionStorage.removeItem('currentUser'); // Clear current user from session storage
    this.router.navigate(['/login']); // Redirect to login page
  }

  deleteProfile(): void { // Function to delete a user profile
    if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) { // Confirm profile deletion
      let users = JSON.parse(localStorage.getItem('users') || '[]');  // Get users from local storage
      users = users.filter((user: any) => user.username !== this.username); // Remove the current user from the list
      localStorage.setItem('users', JSON.stringify(users)); // Update users in local storage
      sessionStorage.removeItem('currentUser'); // Clear current user from session storage
      alert('Your profile has been deleted.');
      this.router.navigate(['/login']); // Redirect to login page
    }
  }
}
