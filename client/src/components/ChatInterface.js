import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  // Removed unused `currentChat`
  const { conversations, socketConnected, error, loading } = useChat();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="whatsapp-container">
      <div className="whatsapp-wrapper">
        {/* Left Panel - Conversations */}
        <div
          className={`conversations-panel ${
            isMobile && selectedConversation ? 'mobile-hidden' : ''
          }`}
        >
          {/* Header */}
          <div className="conversations-header">
            <div className="user-profile">
              <div className="user-avatar">
                <span>ME</span>
              </div>
              <div className="user-info">
                <h3>WhatsApp Web</h3>
              </div>
            </div>

            <div className="header-actions">
              <button
                className="header-btn"
                title="New chat"
                aria-label="New chat"
              >
                💬
              </button>
              <button
                className="header-btn"
                title="Menu"
                aria-label="Menu"
              >
                ⋮
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {!loading && (
            <div className="connection-status">
              <div
                className={`status-indicator ${
                  socketConnected ? 'connected' : 'disconnected'
                }`}
              >
                <span className="status-dot"></span>
                <span className="status-text">
                  {socketConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Conversations List */}
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            loading={loading}
          />
        </div>

        {/* Right Panel - Chat Window */}
        <div
          className={`chat-panel ${
            isMobile && !selectedConversation ? 'mobile-hidden' : ''
          }`}
        >
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={isMobile ? () => setSelectedConversation(null) : null}
            />
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="whatsapp-logo">
                  <div className="logo-circle">
                    <span className="logo-icon">💬</span>
                  </div>
                </div>
                <h1>WhatsApp Web</h1>
                <p>
                  Send and receive messages without keeping your phone online.
                </p>
                <p>
                  Use WhatsApp on up to 4 linked devices and 1 phone at the same
                  time.
                </p>
                <div className="welcome-features">
                  <div className="feature">
                    <span className="feature-icon">🔒</span>
                    <span>End-to-end encrypted</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">📱</span>
                    <span>Synced across devices</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">⚡</span>
                    <span>Real-time messaging</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
