// src/components/voice/VoiceMicButton.jsx
import React, { useState, useEffect, useRef } from 'react';

const VoiceMicButton = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) onTranscript(transcript);
      setIsListening(false);
      setError(null);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
      } else {
        setError('Voice input failed. Try again.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onTranscript]);

  const handleClick = () => {
    if (!isSupported) return;

    setError(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setError('Could not start voice input.');
        setIsListening(false);
      }
    }
  };

  return (
    <>
      <style>{`
        .voice-btn-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .voice-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C8521A;
          transition: background-color 0.2s, color 0.2s;
          position: relative;
          z-index: 1;
          padding: 0;
        }

        .voice-btn:hover:not(:disabled) {
          background-color: rgba(200, 82, 26, 0.1);
        }

        .voice-btn:disabled {
          color: #6B6460;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .voice-btn.listening {
          color: #ef4444;
        }

        .voice-btn svg {
          width: 18px;
          height: 18px;
        }

        /* Pulsing ring when listening */
        .voice-pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: voicePulse 1.2s ease-out infinite;
          pointer-events: none;
        }

        .voice-pulse-ring-2 {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1.5px solid rgba(239, 68, 68, 0.4);
          animation: voicePulse 1.2s ease-out infinite 0.4s;
          pointer-events: none;
        }

        @keyframes voicePulse {
          0% {
            transform: scale(0.85);
            opacity: 1;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        /* Tooltip for errors */
        .voice-error-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #1A1A1A;
          color: #F7F6F3;
          font-size: 11px;
          font-family: 'Inter', -apple-system, sans-serif;
          white-space: nowrap;
          padding: 4px 8px;
          border-radius: 4px;
          pointer-events: none;
          z-index: 10;
        }

        .voice-error-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1A1A1A;
        }

        /* Unsupported fallback */
        .voice-unsupported-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background-color: #6B6460;
          color: #F7F6F3;
          font-size: 11px;
          font-family: 'Inter', -apple-system, sans-serif;
          white-space: nowrap;
          padding: 4px 8px;
          border-radius: 4px;
          pointer-events: none;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .voice-btn-wrapper:hover .voice-unsupported-tooltip {
          opacity: 1;
        }
      `}</style>

      <div className="voice-btn-wrapper">
        {/* Unsupported browser fallback tooltip */}
        {!isSupported && (
          <div className="voice-unsupported-tooltip">
            Voice not supported in this browser
          </div>
        )}

        {/* Error tooltip */}
        {error && isSupported && (
          <div className="voice-error-tooltip">{error}</div>
        )}

        {/* Pulse rings when listening */}
        {isListening && (
          <>
            <span className="voice-pulse-ring" />
            <span className="voice-pulse-ring-2" />
          </>
        )}

        <button
          className={`voice-btn${isListening ? ' listening' : ''}`}
          onClick={handleClick}
          disabled={!isSupported}
          title={
            !isSupported
              ? 'Voice input not supported'
              : isListening
              ? 'Tap to stop'
              : 'Voice input'
          }
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          aria-pressed={isListening}
        >
          {isListening ? (
            /* Active: filled mic with red color */
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          ) : (
            /* Idle: outline mic */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export { VoiceMicButton };
export default VoiceMicButton;