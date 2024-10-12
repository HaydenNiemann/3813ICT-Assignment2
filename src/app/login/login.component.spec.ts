import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: any;
  let mockSocketService: any;

  beforeEach(async () => {
    mockRouter = { navigate: jasmine.createSpy('navigate') };
    mockSocketService = { saveUser: jasmine.createSpy('saveUser') };

    await TestBed.configureTestingModule({
      imports: [FormsModule, CommonModule, LoginComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SocketService, useValue: mockSocketService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should call login method with valid credentials', () => {
    component.username = 'super';
    component.password = '123';

    component.login();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
    expect(sessionStorage.getItem('currentUser')).toEqual(JSON.stringify({
      username: 'super',
      role: 'SuperAdmin'
    }));
  });

  it('should show error message for invalid login credentials', () => {
    component.username = 'wrong';
    component.password = 'wrong';

    component.login();

    expect(component.loginErrorMessage).toBe('Invalid credentials, please try again.');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should register a new user successfully', () => {
    component.newUsername = 'newuser';
    component.newPassword = 'password';
    
    component.register();
    
    expect(mockSocketService.saveUser).toHaveBeenCalled();
    expect(localStorage.getItem('users')).toContain('newuser');
    expect(component.successMessage).toBe('Registration successful! You can now log in.');
  });

  it('should not register a user with an existing username', () => {
    component.newUsername = 'super'; // Already existing username
    component.newPassword = 'password';

    component.register();

    expect(component.registrationErrorMessage).toBe('Username already taken. Please choose a different one.');
    expect(mockSocketService.saveUser).not.toHaveBeenCalled();
  });

  it('should toggle between login and registration forms', () => {
    component.showRegistration = false;
    component.toggleRegistration();
    expect(component.showRegistration).toBeTrue();

    component.toggleRegistration();
    expect(component.showRegistration).toBeFalse();
  });
});
