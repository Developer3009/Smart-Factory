import { useState } from 'react';
import { chatAgent } from '../api';
import { Bot, Send, User } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState<{role: 'user'|'agent', text: string, data?: any}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await chatAgent(userMsg);
      setMessages(prev => [...prev, { role: 'agent', text: res.answer, data: res.data }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Error connecting to AI agent.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <h1 className="text-3xl font-bold">AI Factory Assistant</h1>
      <div className="flex-1 bg-surface rounded-xl border border-slate-700 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-slate-400 h-full flex items-center justify-center text-center">
              <div>
                <Bot size={48} className="mx-auto mb-4 opacity-50" />
                <p>Hello! I am your AI assistant.</p>
                <p className="text-sm">Ask me about downtime, production runs, or inventory levels.</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'agent' && <div className="bg-primary/20 p-2 rounded-full h-10 w-10 flex items-center justify-center text-primary"><Bot size={20}/></div>}
              <div className={`max-w-[70%] p-4 rounded-xl ${m.role === 'user' ? 'bg-primary text-slate-900' : 'bg-slate-800'}`}>
                <p>{m.text}</p>
                {m.data && m.data.length > 0 && (
                  <div className="mt-4 bg-slate-900 p-2 rounded overflow-auto max-h-48 text-xs text-slate-300 font-mono">
                    {JSON.stringify(m.data, null, 2)}
                  </div>
                )}
              </div>
              {m.role === 'user' && <div className="bg-slate-700 p-2 rounded-full h-10 w-10 flex items-center justify-center text-slate-300"><User size={20}/></div>}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="bg-primary/20 p-2 rounded-full h-10 w-10 flex items-center justify-center text-primary"><Bot size={20}/></div>
              <div className="bg-slate-800 p-4 rounded-xl flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about the factory..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-slate-100"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
