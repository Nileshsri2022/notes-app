import { useState, useEffect, useRef } from 'react'
import { chat } from '../lib/api.js'

export default function ChatBot({ sourceText, concepts }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm your tutor for this material. Ask me any follow-up questions!" }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  useEffect(() => { scrollToBottom() }, [messages])

  // Escape closes the chat panel when open.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)
    try {
      const aiText = await chat(sourceText, concepts, userMsg)
      setMessages((prev) => [...prev, { role: 'ai', text: aiText }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Oops, something went wrong connecting to the AI.' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden animate-fade-in origin-bottom-right" role="dialog" aria-label="Tutor Chat">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-robot" aria-hidden="true"></i>
              </div>
              <span className="font-bold">Tutor Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="w-8 h-8 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50 space-y-4" aria-live="polite" aria-label="Chat messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center" aria-label="AI is typing">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                aria-label="Ask a question"
                className="flex-grow px-4 py-2 bg-slate-100 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 rounded-xl text-sm transition-colors outline-none"
              />
              <button onClick={handleSend} disabled={isTyping || !input.trim()} aria-label="Send message" className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500">
                <i className="fas fa-paper-plane" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} aria-label="Open tutor chat" className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-indigo-700 transition-all flex items-center justify-center text-2xl relative group focus-visible:ring-2 focus-visible:ring-indigo-400">
          <i className="fas fa-comment-dots" aria-hidden="true"></i>
          <span className="absolute -top-12 right-0 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Ask Tutor</span>
        </button>
      )}
    </div>
  );
}
