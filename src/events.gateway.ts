import {
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  
  @WebSocketGateway(3002,{
    cors: {
      origin: '*',
    },
  })
  export class EventsGateway {
    @WebSocketServer()
    server: Server;
  }