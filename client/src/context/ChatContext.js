import React, { createContext, useContext, useReducer, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SOCKET_CONNECTED':
      return { ...state, socketConnected: action.payload };

    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'SET_CURRENT_CHAT':
      return { 
        ...state, 
        currentChat: action.payload.user,
        messages: action.payload.messages || []
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        conversations: state.conversations.map(conv => 
          conv.wa_id === action.payload.wa_id
            ? { 
                ...conv, 
                lastMessage: { ...action.payload }, 
                unreadCount: action.payload.is_from_me ? conv.unreadCount : conv.unreadCount + 1
              }
            : conv
        )
      };

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, status: action.payload.status }
            : msg
        )
      };

    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.wa_id === action.payload.wa_id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      };

    default:
      return state;
  }
};

const initialState = {
  conversations: [],
  currentChat: null,
  messages: [],
  loading: false,
  error: null,
  socket: null,
  socketConnected: false
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    let socket = null;

    // Initialize socket connection
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socket.on('connect', () => {
        console.log('🔌 Connected to server');
        dispatch({ type: 'SET_SOCKET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Connection error:', error);
        dispatch({ type: 'SET_SOCKET_CONNECTED', payload: false });
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        dispatch({ type: 'SET_SOCKET_CONNECTED', payload: false });
      });

      socket.on('new_message', (data) => {
        console.log('💬 New message received:', data);
        dispatch({ type: 'ADD_MESSAGE', payload: data.message });
      });

      socket.on('message_status_update', (data) => {
        console.log('📊 Status update:', data);
        dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: data });
      });

      // Store socket reference
      state.socket = socket;

    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to server' });
    }

    // Initial data fetch
    fetchConversations();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socketUrl]);

  const fetchConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`${serverUrl}/api/messages/conversations`);
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch conversations' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchMessages = async (wa_id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`${serverUrl}/api/messages/chat/${wa_id}`);

      dispatch({ 
        type: 'SET_CURRENT_CHAT', 
        payload: {
          user: response.data.user,
          messages: response.data.messages
        }
      });

      // Mark messages as read
      dispatch({ type: 'MARK_MESSAGES_READ', payload: { wa_id } });

      // Join chat room for real-time updates
      if (state.socket && state.socket.connected) {
        state.socket.emit('join_chat', wa_id);
      }

      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch messages' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = async (wa_id, content) => {
    try {
      if (!content.trim()) {
        return { success: false, error: 'Message cannot be empty' };
      }

      const messageData = { wa_id, content: content.trim() };

      // Send via socket for real-time delivery
      if (state.socket && state.socket.connected) {
        state.socket.emit('send_message', messageData);
        return { success: true };
      } else {
        // Fallback to HTTP if socket not available
        const response = await axios.post(`${serverUrl}/api/messages/send`, messageData);
        dispatch({ type: 'ADD_MESSAGE', payload: response.data.message });
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  const searchConversations = (query) => {
    if (!query.trim()) {
      return state.conversations;
    }

    return state.conversations.filter(conv =>
      conv.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
      conv.user?.profile_name?.toLowerCase().includes(query.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const value = {
    ...state,
    fetchConversations,
    fetchMessages,
    sendMessage,
    searchConversations
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
