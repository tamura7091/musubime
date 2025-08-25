'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useDesignSystem } from '@/hooks/useDesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

// Minimal markdown renderer: supports **bold**, *italic*, inline code `code`, links [text](url), and newlines
function renderMarkdown(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  const regex = /\[(.+?)\]\((https?:[^\s)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  lines.forEach((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[1] && match[2]) {
        parts.push(
          <a key={`a-${lineIdx}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline">
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        parts.push(<strong key={`b-${lineIdx}-${match.index}`}>{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(<em key={`i-${lineIdx}-${match.index}`}>{match[4]}</em>);
      } else if (match[5]) {
        parts.push(<strong key={`b-${lineIdx}-${match.index}`}>{match[1]}</strong>);
      } else if (match[6]) {
        parts.push(<em key={`i-${lineIdx}-${match.index}`}>{match[4]}</em>);
      } else if (match[7]) {
        parts.push(<code key={`c-${lineIdx}-${match.index}`} className="px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(125,125,125,0.2)' }}>{match[5]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    elements.push(<div key={`l-${lineIdx}`}>{parts}</div>);
  });
  return <>{elements}</>;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className }: ChatBotProps) {
  const { user } = useAuth();
  const buildGreeting = (name?: string) => {
    const display = name && name.trim() ? `${name}さん、こんにちは！` : 'こんにちは！';
    return `${display}Musubimeのサポートアシスタントです。インフルエンサーマーケティングキャンペーンに関するご質問にお答えします。何かお手伝いできることはありますか？`;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greet',
      content: buildGreeting(user?.name),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ds = useDesignSystem();

  // Update greeting once user info becomes available
  useEffect(() => {
    if (!user?.name) return;
    setMessages(prev => {
      if (!prev.length || prev[0].id !== 'greet') return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], content: buildGreeting(user.name) };
      return updated;
    });
  }, [user?.name]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user?.id,
          userRole: user?.role,
          userName: user?.name,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'すみません、現在サービスに接続できません。しばらくしてからもう一度お試しください。',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't show chatbot if user is not logged in
  if (!user) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className || ''}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            backgroundColor: ds.button.primary.bg,
            color: ds.button.primary.text,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ds.button.primary.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ds.button.primary.bg;
          }}
        >
          <MessageCircle className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          
          {/* Pulse animation */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse opacity-20"
            style={{ backgroundColor: ds.button.primary.bg }}
          />
          
          {/* Tooltip */}
          <div 
            className="absolute bottom-full right-0 mb-2 px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{
              backgroundColor: ds.bg.surface,
              color: ds.text.primary,
              borderColor: ds.border.primary,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            AIアシスタントに質問する
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className || ''}`}>
      <div 
        className="w-96 h-[32rem] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: ds.bg.card,
          borderColor: ds.border.primary,
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            backgroundColor: ds.bg.surface,
            borderColor: ds.border.secondary,
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: ds.button.primary.bg }}
            >
              <Bot className="w-5 h-5" style={{ color: ds.button.primary.text }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: ds.text.primary }}>
                Musubime AI
              </h3>
              <p className="text-xs" style={{ color: ds.text.secondary }}>
                オンライン
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ color: ds.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ds.bg.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: message.sender === 'user' 
                    ? ds.text.accent 
                    : ds.button.primary.bg,
                }}
              >
                {message.sender === 'user' ? (
                  <User className="w-3 h-3" style={{ color: 'white' }} />
                ) : (
                  <Bot className="w-3 h-3" style={{ color: ds.button.primary.text }} />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    message.sender === 'user' 
                      ? 'rounded-br-md' 
                      : 'rounded-bl-md'
                  }`}
                  style={{
                    backgroundColor: message.sender === 'user' 
                      ? ds.text.accent 
                      : ds.bg.surface,
                    color: message.sender === 'user' 
                      ? 'white' 
                      : ds.text.primary,
                  }}
                >
                  {renderMarkdown(message.content)}
                </div>
                <div 
                  className={`text-xs mt-1 ${message.sender === 'user' ? 'text-right' : ''}`}
                  style={{ color: ds.text.secondary }}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ds.button.primary.bg }}
              >
                <Bot className="w-3 h-3" style={{ color: ds.button.primary.text }} />
              </div>
              <div
                className="inline-block px-3 py-2 rounded-2xl rounded-bl-md"
                style={{
                  backgroundColor: ds.bg.surface,
                  color: ds.text.primary,
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: ds.border.secondary }}
        >
          <div className="flex items-end space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-20"
              style={{
                backgroundColor: ds.form.input.bg,
                borderColor: ds.form.input.border,
                color: ds.text.primary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: ds.button.primary.bg,
                color: ds.button.primary.text,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = ds.button.primary.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = ds.button.primary.bg;
                }
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
