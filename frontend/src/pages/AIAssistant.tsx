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

// Demo AI response generator
const generateDemoResponse = (query: string): string => {
  const q = query.toLowerCase();
  
  if (q.includes('task') || q.includes('pending')) {
    return `📋 **Your Pending Tasks (12 total)**\n\n1. **Follow up with TechCorp** - Due today\n   Contact John Smith about renewal\n\n2. **Send proposal to StartupXYZ** - Due tomorrow\n   Include pricing for premium plan\n\n3. **Schedule demo with Global Inc** - Due in 2 days\n   Michael Brown requested product demo\n\n4. **Review contract for Innovate Co** - Due in 3 days\n   Legal review needed\n\nWould you like me to help you prioritize these or create a new task?`;
  }
  
  if (q.includes('customer') || q.includes('lead')) {
    return `👥 **Customer Overview**\n\n**Total Customers:** 156\n**Active Leads:** 89\n**This Month's Conversions:** 12\n\n**Top Leads to Follow Up:**\n1. Sarah Johnson (StartupXYZ) - Score: 85\n2. James Taylor (CloudBase) - Score: 78\n3. Lisa Anderson (Digital First) - Score: 72\n\n**Recent Activity:**\n- 34 interactions this week\n- 15 emails sent\n- 8 calls made\n- 5 meetings scheduled\n\nWould you like more details on any specific customer?`;
  }
  
  if (q.includes('meeting') || q.includes('prepare')) {
    return `📅 **Meeting Preparation Brief**\n\n**Upcoming Meeting:** TechCorp Quarterly Review\n**Date:** Tomorrow at 2:00 PM\n**Attendee:** John Smith (CTO)\n\n**Key Points to Discuss:**\n• Contract renewal (expires in 30 days)\n• New feature requests from Q3\n• Satisfaction score: 4.5/5\n\n**Recent Interactions:**\n• Email on Nov 28 - Feature inquiry\n• Call on Nov 25 - Support issue (resolved)\n\n**Recommended Talking Points:**\n1. Thank them for continued partnership\n2. Address pending feature requests\n3. Discuss upgrade options\n\nWant me to generate more detailed notes?`;
  }
  
  if (q.includes('interaction') || q.includes('summary') || q.includes('summarize')) {
    return `📊 **Interaction Summary**\n\n**Last 7 Days:**\n- 📞 45 Calls (avg 12 min)\n- 📧 78 Emails sent\n- 🤝 23 Meetings held\n- 💬 56 Messages\n\n**Key Insights:**\n• Response rate: 67% (↑5% from last week)\n• Average deal cycle: 14 days\n• Most active day: Tuesday\n\n**Notable Interactions:**\n1. TechCorp - Positive feedback on new features\n2. StartupXYZ - Requested pricing proposal\n3. Global Inc - Scheduled product demo\n\nNeed a detailed report on any specific account?`;
  }
  
  if (q.includes('help') || q.includes('can you')) {
    return `🤖 **I can help you with:**\n\n**Customer Management:**\n• Find and search customers\n• View customer history\n• Analyze lead scores\n\n**Task Management:**\n• List pending tasks\n• Create new tasks\n• Set reminders\n\n**Meeting Prep:**\n• Generate briefing notes\n• Summarize past interactions\n• Suggest talking points\n\n**Analytics:**\n• Interaction summaries\n• Performance metrics\n• Trend analysis\n\nJust ask me anything! For example:\n- "Show my pending tasks"\n- "Summarize interactions with TechCorp"\n- "Prepare me for tomorrow's meeting"`;
  }
  
  return `I found some relevant information for your query: "${query}"\n\n**Summary:**\nBased on your CRM data, here are some insights:\n\n• 156 total customers in your database\n• 89 active leads requiring attention\n• 12 pending tasks for this week\n• 34 recent interactions logged\n\n**Recommended Actions:**\n1. Follow up with high-priority leads\n2. Review pending tasks\n3. Check upcoming meetings\n\nWould you like me to elaborate on any of these areas?`;
};

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
      console.error('Using demo mode for AI responses');
      // Demo mode - generate contextual responses
      const demoResponse = generateDemoResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: demoResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
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

