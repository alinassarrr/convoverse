import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Join a conversation room
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation_${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} joined conversation ${data.conversationId}`,
    );
    return {
      event: 'joined_conversation',
      data: { conversationId: data.conversationId },
    };
  }

  // Leave a conversation room
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation_${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} left conversation ${data.conversationId}`,
    );
    return {
      event: 'left_conversation',
      data: { conversationId: data.conversationId },
    };
  }

  // Emit new message to all clients in a conversation
  emitNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation_${conversationId}`).emit('new_message', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted new message to conversation ${conversationId}`);
  }

  // Emit conversation update to all clients
  emitConversationUpdate(conversationId: string, update: any) {
    this.server
      .to(`conversation_${conversationId}`)
      .emit('conversation_updated', {
        conversationId,
        update,
        timestamp: new Date().toISOString(),
      });
    this.logger.log(`Emitted conversation update for ${conversationId}`);
  }

  // Emit action update to conversation
  emitActionUpdate(conversationId: string, action: any) {
    this.server.to(`conversation_${conversationId}`).emit('action_updated', {
      conversationId,
      action,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted action update for conversation ${conversationId}`);
  }

  // Emit summary update to conversation
  emitSummaryUpdate(conversationId: string, summary: any) {
    this.server.to(`conversation_${conversationId}`).emit('summary_updated', {
      conversationId,
      summary,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `Emitted summary update for conversation ${conversationId}`,
    );
  }

  // Emit to all clients (for global updates)
  emitGlobalUpdate(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted global update: ${event}`);
  }
}
