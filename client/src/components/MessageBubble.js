import React from 'react';
import moment from 'moment';
import '../styles/MessageBubble.css';

const MessageBubble = ({ message }) => {
  const isFromMe = message.is_from_me;

  const formatTime = (timestamp) => {
    return moment(timestamp).format('HH:mm');
  };

  const getStatusIcon = (status) => {
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

  const renderMessageContent = () => {
    const content = message.content || '';

    switch (message.message_type) {
      case 'text':
        return (
          <div className="message-text">
            {content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        );

      case 'image':
        return (
          <div className="media-message image-message">
            <div className="media-placeholder">
              <span className="media-icon">📷</span>
              <span className="media-type">Image</span>
            </div>
            {message.media_caption && (
              <div className="media-caption">{message.media_caption}</div>
            )}
            <div className="media-info">
              {content.replace('📷 Image: ', '') || 'Photo'}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="media-message audio-message">
            <div className="media-placeholder">
              <span className="media-icon">🎵</span>
              <span className="media-type">Audio</span>
            </div>
            <div className="audio-controls">
              <button className="play-btn" disabled>
                ▶️
              </button>
              <div className="audio-waveform">
                <div className="waveform-bar"></div>
                <div className="waveform-bar"></div>
                <div className="waveform-bar"></div>
                <div className="waveform-bar"></div>
                <div className="waveform-bar"></div>
              </div>
              <span className="audio-duration">0:45</span>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="media-message video-message">
            <div className="media-placeholder">
              <span className="media-icon">🎥</span>
              <span className="media-type">Video</span>
            </div>
            <div className="video-controls">
              <button className="play-btn" disabled>
                ▶️
              </button>
              <span className="video-duration">1:23</span>
            </div>
            {message.media_caption && (
              <div className="media-caption">{message.media_caption}</div>
            )}
            <div className="media-info">
              {content.replace('🎥 Video: ', '') || 'Video'}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="media-message document-message">
            <div className="document-content">
              <div className="document-icon">
                <span>📄</span>
              </div>
              <div className="document-info">
                <div className="document-name">
                  {content.replace('📄 Document: ', '') || 'Document'}
                </div>
                <div className="document-size">PDF • 2.3 MB</div>
              </div>
              <button className="download-btn" disabled>
                ⬇️
              </button>
            </div>
          </div>
        );

      case 'sticker':
        return (
          <div className="media-message sticker-message">
            <div className="sticker-placeholder">
              <span className="sticker-icon">🎭</span>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="media-message location-message">
            <div className="location-placeholder">
              <span className="location-icon">📍</span>
              <span className="location-text">Location shared</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="message-text">
            {content}
          </div>
        );
    }
  };

  return (
    <div className={`message-bubble ${isFromMe ? 'from-me' : 'from-them'}`}>
      <div className="message-content">
        {renderMessageContent()}

        <div className="message-meta">
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span className={`message-status ${message.status === 'read' ? 'read' : ''}`}>
              {getStatusIcon(message.status)}
            </span>
          )}
        </div>
      </div>

      {/* Message tail/pointer */}
      <div className="message-tail"></div>
    </div>
  );
};

export default MessageBubble;
