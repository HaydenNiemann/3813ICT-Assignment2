import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { io, Socket } from 'socket.io-client';

describe('SocketService', () => {
  let service: SocketService;
  let mockSocket: jasmine.SpyObj<Socket>;

  beforeEach(() => {
    // Mock the socket methods like emit, on, and off
    mockSocket = jasmine.createSpyObj('Socket', ['emit', 'on', 'off']);
    
    // Mock the `io` function to return the mockSocket when called
    spyOn<any>(io, 'connect').and.returnValue(mockSocket); // Cast to any to avoid TypeScript issues
    
    // Configure the testing module
    TestBed.configureTestingModule({
      providers: [SocketService]
    });

    // Inject the service to be tested
    service = TestBed.inject(SocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call joinChannel with correct parameters', () => {
    service.joinChannel('testChannel', 'testUser');
    expect(mockSocket.emit).toHaveBeenCalledWith('joinChannel', { channelName: 'testChannel', username: 'testUser' });
  });

  it('should send a message to the correct channel', () => {
    const messageData = {
      channelName: 'testChannel',
      message: 'Hello',
      user: 'testUser'
    };
    service.sendMessage(messageData);
    expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', messageData);
  });

  it('should call getMessages and listen for new messages', () => {
    const callback = jasmine.createSpy('callback');
    service.getMessages(callback);
    expect(mockSocket.on).toHaveBeenCalledWith('newMessage', jasmine.any(Function));
  });

  it('should call getChatHistory and listen for chat history', () => {
    const callback = jasmine.createSpy('callback');
    service.getChatHistory(callback);
    expect(mockSocket.on).toHaveBeenCalledWith('chatHistory', jasmine.any(Function));
  });

  it('should emit deleteChannel with the correct channel name', () => {
    service.deleteChannel('testChannel');
    expect(mockSocket.emit).toHaveBeenCalledWith('deleteChannel', 'testChannel');
  });

  it('should request channels and listen for channelList event', () => {
    const callback = jasmine.createSpy('callback');
    service.getChannels(callback);
    expect(mockSocket.emit).toHaveBeenCalledWith('requestChannels');
    expect(mockSocket.on).toHaveBeenCalledWith('channelList', jasmine.any(Function));
  });

  it('should emit createGroup with the correct group name', () => {
    service.createGroup('testGroup');
    expect(mockSocket.emit).toHaveBeenCalledWith('createGroup', 'testGroup');
  });

  it('should emit deleteGroup with the correct group name', () => {
    service.deleteGroup('testGroup');
    expect(mockSocket.emit).toHaveBeenCalledWith('deleteGroup', 'testGroup');
  });

  it('should listen for updated group list', () => {
    const callback = jasmine.createSpy('callback');
    service.onGroupListUpdated(callback);
    expect(mockSocket.on).toHaveBeenCalledWith('groupList', jasmine.any(Function));
  });

  it('should emit addUserToChannel with correct channel name and username', () => {
    service.addUserToChannel('testChannel', 'testUser');
    expect(mockSocket.emit).toHaveBeenCalledWith('addUserToChannel', { channelName: 'testChannel', username: 'testUser' });
  });

  it('should save user to the database via saveUser event', () => {
    const newUser = { username: 'testUser', password: 'testPass', role: 'User' };
    service.saveUser(newUser);
    expect(mockSocket.emit).toHaveBeenCalledWith('saveUser', newUser);
  });

  it('should listen for userJoinOrLeave events and trigger the callback', () => {
    const callback = jasmine.createSpy('callback');
    service.onUserJoinOrLeave(callback);
    expect(mockSocket.on).toHaveBeenCalledWith('userJoined', jasmine.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('userLeft', jasmine.any(Function));
  });
});
