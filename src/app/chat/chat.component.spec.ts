import { TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SocketService } from '../services/socket.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let mockSocketService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Mock SocketService
    mockSocketService = {
      getGroups: jasmine.createSpy('getGroups').and.callFake(callback => callback([])),
      joinChannel: jasmine.createSpy('joinChannel'),
      sendMessage: jasmine.createSpy('sendMessage'),
      getMessages: jasmine.createSpy('getMessages').and.returnValue(of([])),
      getChatHistory: jasmine.createSpy('getChatHistory').and.returnValue(of([])),
      onGroupListUpdated: jasmine.createSpy('onGroupListUpdated').and.callFake(callback => callback([])),
      onUserJoinOrLeave: jasmine.createSpy('onUserJoinOrLeave').and.callFake(callback => callback("test"))
    };

    // Mock Router
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [ChatComponent, HttpClientTestingModule],  // Import the standalone component
      providers: [
        { provide: SocketService, useValue: mockSocketService },  // Provide mock service
        { provide: Router, useValue: mockRouter }  // Provide mock router
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the chat component', () => {
    expect(component).toBeTruthy();
  });

  it('should call socketService.getGroups on initialization', () => {
    expect(mockSocketService.getGroups).toHaveBeenCalled();
  });

  it('should join a channel when selectChannel is called', () => {
    const channel = { name: 'general', users: [] };
    component.username = 'testuser';

    component.selectChannel(channel);
    expect(mockSocketService.joinChannel).toHaveBeenCalledWith('general', 'testuser');
  });

  it('should send a text message when sendMessage is called with content', () => {
    component.username = 'testuser';
    component.selectedChannel = { name: 'general', users: [] };
    component.messagecontent = 'Hello';

    component.sendMessage();
    expect(mockSocketService.sendMessage).toHaveBeenCalledWith({
      channelName: 'general',
      message: 'Hello',
      user: 'testuser',
      imageUrl: undefined
    });
  });

  it('should send an image when sendMessage is called with image', () => {
    component.username = 'testuser';
    component.selectedChannel = { name: 'general', users: [] };
    component.selectedImage = 'some-base64-image';

    component.sendMessage();
    expect(mockSocketService.sendMessage).toHaveBeenCalledWith({
      channelName: 'general',
      message: '',
      user: 'testuser',
      imageUrl: 'some-base64-image'
    });
  });

  it('should redirect to login if userRole is null', () => {
    component.userRole = null;
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
