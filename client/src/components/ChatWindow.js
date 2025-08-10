import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import moment from 'moment';
import '../styles/ChatWindow.css';

const ChatWindow = ({ conversation, onBack }) => {
  const { messages, sendMessage, currentChat, loading } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(conversation.wa_id, messageInput.trim());

    if (result.success) {
      setMessageInput('');
      setShowEmojiPicker(false);
    } else {
      alert('Failed to send message: ' + result.error);
    }

    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach(message => {
      const date = moment(message.timestamp).format('YYYY-MM-DD');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const formatDateHeader = (date) => {
    const messageDate = moment(date);
    const today = moment();
    const yesterday = moment().subtract(1, 'day');

    if (messageDate.isSame(today, 'day')) {
      return 'Today';
    } else if (messageDate.isSame(yesterday, 'day')) {
      return 'Yesterday';
    } else if (messageDate.isAfter(moment().subtract(7, 'days'))) {
      return messageDate.format('dddd');
    } else {
      return messageDate.format('MMMM D, YYYY');
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const commonEmojis = ['😊', '😂', '❤️', '👍', '😢', '😮', '😡', '👋', '🙏', '💯'];

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Back">
            ←
          </button>
        )}

        <div className="chat-user-info">
          <div className="chat-avatar">
            {currentChat?.profile_picture ? (
              <img 
                src={currentChat.profile_picture} 
                alt={currentChat.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="avatar-placeholder"
              style={{ 
                display: currentChat?.profile_picture ? 'none' : 'flex'
              }}
            >
              {getUserInitials(currentChat?.name)}
            </div>
          </div>

          <div className="user-details">
            <h3>{currentChat?.profile_name || currentChat?.name || 'Unknown User'}</h3>
            <p className="user-status">
              {currentChat?.wa_id && (
                <>
                  {currentChat.wa_id}
                  {currentChat?.is_online ? (
                    <span className="online-status"> • online</span>
                  ) : (
                    currentChat?.last_seen && (
                      <span className="last-seen"> • last seen {moment(currentChat.last_seen).fromNow()}</span>
                    )
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="chat-actions">
          <button className="action-btn" title="Search in chat">
            🔍
          </button>
          <button className="action-btn" title="More options">
            ⋮
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        <div className="messages-list">
          {Object.keys(messageGroups).length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-content">
                <span className="no-messages-icon">💬</span>
                <p>No messages yet</p>
                <small>Start a conversation by sending a message below</small>
              </div>
            </div>
          ) : (
            Object.keys(messageGroups).map(date => (
              <div key={date}>
                <div className="date-separator">
                  <span>{formatDateHeader(date)}</span>
                </div>
                {messageGroups[date].map(message => (
                  <MessageBubble
                    key={message._id || message.id}
                    message={message}
                  />
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-header">
            <span>Frequently used</span>
            <button 
              className="emoji-close"
              onClick={() => setShowEmojiPicker(false)}
            >
              ✕
            </button>
          </div>
          <div className="emoji-grid">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <button
            type="button"
            className="emoji-toggle-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
          >
            😊
          </button>

          <button
            type="button"
            className="attachment-btn"
            title="Attach file"
            onClick={() => alert('File attachment not implemented in this demo')}
          >
            📎
          </button>

          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              className="message-input"
              disabled={sending}
              rows={1}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            type="submit"
            className={`send-btn ${messageInput.trim() ? 'active' : ''}`}
            disabled={!messageInput.trim() || sending}
            title="Send message"
          >
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
