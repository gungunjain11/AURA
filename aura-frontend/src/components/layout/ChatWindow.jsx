// src/components/layout/ChatWindow.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceMicButton } from '../voice/VoiceMicButton';
import { useStreaming } from '../chat/StreamingHandler';
import { queryAPI } from '../../api/client';

const SUGGESTED_QUERIES = [
  { id: 1, text: 'Safe isolation procedure for Pump-7 before maintenance?' },
  { id: 2, text: 'Check PTW register against OISD-116 requirements' },
  { id: 3, text: 'Gas detector miss near coke battery 3 — why?' },
  { id: 4, text: 'Hot work permit rules near elevated H2S zones?' },
];

const WelcomeScreen = ({ onSuggest, role }) => (
  <div className="cw-welcome">
    <div className="cw-welcome-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8521A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    </div>
    <h2 className="cw-welcome-title">Good morning, {role === 'safety_officer' ? 'Safety Officer' : (role === 'field_tech' ? 'Field Tech' : 'Engineer')}</h2>
    <p className="cw-welcome-sub">
      Ask AURA anything about your plant's documents, procedures, compliance status, or equipment history.
    </p>
    <div className="cw-suggestions">
      {SUGGESTED_QUERIES.map(q => (
        <button key={q.id} className="cw-suggestion-chip" onClick={() => onSuggest(q.text)}>
          <span className="cw-chip-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          {q.text}
        </button>
      ))}
    </div>
  </div>
);

const CitationBadge = ({ source, page }) => (
  <span className="cw-citation">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
    {source}{page ? ` · p.${page}` : ''}
  </span>
);

const MessageBubble = ({ role, content, citations, isStreaming }) => (
  <div className={`cw-message cw-message--${role}`}>
    {role === 'assistant' && (
      <div className="cw-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4l3 3"/>
        </svg>
      </div>
    )}
    <div className="cw-bubble-wrap">
      <div className={`cw-bubble cw-bubble--${role}`}>
        <p className="cw-bubble-text">
          {content}
          {isStreaming && <span className="cw-cursor" />}
        </p>
      </div>
      {citations && citations.length > 0 && (
        <div className="cw-citations-row">
          {citations.map((c, i) => {
            const label = c.source || c.filename || 'Source Document';
            const pageNum = c.page_number || c.page || '';
            return <CitationBadge key={i} source={label} page={pageNum} />;
          })}
        </div>
      )}
    </div>
    {role === 'user' && (
      <div className="cw-avatar cw-avatar--user">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1E35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    )}
  </div>
);

