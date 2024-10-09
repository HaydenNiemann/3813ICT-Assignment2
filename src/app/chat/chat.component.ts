import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket.service';

interface Group {
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
  messagecontent: string = '';
  messages: string[] = [];
  userRole: string | null = '';
  username: string | null = '';

  newGroupName: string = '';
  newChannelName: string = '';
  selectedGroup: Group | null = null;
  selectedChannel: Channel | null = null;
  userToAdd: string | null = '';

  groups: Group[] = [];
  userChannels: Channel[] = [];
  users: User[] = [];
  isCreatingChannel: boolean = false;

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    this.userRole = currentUser.role;
    this.username = currentUser.username;

    if (!this.userRole) {
      this.router.navigate(['/login']);
    }

    // Fetch groups when the component is initialized
    this.socketService.getGroups((groups: Group[]) => {
      this.groups = groups;
      this.userChannels = this.getUserChannels(); // Update user-specific channels
    });

    // Listen for updated group data
    this.socketService.onGroupListUpdated((groups: Group[]) => {
      this.groups = groups; // Update groups on the frontend when there's a change
    });

    // Listen for system messages (user joins or leaves)
    this.socketService.onUserJoinOrLeave((message: string) => {
      this.messages.unshift(message); // Push the system message to the top of the message list
    });

    // Load users from local storage
    this.users = JSON.parse(localStorage.getItem('users') || '[]');
  }

  getUserChannels(): Channel[] {
    const channels: Channel[] = [];
    this.groups.forEach(group => {
      group.channels.forEach(channel => {
        if (channel.users.some(user => user.username === this.username)) {
          channels.push(channel);
        }
      });
    });
    return channels;
  }

  selectGroup(group: Group): void {
    this.selectedGroup = group;
    this.selectedChannel = null; // Reset selected channel
  }

  selectChannel(channel: Channel): void {
    if (this.username) {
      this.selectedChannel = channel;  // Set the selected channel
      this.messages = [];  // Clear previous messages
  
      // Join the selected channel
      this.socketService.joinChannel(channel.name, this.username);
  
      // Fetch chat history specific to this channel
      this.socketService.getChatHistory((history: any[]) => {
        const sortedHistory = history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.messages = sortedHistory.map(msg => `${msg.user}: ${msg.message}`);
      });
  
      // Listen for new messages in this channel only
      this.socketService.getMessages((message: any) => {
        if (this.selectedChannel?.name === message.channelName) {
          this.messages.unshift(`${message.user}: ${message.message}`);
        }
      });
    }
  }
  

  sendMessage(): void {
    if (this.messagecontent.trim() && this.selectedChannel) {
      this.socketService.sendMessage(this.selectedChannel.name, this.messagecontent, this.username);
      this.messagecontent = ''; // Clear input
    }
  }

  createGroup(): void {
    if (this.newGroupName.trim()) {
      const groupExists = this.groups.some(group => group.name.toLowerCase() === this.newGroupName.trim().toLowerCase());
      if (groupExists) {
        alert('A group with this name already exists. Please choose a different name.');
        return;
      }

      this.socketService.createGroup(this.newGroupName.trim()); // Emit event to server
      this.newGroupName = ''; // Clear input
    }
  }

  createChannel(): void {
    if (this.selectedGroup && this.newChannelName.trim()) {
      const channelExists = this.selectedGroup.channels.some(
        channel => channel.name.toLowerCase() === this.newChannelName.trim().toLowerCase()
      );
      if (channelExists) {
        alert('A channel with this name already exists. Please choose a different name.');
        return;
      }

      const newChannel: Channel = {
        name: this.newChannelName.trim(),
        users: [] // Initialize with empty users array
      };

      // Emit the createChannel event to the server
      this.socketService.createChannel({ groupName: this.selectedGroup.name, channel: newChannel });

      this.newChannelName = ''; // Clear channel name input
      this.isCreatingChannel = false; // Reset the channel creation mode
    }
  }

  addUserToChannel(): void {
    if (this.selectedChannel && this.userToAdd) {
      const user = this.users.find(u => u.username === this.userToAdd);
      if (user) {
        if (!this.selectedChannel.users.some(u => u.username === user.username)) {
          this.selectedChannel.users.push(user);  // Add user to the channel
          this.saveGroups();  // Save groups to local storage
          this.socketService.addUserToChannel(this.selectedChannel.name, user.username); // Emit to server
          alert(`${user.username} has been added to the channel.`);
        } else {
          alert(`${user.username} is already in this channel.`);
        }
      }
    }
  }

  removeGroup(group: Group): void {
    this.groups = this.groups.filter(g => g !== group);
    this.socketService.deleteGroup(group.name); // Persist the deletion on the backend
    this.selectedGroup = null; // Reset selected group
  }

  removeChannel(group: Group, channel: Channel): void {
    group.channels = group.channels.filter(c => c !== channel);
    this.saveGroups(); // Save updated groups after removal
    this.socketService.deleteChannel(channel.name); // Inform backend to delete the channel

    if (this.selectedChannel === channel) {
      this.messages = []; // Clear messages if the selected channel is deleted
      this.selectedChannel = null; // Reset selected channel
    }
  }

  removeUserFromChannel(user: User): void {
    if (this.selectedChannel) {
      this.selectedChannel.users = this.selectedChannel.users.filter(u => u.username !== user.username);
      this.saveGroups(); // Save updated groups after user removal
    }
  }

  banUserFromChannel(user: User): void {
    this.removeUserFromChannel(user);
    alert(`${user.username} has been banned from the channel.`);
  }

  saveGroups(): void {
    localStorage.setItem('groups', JSON.stringify(this.groups)); // Save groups to local storage
  }

  saveUsers(): void {
    localStorage.setItem('users', JSON.stringify(this.users)); // Save users to local storage
  }

  logout(): void {
    sessionStorage.removeItem('currentUser'); // Clear current user from session storage
    this.router.navigate(['/login']); // Redirect to login page
  }

  deleteProfile(): void {
    if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      let users = JSON.parse(localStorage.getItem('users') || '[]');
      users = users.filter((user: any) => user.username !== this.username);
      localStorage.setItem('users', JSON.stringify(users)); // Update users in local storage
      sessionStorage.removeItem('currentUser'); // Clear current user from session storage
      alert('Your profile has been deleted.');
      this.router.navigate(['/login']); // Redirect to login page
    }
  }
}