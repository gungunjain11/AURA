// src/components/chat/MessageBubble.jsx
import React from 'react';

const MessageBubble = ({ role, content, citations = [] }) => {
  const isUser = role === 'user';

  return (
    <>
      <style>{`
        .bubble-wrapper {
          display: flex;
          flex-direction: column;
          align-items: ${isUser ? 'flex-end' : 'flex-start'};
          margin-bottom: 16px;
          width: 100%;
        }

        .bubble-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex-direction: ${isUser ? 'row-reverse' : 'row'};
          max-width: 75%;
        }

        .bubble-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Inter', -apple-system, sans-serif;
          letter-spacing: 0.5px;
          background-color: ${isUser ? '#C8521A' : '#0E1E35'};
          color: #ffffff;
        }

        .bubble-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: ${isUser ? 'flex-end' : 'flex-start'};
        }

        .bubble-text {
          padding: 10px 14px;
          border-radius: ${isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
          font-size: 13px;
          line-height: 1.6;
          font-family: 'Inter', -apple-system, sans-serif;
          color: ${isUser ? '#ffffff' : '#1A1A1A'};
          background-color: ${isUser ? '#C8521A' : '#ffffff'};
          border: ${isUser ? 'none' : '1px solid #E5E2DB'};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          white-space: pre-wrap;
          word-break: break-word;
        }

        .bubble-citations {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
          padding-left: 2px;
        }

        .citation-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background-color: #F7F6F3;
          border: 1px solid #E5E2DB;
          border-radius: 20px;
          font-size: 11px;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #6B6460;
          cursor: default;
          transition: border-color 0.15s, color 0.15s;
        }

        .citation-chip:hover {
          border-color: #0E1E35;
          color: #0E1E35;
        }

        .citation-chip-icon {
          width: 10px;
          height: 10px;
          color: #C8521A;
          flex-shrink: 0;
        }

        .citation-chip-source {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .citation-chip-page {
          color: #C8521A;
          font-weight: 600;
          flex-shrink: 0;
        }

        .bubble-timestamp {
          font-size: 10px;
          color: #6B6460;
          font-family: 'Inter', -apple-system, sans-serif;
          margin-top: 2px;
          padding: 0 2px;
        }
      `}</style>

      <div className="bubble-wrapper">
        <div className="bubble-row">
          {/* Avatar */}
          <div className="bubble-avatar">
            {isUser ? 'YOU' : 'AU'}
          </div>

          <div className="bubble-content">
            {/* Message text */}
            <div className="bubble-text">
              {content}
            </div>

            {/* Citation chips — only for assistant */}
            {!isUser && citations.length > 0 && (
              <div className="bubble-citations">
                {citations.map((cite, idx) => (
                  <span className="citation-chip" key={idx} title={`${cite.source} — Page ${cite.page}`}>
                    <svg className="citation-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="citation-chip-source">{cite.source}</span>
                    <span className="citation-chip-page">p.{cite.page}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="bubble-timestamp">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </>
  );
};

export { MessageBubble };
export default MessageBubble;