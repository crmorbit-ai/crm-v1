import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../../services/aiService';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! Welcome to CRM AI Assistant. How can I help you today?',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setTimeout(() => handleSendMessage(transcript), 500);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    // Load voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Premium female voice
  const speakText = (text) => {
    if ('speechSynthesis' in window && voiceMode) {
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[*#_`•]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/\n+/g, '. ')
        .substring(0, 500);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();

      // Find best female voice
      const femaleVoice = voices.find(v =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Moira') ||
        v.name.includes('Tessa') ||
        v.name.includes('Microsoft Zira')
      ) || voices.find(v => v.lang.includes('en'));

      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.rate = 1.05;
      utterance.pitch = 1.15;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleSendMessage = async (voiceText = null) => {
    const messageText = voiceText || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText, time: new Date() }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await aiService.chat(messageText);
      const aiText = response?.data?.response || response?.response || 'I apologize, I could not process your request.';

      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: aiText, time: new Date() }]);

      if (voiceMode) {
        setTimeout(() => speakText(aiText), 300);
      }
    } catch (error) {
      setIsTyping(false);
      const errorMsg = error.response?.data?.message || error.message || 'Something went wrong';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        isError: true,
        time: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.log('Speech recognition error');
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {/* Online indicator */}
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '14px',
          height: '14px',
          background: '#22c55e',
          borderRadius: '50%',
          border: '2px solid white'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '420px',
      height: '600px',
      background: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        padding: '20px 24px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              AI
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '17px', letterSpacing: '-0.3px' }}>
                CRM Assistant
              </div>
              <div style={{
                fontSize: '13px',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#4ade80',
                  borderRadius: '50%',
                  display: 'inline-block'
                }} />
                Online
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Voice toggle */}
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              style={{
                background: voiceMode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              title={voiceMode ? 'Voice ON' : 'Voice OFF'}
            >
              {voiceMode ? '🔊' : '🔇'}
            </button>
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {/* Message bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : msg.isError ? '#fef2f2' : '#ffffff',
              color: msg.role === 'user' ? '#fff' : msg.isError ? '#dc2626' : '#1e293b',
              fontSize: '14px',
              lineHeight: '1.6',
              boxShadow: msg.role === 'user'
                ? 'none'
                : '0 2px 12px rgba(0, 0, 0, 0.06)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {msg.content}
            </div>

            {/* Time & actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
              paddingLeft: msg.role === 'user' ? '0' : '4px',
              paddingRight: msg.role === 'user' ? '4px' : '0'
            }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {formatTime(msg.time)}
              </span>
              {msg.role === 'assistant' && !msg.isError && (
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isSpeaking ? '⏹' : '🔊'}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              padding: '16px 20px',
              borderRadius: '20px 20px 20px 6px',
              background: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}>
              <div className="typing-dot" style={{ animationDelay: '0ms' }} />
              <div className="typing-dot" style={{ animationDelay: '150ms' }} />
              <div className="typing-dot" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px 20px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        {/* Speaking indicator */}
        {isSpeaking && (
          <div
            onClick={stopSpeaking}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '12px',
              marginBottom: '12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span className="speaking-wave">🔊</span>
            Speaking... Tap to stop
          </div>
        )}

        {/* Listening indicator */}
        {isListening && (
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '12px',
            marginBottom: '12px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span className="listening-pulse">●</span>
            Listening... Speak now
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* Mic button */}
          <button
            onClick={toggleVoice}
            disabled={isLoading}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : '#f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {isListening ? '🎙️' : '🎤'}
          </button>

          {/* Input */}
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isListening}
              style={{
                width: '100%',
                padding: '14px 50px 14px 18px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                minHeight: '48px',
                maxHeight: '120px',
                background: isListening ? '#f1f5f9' : '#fff',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              rows={1}
            />

            {/* Send button inside input */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '8px',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : '#e2e8f0',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={input.trim() && !isLoading ? 'white' : '#94a3b8'}
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Powered by */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '11px',
          color: '#94a3b8'
        }}>
          Powered by Gemini AI
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        .listening-pulse {
          animation: pulse 1s infinite;
        }

        .speaking-wave {
          animation: wave 0.5s infinite alternate;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes wave {
          from { transform: scale(1); }
          to { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default AIChatWidget;
