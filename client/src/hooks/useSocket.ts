import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/lib/socket';

export const useSocket = () => {
  const socketRef = useRef(socketService);

  const connect = useCallback(() => {
    return socketRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current.disconnect();
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current.leaveConversation(conversationId);
  }, []);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    socketRef.current.onNewMessage(callback);
    
    return () => {
      socketRef.current.removeAllListeners('new_message');
    };
  }, []);

  const onConversationUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current.onConversationUpdate(callback);
    
    return () => {
      socketRef.current.removeAllListeners('conversation_updated');
    };
  }, []);

  const onConversationListUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current.onConversationListUpdate(callback);
    
    return () => {
      socketRef.current.removeAllListeners('conversation_list_updated');
    };
  }, []);

  const isConnected = useCallback(() => {
    return socketRef.current.isSocketConnected();
  }, []);

  return {
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onConversationUpdate,
    onConversationListUpdate,
    isConnected,
  };
};
