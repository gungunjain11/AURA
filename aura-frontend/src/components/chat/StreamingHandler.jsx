// src/components/chat/StreamingHandler.jsx
import { useState, useCallback, useRef } from 'react';

const useStreaming = () => {
  const [streamedText, setStreamedText] = useState('');
  const [citations, setCitations] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const readerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const startStreaming = useCallback(async (response) => {
    if (!response || !response.body) {
      setError('Invalid response: no readable stream found.');
      return;
    }

    if (!response.ok) {
      setError(`Request failed with status ${response.status}.`);
      return;
    }

    // Reset state for new stream
    setStreamedText('');
    setCitations([]);
    setError(null);
    setIsStreaming(true);

    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'token'; // Default to token mode

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last (potentially incomplete) line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Check for SSE Event Marker
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } 
          // Check for SSE Data Marker
          else if (trimmed.startsWith('data:')) {
            const payload = trimmed.slice(5).trim();

            if (payload === '[DONE]' || currentEvent === 'done') {
              break;
            }

            if (currentEvent === 'citation') {
              try {
                const parsedCitations = JSON.parse(payload);
                setCitations(parsedCitations);
              } catch (e) {
                console.error('Failed to parse citations payload:', e);
              }
            } else if (currentEvent === 'token') {
              // Append token text
              setStreamedText((prev) => prev + payload);
            } else if (currentEvent === 'error') {
              setError(payload);
            } else {
              // Fallback handling
              try {
                const parsed = JSON.parse(payload);
                if (Array.isArray(parsed)) {
                  setCitations(parsed);
                } else if (parsed?.delta?.text) {
                  setStreamedText((prev) => prev + parsed.delta.text);
                } else {
                  setStreamedText((prev) => prev + payload);
                }
              } catch {
                setStreamedText((prev) => prev + payload);
              }
            }
          } else {
            // Plain text stream (non-SSE)
            setStreamedText((prev) => prev + trimmed);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Intentional abort — not an error
        return;
      }
      setError('Stream interrupted. Please try again.');
    } finally {
      setIsStreaming(false);
      readerRef.current = null;
    }
  }, []);

  // Call this to stop mid-stream (e.g. user hits Stop button)
  const stopStreaming = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Returns a fresh AbortController for each fetch — use in queryAPI()
  const getAbortController = useCallback(() => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // Reset everything (call before starting a brand new conversation turn)
  const reset = useCallback(() => {
    stopStreaming();
    setStreamedText('');
    setCitations([]);
    setError(null);
  }, [stopStreaming]);

  return {
    streamedText,
    citations,
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    getAbortController,
    reset,
  };
};

export { useStreaming };
export default useStreaming;