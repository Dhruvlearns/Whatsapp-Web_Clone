import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import moment from 'moment';
import '../styles/ConversationList.css';

const ConversationList = ({ conversations, selectedConversation, onConversationSelect, loading }) => {
  const { fetchMessages } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const handleConversationClick = async (conversation) => {
    onConversationSelect(conversation);
    await fetchMessages(conversation.wa_id);
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    return conversations.filter(conv =>
      conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user?.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const messageTime = moment(timestamp);
    const now = moment();

    if (now.diff(messageTime, 'days') === 0) {
      return messageTime.format('HH:mm');
    } else if (now.diff(messageTime, 'days') === 1) {
      return 'Yesterday';
    } else if (now.diff(messageTime, 'days') < 7) {
      return messageTime.format('dddd');
    } else {
      return messageTime.format('DD/MM/YYYY');
    }
  };

  const truncateMessage = (message, maxLength = 45) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getStatusIcon = (status, isFromMe) => {
    if (!isFromMe) return '';

    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="conversations-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="conversations-container">
      {/* Search Box */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="conversations-list">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {searchQuery ? (
              <div className="search-no-results">
                <p>No conversations found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="empty-conversations">
                <span className="empty-icon">💬</span>
                <p>No conversations yet</p>
                <small>Start a conversation to see it here</small>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.wa_id}
              className={`conversation-item ${
                selectedConversation?.wa_id === conversation.wa_id ? 'selected' : ''
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              {/* Avatar */}
              <div className="conversation-avatar">
                {conversation.user?.profile_picture ? (
                  <img 
                    src={conversation.user.profile_picture} 
                    alt={conversation.user.name || 'User'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="avatar-placeholder"
                  style={{ 
                    display: conversation.user?.profile_picture ? 'none' : 'flex'
                  }}
                >
                  {getUserInitials(conversation.user?.name || 'Unknown')}
                </div>
              </div>

              {/* Content */}
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3 className="conversation-name">
                    {conversation.user?.profile_name || conversation.user?.name || 'Unknown User'}
                  </h3>
                  <span className="conversation-time">
                    {formatTime(conversation.lastMessage?.timestamp)}
                  </span>
                </div>

                <div className="conversation-preview">
                  <div className="last-message">
                    {conversation.lastMessage?.is_from_me && (
                      <span className={`message-status ${
                        conversation.lastMessage?.status === 'read' ? 'read' : ''
                      }`}>
                        {getStatusIcon(conversation.lastMessage?.status, conversation.lastMessage?.is_from_me)}
                      </span>
                    )}
                    <span className="message-text">
                      {truncateMessage(conversation.lastMessage?.content)}
                    </span>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <div className="unread-badge">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Online indicator */}
              {conversation.user?.is_online && (
                <div className="online-indicator" title="Online"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
