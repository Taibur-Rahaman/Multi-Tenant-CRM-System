import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff,
  Sparkles,
  User,
  Loader2,
  Volume2,
  VolumeX,
  RefreshCw
} from 'lucide-react';
import { aiApi } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI CRM assistant. I can help you with:\n\n• Finding customer information\n• Summarizing interactions\n• Preparing for meetings\n• Creating tasks and follow-ups\n• Analyzing leads and opportunities\n\nHow can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat(userMessage.content);
      
      if (response.data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.data.response || 'I apologize, but I couldn\'t process that request. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    setIsListening(!isListening);
    // Voice recognition would be implemented here
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const quickActions = [
    { label: 'Show my pending tasks', query: 'What are my pending tasks?' },
    { label: 'Summarize recent interactions', query: 'Summarize my recent customer interactions' },
    { label: 'Top leads to follow up', query: 'Which leads should I prioritize today?' },
    { label: 'Prepare for meetings', query: 'Help me prepare for my upcoming meetings' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Assistant</h2>
            <p className="text-sm text-blue-100">Powered by advanced AI</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => { setInput(action.query); handleSend(); }}
            className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-full transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
            }`}>
              {message.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            <div className={`max-w-[70%] ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-400">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleSpeak(message.content)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="animate-spin text-slate-400" size={20} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleVoiceInput}
            className={`p-3 rounded-full transition-colors ${
              isListening 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your CRM..."
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

