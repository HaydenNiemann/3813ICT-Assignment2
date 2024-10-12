import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';                          // username for login
  password: string = '';                          // password for login   
  newUsername: string = '';                       // username for registration  
  newPassword: string = '';                       // password for registration  
  loginErrorMessage: string = '';                 // error message for login
  registrationErrorMessage: string = '';          // error message for registration
  successMessage: string = '';                    // success message for registration   
  showRegistration: boolean = false;              // flag to show/hide registration form 

  users = [                                       // list of users hardcoded for demo
    { username: 'super', password: '123', role: 'SuperAdmin' }, 
    { username: 'admin', password: 'admin', role: 'GroupAdmin' },
    { username: 'user', password: 'user', role: 'User' }
  ];

  constructor(private router: Router, private socketService: SocketService) {    
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');    // get users from local storage
    if (storedUsers.length > 0) {                                             // if users exist, use them    
      this.users = storedUsers;                                               // else use hardcoded users          
    }
  }

  login() {                                                                   // login function
    if (!this.username.trim() || !this.password.trim()) {                     // check if username and password are entered     
      this.loginErrorMessage = 'Please enter both username and password.';    // if not, show error message
      return;
    }

    const user = this.users.find(                                             // find user in the list of users     
      u => u.username === this.username && u.password === this.password       // based on username and password
    );

    if (user) {                                                               // if user is found, navigate to chat page   
      sessionStorage.setItem('currentUser', JSON.stringify({                   // store user in session storage
        username: user.username,                                              
        role: user.role                                                        // to show username and role
      }));
      this.router.navigate(['/chat']);                                         // navigate to chat page   
    } else {
      this.loginErrorMessage = 'Invalid credentials, please try again.';       // if user is not found, show error message
      this.registrationErrorMessage = '';                                      // clear registration error message 
    }
  }

  register() {                                                                 // register function
    const existingUser = this.users.find(u => u.username === this.newUsername);

    if (existingUser) {                                                        // check if username is already taken
      this.loginErrorMessage = '';
      this.registrationErrorMessage = 'Username already taken. Please choose a different one.';
    } else {
      const newUser = { username: this.newUsername, password: this.newPassword, role: 'User' };
      this.users.push(newUser);                                                // add new user to users array
      localStorage.setItem('users', JSON.stringify(this.users));               // save users to local storage

      // Emit the event to save the user in MongoDB via SocketService
      this.socketService.saveUser(newUser);                                    // Emit saveUser event

      this.successMessage = 'Registration successful! You can now log in.';
      this.registrationErrorMessage = '';
      this.loginErrorMessage = '';

      this.newUsername = '';
      this.newPassword = '';
      this.showRegistration = false;                                           // toggle off registration form
    }
  }

  toggleRegistration() {                                                       // function to toggle between login and registration forms
    this.showRegistration = !this.showRegistration;                            // show registration form if hidden and vice versa
    this.successMessage = '';                                                  // clear success message     
    this.loginErrorMessage = '';                                               // clear login error message  
    this.registrationErrorMessage = '';                                        // clear registration error message 
  }
}
