import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api, type CopilotChatResponse } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: CopilotChatResponse['sources'];
  confidence?: CopilotChatResponse['confidence'];
  limitations?: string[];
  category?: string;
}

interface TradeMindCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  'Why did Strategy 1 return HOLD?',
  'What are the entry rules for Heikin-Ashi Breakout?',
  'Why was my trade or order rejected?',
  'What risk limits and circuit breakers are currently active?',
  'Summarize today\'s trading performance and P&L.',
];

export const TradeMindCopilotModal: React.FC<TradeMindCopilotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: 'Hello! I am TradeMind AI Copilot. I analyze quantitative strategy signals, order execution ledgers, pre-trade risk logs, and Delta Exchange market conditions with strict RAG grounding.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 'supported',
      sources: [
        {
          record_type: 'strategy_doc',
          record_id: 'doc_rag_system',
          summary: 'TradeMind Read-Only Quantitative Assistant Engine',
        },
      ],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    setInputQuestion('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.askCopilot(query, { symbol: 'BTCUSDT' });
      const assistantMessage: Message = {
        id: response.request_id || `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        confidence: response.confidence,
        limitations: response.limitations,
        category: response.category,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reach TradeMind AI Copilot service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-container copilot-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '95%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0c',
          border: '1px solid #27272a',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f1f23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #121216 0%, #0a0a0c 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.15)',
              }}
            >
              <Bot size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                  TradeMind™ AI Copilot
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#1c1917',
                    border: '1px solid #44403c',
                    color: '#fbbf24',
                    letterSpacing: '0.04em',
                  }}
                >
                  RAG GROUNDED
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>
                Strict Read-Only Quant Intelligence • Decision &amp; Execution Explainability
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#10b981',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
              title="Autonomous orders cannot be triggered via AI prompt"
            >
              <ShieldAlert size={12} />
              <span>Read-Only</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Prompt Suggestions */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#121214',
            borderBottom: '1px solid #1c1c20',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#71717a', flexShrink: 0 }}>Suggested:</span>
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                color: '#e4e4e7',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#27272a';
                e.currentTarget.style.borderColor = '#52525b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#18181b';
                e.currentTarget.style.borderColor = '#27272a';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            minHeight: '320px',
            maxHeight: '52vh',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius:
                    msg.sender === 'user'
                      ? '12px 12px 2px 12px'
                      : '12px 12px 12px 2px',
                  backgroundColor: msg.sender === 'user' ? '#ffffff' : '#141417',
                  color: msg.sender === 'user' ? '#09090b' : '#f4f4f5',
                  border: msg.sender === 'user' ? 'none' : '1px solid #27272a',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                {/* Sources & Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid #27272a',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#71717a', width: '100%' }}>
                      Authoritative Sources Cited:
                    </span>
                    {msg.sources.map((src, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#1f1f23',
                          border: '1px solid #333338',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title={src.summary || src.record_id}
                      >
                        <FileText size={10} />
                        {src.record_type}: {src.record_id}
                      </span>
                    ))}
                  </div>
                )}

                {/* Limitations disclaimer */}
                {msg.limitations && msg.limitations.length > 0 && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#a1a1aa',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <AlertCircle size={11} style={{ color: '#fbbf24' }} />
                    <span>{msg.limitations.join(' • ')}</span>
                  </div>
                )}
              </div>

              <span style={{ fontSize: '10px', color: '#52525b', padding: '0 4px' }}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', padding: '8px 12px' }}>
              <RefreshCw size={14} className="spin-animation" />
              <span style={{ fontSize: '12px' }}>Querying Delta Exchange ledger &amp; RAG corpus...</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid #1f1f23',
            backgroundColor: '#0d0d10',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <input
            type="text"
            placeholder="Ask TradeMind about Strategy 1, orders, risk checks, or market state..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuestion.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: isLoading || !inputQuestion.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !inputQuestion.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Ask</span>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default TradeMindCopilotModal;