export const ChatWindow = ({ activeNav, role, onRoleChange }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const streamedTextRef = useRef(''); // lives in latest-value form, free of stale closures
  const citationsRef = useRef([]);
  const { streamedText, citations, isStreaming, startStreaming, getAbortController, reset } = useStreaming();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    streamedTextRef.current = streamedText;
  }, [streamedText]);

  useEffect(() => {
    citationsRef.current = citations;
  }, [citations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  const handleSend = useCallback(async (text) => {
    const query = (text || input).trim();
    if (!query || isStreaming) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    reset();

    try {
      const controller = getAbortController();
      const response = await queryAPI(query, role, controller.signal);
      await startStreaming(response);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: streamedTextRef.current || '',
        citations: citationsRef.current || [],
      }]);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Query failed:', err);
      }
    }
  }, [input, isStreaming, reset, getAbortController, startStreaming, role]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="cw-root">
      <style>{`
        .cw-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Welcome screen */
        .cw-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 40px 24px;
          text-align: center;
        }

        .cw-welcome-icon {
          width: 56px;
          height: 56px;
          background-color: rgba(200, 82, 26, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .cw-welcome-title {
          font-size: 20px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 8px;
        }

        .cw-welcome-sub {
          font-size: 13px;
          color: #6B6460;
          max-width: 380px;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .cw-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 480px;
        }

        .cw-suggestion-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          background-color: #FFFFFF;
          border: 1px solid #E5E2DB;
          border-radius: 8px;
          font-size: 13px;
          color: #1A1A1A;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .cw-suggestion-chip:hover {
          border-color: #C8521A;
          background-color: rgba(200, 82, 26, 0.03);
          color: #C8521A;
        }

        .cw-chip-icon {
          color: #6B6460;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .cw-suggestion-chip:hover .cw-chip-icon {
          color: #C8521A;
        }

        /* Message list */
        .cw-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cw-messages::-webkit-scrollbar { width: 5px; }
        .cw-messages::-webkit-scrollbar-track { background: transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background-color: #E5E2DB; border-radius: 3px; }

        /* Messages */
        .cw-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .cw-message--user {
          flex-direction: row-reverse;
        }

        .cw-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: rgba(200, 82, 26, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .cw-avatar--user {
          background-color: #E8E4DF;
        }

        .cw-bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 72%;
        }

        .cw-message--user .cw-bubble-wrap {
          align-items: flex-end;
        }

        .cw-bubble {
          padding: 11px 15px;
          border-radius: 12px;
          line-height: 1.6;
        }

        .cw-bubble--user {
          background-color: #0E1E35;
          border-bottom-right-radius: 3px;
        }

        .cw-bubble--assistant {
          background-color: #FFFFFF;
          border: 1px solid #E5E2DB;
          border-bottom-left-radius: 3px;
        }

        .cw-bubble-text {
          font-size: 13px;
          color: #1A1A1A;
          margin: 0;
        }

        .cw-bubble--user .cw-bubble-text {
          color: #FFFFFF;
        }

        .cw-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background-color: #C8521A;
          margin-left: 2px;
          vertical-align: middle;
          animation: cw-blink 0.8s step-end infinite;
        }

        @keyframes cw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Citations */
        .cw-citations-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 2px;
        }

        .cw-citation {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6B6460;
          background-color: #F7F6F3;
          border: 1px solid #E5E2DB;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .cw-citation:hover {
          border-color: #C8521A;
          color: #C8521A;
        }

        /* Input bar */
        .cw-input-area {
          padding: 16px 24px;
          background-color: #F7F6F3;
          border-top: 1px solid #E5E2DB;
          flex-shrink: 0;
        }

        .cw-input-wrapper {
          display: flex;
          align-items: center;
          background-color: #FFFFFF;
          border: 1px solid #E5E2DB;
          border-radius: 28px;
          padding: 10px 10px 10px 18px;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: border-color 0.15s;
        }

        .cw-input-wrapper:focus-within {
          border-color: #C8521A;
          box-shadow: 0 0 0 3px rgba(200,82,26,0.08);
        }

        .cw-mic-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: none;
          border: none;
          cursor: pointer;
          color: #C8521A;
          flex-shrink: 0;
          border-radius: 50%;
          transition: background-color 0.15s;
          padding: 0;
        }

        .cw-mic-btn:hover {
          background-color: rgba(200,82,26,0.08);
        }

        .cw-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13px;
          color: #1A1A1A;
          outline: none;
          resize: none;
          line-height: 1.5;
          max-height: 96px;
          min-height: 20px;
        }

        .cw-input::placeholder { color: #9C9490; }

        .cw-send-btn {
          width: 32px;
          height: 32px;
          background-color: #0E1E35;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background-color 0.15s, transform 0.1s;
          padding: 0;
        }

        .cw-send-btn:hover { background-color: #1A3050; }
        .cw-send-btn:active { transform: scale(0.94); }
        .cw-send-btn:disabled { background-color: #D3D1C7; cursor: not-allowed; }

        .cw-input-hint {
          font-size: 11px;
          color: #9C9490;
          text-align: center;
          margin-top: 8px;
          letter-spacing: 0.2px;
        }

        @media (max-width: 768px) {
          .cw-messages { padding: 16px; }
          .cw-input-area { padding: 12px 16px; }
          .cw-bubble-wrap { max-width: 86%; }
          .cw-welcome { padding: 24px 16px; }
        }
      `}</style>

      {showWelcome ? (
        <WelcomeScreen onSuggest={(text) => handleSend(text)} role={role} />
      ) : (
        <div className="cw-messages">
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              role={msg.role}
              content={msg.content}
              citations={msg.citations}
            />
          ))}

          {isStreaming && (
            <MessageBubble
              role="assistant"
              content={streamedText}
              citations={citations}
              isStreaming={true}
            />
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div className="cw-input-area">
        <div className="cw-input-wrapper">
          <select 
            value={role} 
            onChange={e => onRoleChange(e.target.value)}
            title="Select query persona"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '11px',
              fontWeight: 600,
              color: '#C8521A',
              cursor: 'pointer',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              paddingRight: '8px',
              borderRight: '1px solid #E5E2DB',
              marginRight: '4px',
              height: '24px'
            }}
          >
            <option value="engineer">Engineer</option>
            <option value="safety_officer">Safety Officer</option>
            <option value="field_tech">Field Tech</option>
          </select>

          <VoiceMicButton onTranscript={(text) => {
            setInput(text);
            handleSend(text);
          }} />

          <textarea
            ref={inputRef}
            className="cw-input"
            placeholder="Ask AURA anything — procedures, compliance, equipment history…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <button
            className="cw-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            title="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="cw-input-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default ChatWindow;