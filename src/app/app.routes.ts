import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },           // login route
  { path: 'chat', component: ChatComponent },             // chat route
  { path: '', redirectTo: 'login', pathMatch: 'full' }    // default route to login page
];
